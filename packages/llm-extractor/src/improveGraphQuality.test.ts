import { describe, expect, it } from "vitest";
import { improveGraphQuality } from "./improveGraphQuality.js";
import type { LlmClient } from "./llmClient.js";
import type { ContextGraph, GraphNode, NodeType } from "@graphctx/graph-schema";

const critique = {
  summary: "Missing reusable context.",
  missing_node_types: ["assumption", "question", "task"],
  issues: [
    {
      type: "missing_node_type",
      severity: "high",
      description: "Tasks are missing.",
      suggested_fix: "Add grounded tasks.",
    },
  ],
  patch_plan: ["Add supported reusable context."],
};

function node(id: string, type: NodeType, withSource = true): GraphNode {
  return {
    id,
    type,
    title: `${type} ${id}`,
    body: `${type} body.`,
    tags: [],
    source_span: withSource ? { quote: `${type} body.` } : undefined,
  };
}

function graph(nodes: GraphNode[]): ContextGraph {
  return {
    title: "Quality Test",
    summary: "Testing quality.",
    nodes,
    edges:
      nodes.length > 1
        ? [{ id: "e1", source: nodes[0].id, target: nodes[1].id, type: "leads_to", rationale: "Related." }]
        : [],
  };
}

function clientReturningPatch(patch: unknown): LlmClient {
  let calls = 0;
  return {
    async completeJson() {
      calls += 1;
      return calls === 1 ? critique : patch;
    },
  };
}

describe("improveGraphQuality", () => {
  it("skips patching when coverage is already good", async () => {
    const sourceGraph = graph([
      node("n1", "decision"),
      node("n2", "assumption"),
      node("n3", "risk"),
      node("n4", "question"),
      node("n5", "task"),
      node("n6", "idea"),
      node("n7", "summary"),
      node("n8", "source"),
    ]);

    const result = await improveGraphQuality({ input: "input", graph: sourceGraph, options: { client: clientReturningPatch({}) } });

    expect(result.changed).toBe(false);
    expect(result.patchRounds).toBe(0);
    expect(result.critique.summary).toContain("skipped");
  });

  it("accepts a valid patch with fewer missing core node types", async () => {
    const sourceGraph = graph([node("n1", "decision"), node("n2", "risk")]);
    const patchedGraph = graph([
      node("n1", "decision"),
      node("n2", "risk"),
      node("n3", "assumption"),
      node("n4", "question"),
      node("n5", "task"),
    ]);

    const result = await improveGraphQuality({
      input: "input",
      graph: sourceGraph,
      options: { client: clientReturningPatch(patchedGraph) },
    });

    expect(result.acceptedPatch).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.coverageAfter.missingCoreNodeTypes).toEqual([]);
    expect(result.improvedGraph.metadata?.quality_pass?.patch_rounds).toBe(1);
  });

  it("rejects an invalid patch", async () => {
    const sourceGraph = graph([node("n1", "decision"), node("n2", "risk")]);
    const result = await improveGraphQuality({
      input: "input",
      graph: sourceGraph,
      options: { client: clientReturningPatch({ ...sourceGraph, nodes: [] }) },
    });

    expect(result.acceptedPatch).toBe(false);
    expect(result.diagnostics.join("\n")).toContain("failed validation");
  });

  it("rejects a patch with node explosion", async () => {
    const sourceGraph = graph([node("n1", "decision"), node("n2", "risk")]);
    const patchedGraph = graph(
      Array.from({ length: 61 }, (_, index) =>
        node(`n${index + 1}`, index === 0 ? "decision" : index === 1 ? "risk" : index === 2 ? "task" : "idea"),
      ),
    );

    const result = await improveGraphQuality({
      input: "input",
      graph: sourceGraph,
      options: { client: clientReturningPatch(patchedGraph) },
    });

    expect(result.acceptedPatch).toBe(false);
    expect(result.diagnostics.join("\n")).toContain("above the recommended maximum");
  });

  it("rejects a patch with significant source traceability regression", async () => {
    const sourceGraph = graph([node("n1", "decision"), node("n2", "risk")]);
    const patchedGraph = graph([
      node("n1", "decision", false),
      node("n2", "risk", false),
      node("n3", "assumption", false),
      node("n4", "question", false),
      node("n5", "task", false),
    ]);

    const result = await improveGraphQuality({
      input: "input",
      graph: sourceGraph,
      options: { client: clientReturningPatch(patchedGraph) },
    });

    expect(result.acceptedPatch).toBe(false);
    expect(result.diagnostics.join("\n")).toContain("source traceability dropped");
  });
});
