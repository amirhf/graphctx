import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDeterministicEvaluation } from "./deterministicChecks.js";
import { evaluateExample } from "./evaluate.js";
import { JudgeEvaluationSchema } from "./judgeSchema.js";
import { renderAutomatedEvaluationMarkdown } from "./renderAutomatedEvaluationMarkdown.js";
import type { AutomatedEvaluationResult } from "./types.js";

const validGraph = {
  title: "Evaluation Test",
  summary: "A graph for evaluator tests.",
  nodes: [
    {
      id: "n1",
      type: "summary",
      title: "Summary",
      body: "This is a summary.",
      source_span: { quote: "This is a summary." },
    },
    { id: "n2", type: "decision", title: "Decision", body: "A decision." },
    { id: "n3", type: "assumption", title: "Assumption", body: "An assumption." },
    { id: "n4", type: "risk", title: "Risk", body: "A risk." },
    { id: "n5", type: "task", title: "Task", body: "A task." },
    { id: "n6", type: "question", title: "Question", body: "A question?" },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "leads_to" }],
};

const validContextPack = `# Context Pack: Evaluation Test

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

describe("automated evaluation", () => {
  it("detects invalid graph JSON", () => {
    const result = runDeterministicEvaluation({ ...validGraph, nodes: [] }, validContextPack);

    expect(result.graphValidation.ok).toBe(false);
    expect(result.estimatedScore).toBe(1);
  });

  it("flags missing Context Pack sections", () => {
    const result = runDeterministicEvaluation(validGraph, "## Goal\nOnly one section.");

    expect(result.missingSections).toContain("## Decisions Made");
    expect(result.warnings).toContain("missing Context Pack section: ## Decisions Made");
  });

  it("reports missing important node categories", () => {
    const result = runDeterministicEvaluation(
      { ...validGraph, nodes: validGraph.nodes.filter((node) => node.type !== "risk") },
      validContextPack,
    );

    expect(result.missingImportantNodeTypes).toContain("risk");
  });

  it("validates judge responses", () => {
    const validJudge = {
      criteria: Object.fromEntries(
        [
          "captures_main_goal",
          "captures_key_ideas",
          "captures_decisions",
          "captures_assumptions",
          "captures_risks",
          "captures_tasks",
          "context_pack_usefulness",
          "graph_coherence",
          "source_traceability",
          "overall_reuse_value",
        ].map((criterion) => [criterion, { score: 4, notes: `${criterion} notes`, evidence: "Evidence." }]),
      ),
      would_reuse: "yes",
      biggest_missing_value: "More source traceability.",
      recommended_changes: ["Improve quotes."],
    };

    expect(JudgeEvaluationSchema.parse(validJudge).would_reuse).toBe("yes");
    expect(() =>
      JudgeEvaluationSchema.parse({
        ...validJudge,
        criteria: {
          ...validJudge.criteria,
          overall_reuse_value: { score: 6, notes: "Too high.", evidence: "No." },
        },
      }),
    ).toThrow();
  });

  it("renders Markdown with score table and recommended changes", () => {
    const deterministic = runDeterministicEvaluation(validGraph, validContextPack);
    const result: AutomatedEvaluationResult = {
      files: { input: "input.md", graph: "graph.json", contextPack: "context-pack.md" },
      generatedAt: "2026-05-10T00:00:00.000Z",
      mode: "deterministic",
      deterministic,
      judge: null,
      overallScore: deterministic.estimatedScore,
      wouldReuse: "yes",
      biggestMissingValue: "None.",
      recommendedChanges: ["Keep evaluating."],
    };

    const markdown = renderAutomatedEvaluationMarkdown(result);

    expect(markdown).toContain("| Category | Score 1-5 | Notes |");
    expect(markdown).toContain("Keep evaluating.");
  });

  it("evaluates an example without API keys when skipLlm is true", async () => {
    const exampleDir = await mkdtemp(path.join(os.tmpdir(), "graphctx-eval-"));
    const outputDir = path.join(exampleDir, "outputs");
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(exampleDir, "input.md"), "Original input.", "utf8");
    await writeFile(path.join(outputDir, "graph.json"), `${JSON.stringify(validGraph, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "context-pack.md"), validContextPack, "utf8");

    const result = await evaluateExample(exampleDir, { skipLlm: true });
    const json = await readFile(path.join(outputDir, "evaluation.json"), "utf8");
    const markdown = await readFile(path.join(outputDir, "evaluation.auto.md"), "utf8");

    expect(result.mode).toBe("deterministic");
    expect(result.files.graph).toBe("outputs/graph.json");
    expect(JSON.parse(json).overallScore).toBe(result.overallScore);
    expect(markdown).toContain("# Automated Evaluation");
  });

  it("evaluates a custom example output directory", async () => {
    const exampleDir = await mkdtemp(path.join(os.tmpdir(), "graphctx-eval-custom-"));
    const outputDir = path.join(exampleDir, "custom");
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(exampleDir, "input.md"), "Original input.", "utf8");
    await writeFile(path.join(outputDir, "graph.json"), `${JSON.stringify(validGraph, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "context-pack.md"), validContextPack, "utf8");

    const result = await evaluateExample(exampleDir, { skipLlm: true, outDir: "custom" });
    const json = await readFile(path.join(outputDir, "evaluation.json"), "utf8");

    expect(result.files.graph).toBe("custom/graph.json");
    expect(JSON.parse(json).files.contextPack).toBe("custom/context-pack.md");
  });
});
