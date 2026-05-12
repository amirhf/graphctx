import { describe, expect, it } from "vitest";
import type { ContextGraph, CoverageAnalysis } from "@graphctx/graph-schema";
import { buildGraphCritiquePrompt, GraphCritiqueSchema } from "./critiquePrompt.js";
import { buildGraphPatchPrompt } from "./patchPrompt.js";

const graph: ContextGraph = {
  title: "Prompt Test",
  summary: "Testing prompts.",
  nodes: [{ id: "n1", type: "decision", title: "Decision", body: "Keep it local.", tags: [] }],
  edges: [],
};

const coverage: CoverageAnalysis = {
  nodeTypeCounts: {
    idea: 0,
    question: 0,
    assumption: 0,
    decision: 1,
    risk: 0,
    task: 0,
    source: 0,
    summary: 0,
  },
  totalNodes: 1,
  totalEdges: 0,
  sourceTraceabilityRatio: 0,
  taskChecklistCount: 0,
  findings: [{ id: "missing-task", severity: "warning", message: "Graph has zero task nodes." }],
  missingCoreNodeTypes: ["assumption", "risk", "question", "task"],
  reusableContextScoreEstimate: 3,
};

describe("quality prompts", () => {
  it("builds a critique prompt with coverage, graph, input, and strict JSON instructions", () => {
    const prompt = buildGraphCritiquePrompt({ input: "Original input.", graph, coverage });

    expect(prompt).toContain("Return ONLY valid JSON");
    expect(prompt).toContain("missing_node_types");
    expect(prompt).toContain("missing-task");
    expect(prompt).toContain("Current graph JSON");
    expect(prompt).toContain("Original input.");
  });

  it("builds a patch prompt that asks for a complete grounded graph", () => {
    const prompt = buildGraphPatchPrompt({
      input: "Original input.",
      graph,
      coverage,
      critique: {
        summary: "Missing reusable context.",
        missing_node_types: ["assumption", "question", "task"],
        issues: [],
        patch_plan: ["Add supported tasks."],
      },
    });

    expect(prompt).toContain("Return a complete patched ContextGraph JSON object, not a diff");
    expect(prompt).toContain("Do not fabricate unsupported content");
    expect(prompt).toContain("source_span.quote");
    expect(prompt).toContain("Preserve good existing nodes");
  });

  it("filters non-core missing node types from critique responses", () => {
    const critique = GraphCritiqueSchema.parse({
      summary: "Missing source traceability and tasks.",
      missing_node_types: ["source", "task", "open questions"],
      issues: [],
      patch_plan: ["Add task nodes and source quotes where grounded."],
    });

    expect(critique.missing_node_types).toEqual(["task", "question"]);
  });
});
