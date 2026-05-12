import { evaluateExample } from "@graphctx/evaluation";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runExtractCommand } from "./extract.js";
import { findExampleDirs, runExamplesCommand } from "./runExamples.js";

vi.mock("./extract.js", () => ({
  runExtractCommand: vi.fn(),
}));

vi.mock("@graphctx/evaluation", () => ({
  evaluateExample: vi.fn(),
}));

async function makeExamplesDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "graphctx-run-examples-"));
}

async function writeInput(exampleDir: string): Promise<void> {
  await mkdir(exampleDir, { recursive: true });
  await writeFile(path.join(exampleDir, "input.md"), "Example input.", "utf8");
}

function mockEvaluationScore(score: number): void {
  vi.mocked(evaluateExample).mockResolvedValue({
    files: { input: "input.md", graph: "outputs/graph.json", contextPack: "outputs/context-pack.md" },
    generatedAt: "2026-05-12T00:00:00.000Z",
    mode: "hybrid",
    deterministic: {
      graphValidation: { ok: true, errors: [], warnings: [] },
      nodeCount: 1,
      edgeCount: 0,
      nodeTypeCounts: {},
      missingImportantNodeTypes: [],
      requiredSections: [],
      missingSections: [],
      taskChecklist: { taskNodes: 0, checklistItems: 0, ok: true },
      sourceTraceability: { nodesWithSourceQuote: 0, totalNodes: 1, ratio: 0 },
      warnings: [],
      estimatedScore: score,
    },
    judge: null,
    overallScore: score,
    wouldReuse: score >= 4 ? "yes" : "maybe",
    biggestMissingValue: "None.",
    recommendedChanges: [],
  });
}

describe("runExamplesCommand", () => {
  beforeEach(() => {
    vi.mocked(runExtractCommand).mockReset();
    vi.mocked(evaluateExample).mockReset();
    vi.mocked(runExtractCommand).mockResolvedValue(undefined);
    mockEvaluationScore(4);
  });

  it("finds immediate child folders with input.md and skips folders without input", async () => {
    const examplesDir = await makeExamplesDir();
    await writeInput(path.join(examplesDir, "ready"));
    await mkdir(path.join(examplesDir, "missing-input"), { recursive: true });

    const result = await findExampleDirs(examplesDir);

    expect(result.examples.map((exampleDir) => path.basename(exampleDir))).toEqual(["ready"]);
    expect(result.skipped.map((exampleDir) => path.basename(exampleDir))).toEqual(["missing-input"]);
  });

  it("runs extraction then LLM evaluation by default for each valid example", async () => {
    const examplesDir = await makeExamplesDir();
    await writeInput(path.join(examplesDir, "alpha"));
    await writeInput(path.join(examplesDir, "beta"));

    const summary = await runExamplesCommand(examplesDir, {});

    expect(summary).toMatchObject({ extracted: 2, evaluated: 2, skipped: 0, failed: 0 });
    expect(runExtractCommand).toHaveBeenCalledTimes(2);
    expect(evaluateExample).toHaveBeenCalledTimes(2);
    expect(evaluateExample).toHaveBeenCalledWith(path.join(examplesDir, "alpha"), {
      provider: undefined,
      model: undefined,
      temperature: undefined,
      skipLlm: undefined,
    });
  });

  it("passes quality pass and patch options to extraction", async () => {
    const examplesDir = await makeExamplesDir();
    await writeInput(path.join(examplesDir, "alpha"));

    await runExamplesCommand(examplesDir, {
      provider: "openrouter",
      model: "openai/gpt-4.1-mini",
      temperature: "0.1",
      maxInputChars: "1000",
      qualityPass: true,
      patchModel: "openai/gpt-4.1",
      maxPatchRounds: "2",
    });

    expect(runExtractCommand).toHaveBeenCalledWith(path.join(examplesDir, "alpha", "input.md"), {
      provider: "openrouter",
      model: "openai/gpt-4.1-mini",
      maxInputChars: "1000",
      temperature: "0.1",
      qualityPass: true,
      patchModel: "openai/gpt-4.1",
      maxPatchRounds: "2",
    });
  });

  it("passes skip-llm and judge options only to evaluation", async () => {
    const examplesDir = await makeExamplesDir();
    await writeInput(path.join(examplesDir, "alpha"));

    await runExamplesCommand(examplesDir, {
      skipLlm: true,
      judgeProvider: "openai",
      judgeModel: "gpt-4.1",
      judgeTemperature: "0.2",
    });

    expect(runExtractCommand).toHaveBeenCalledWith(path.join(examplesDir, "alpha", "input.md"), {
      provider: undefined,
      model: undefined,
      maxInputChars: undefined,
      temperature: undefined,
      qualityPass: undefined,
      patchModel: undefined,
      maxPatchRounds: undefined,
    });
    expect(evaluateExample).toHaveBeenCalledWith(path.join(examplesDir, "alpha"), {
      provider: "openai",
      model: "gpt-4.1",
      temperature: 0.2,
      skipLlm: true,
    });
  });

  it("continues after a failed example and exits nonzero at the end", async () => {
    const examplesDir = await makeExamplesDir();
    await writeInput(path.join(examplesDir, "alpha"));
    await writeInput(path.join(examplesDir, "beta"));
    vi.mocked(runExtractCommand).mockImplementation(async (inputFile) => {
      if (inputFile.includes(`${path.sep}alpha${path.sep}`)) {
        throw new Error("Extraction failed.");
      }
    });

    await expect(runExamplesCommand(examplesDir, {})).rejects.toThrow("1 example run(s) failed");
    expect(runExtractCommand).toHaveBeenCalledTimes(2);
    expect(evaluateExample).toHaveBeenCalledTimes(1);
    expect(evaluateExample).toHaveBeenCalledWith(path.join(examplesDir, "beta"), expect.any(Object));
  });

  it("fails after evaluating all examples when fail-under threshold is missed", async () => {
    const examplesDir = await makeExamplesDir();
    await writeInput(path.join(examplesDir, "alpha"));
    await writeInput(path.join(examplesDir, "beta"));
    mockEvaluationScore(3);

    await expect(runExamplesCommand(examplesDir, { failUnder: "4" })).rejects.toThrow("2 example run(s) failed");
    expect(evaluateExample).toHaveBeenCalledTimes(2);
  });
});
