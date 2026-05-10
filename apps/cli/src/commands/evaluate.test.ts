import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runEvaluateAllCommand, runEvaluateCommand } from "./evaluate.js";

const validGraph = {
  title: "CLI Evaluation Test",
  summary: "A graph for CLI evaluator tests.",
  nodes: [
    { id: "n1", type: "summary", title: "Summary", body: "A summary." },
    { id: "n2", type: "decision", title: "Decision", body: "A decision." },
    { id: "n3", type: "assumption", title: "Assumption", body: "An assumption." },
    { id: "n4", type: "risk", title: "Risk", body: "A risk." },
    { id: "n5", type: "task", title: "Task", body: "A task." },
    { id: "n6", type: "question", title: "Question", body: "A question?" },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "leads_to", rationale: "Related." }],
};

const validContextPack = `# Context Pack: CLI Evaluation Test

## Goal
Test goal.

## Current Understanding
Current understanding.

## Key Ideas
- Idea

## Decisions Made
- Decision

## Assumptions
- Assumption

## Open Questions
- Question

## Risks
- Risk

## Tasks / Next Actions
- [ ] Task

## Useful Source Notes
- Source

## Suggested Prompt for Next AI Session
Use this context.
`;

async function writeExampleOutputs(exampleDir: string, outputDir = path.join(exampleDir, "outputs")): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(exampleDir, "input.md"), "Original input.", "utf8");
  await writeFile(path.join(outputDir, "graph.json"), `${JSON.stringify(validGraph, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "context-pack.md"), validContextPack, "utf8");
}

describe("evaluate commands", () => {
  it("evaluates outputs from the default outputs subfolder", async () => {
    const exampleDir = await mkdtemp(path.join(os.tmpdir(), "graphctx-cli-eval-"));
    const outputDir = path.join(exampleDir, "outputs");
    await writeExampleOutputs(exampleDir, outputDir);

    await runEvaluateCommand(exampleDir, { skipLlm: true });

    const json = await readFile(path.join(outputDir, "evaluation.json"), "utf8");
    expect(JSON.parse(json).files.graph).toBe("outputs/graph.json");
  });

  it("evaluates a custom output directory", async () => {
    const exampleDir = await mkdtemp(path.join(os.tmpdir(), "graphctx-cli-eval-custom-"));
    const outputDir = path.join(exampleDir, "custom");
    await writeExampleOutputs(exampleDir, outputDir);

    await runEvaluateCommand(exampleDir, { skipLlm: true, outDir: "custom" });

    const markdown = await readFile(path.join(outputDir, "evaluation.auto.md"), "utf8");
    expect(markdown).toContain("# Automated Evaluation");
  });

  it("evaluate-all detects generated outputs in outputs subfolders", async () => {
    const examplesDir = await mkdtemp(path.join(os.tmpdir(), "graphctx-cli-eval-all-"));
    const readyExample = path.join(examplesDir, "ready");
    const skippedExample = path.join(examplesDir, "missing-outputs");
    await writeExampleOutputs(readyExample);
    await mkdir(skippedExample, { recursive: true });
    await writeFile(path.join(skippedExample, "input.md"), "Original input.", "utf8");

    await runEvaluateAllCommand(examplesDir, { skipLlm: true });

    const json = await readFile(path.join(readyExample, "outputs", "evaluation.json"), "utf8");
    expect(JSON.parse(json).exampleName).toBe("ready");
  });
});
