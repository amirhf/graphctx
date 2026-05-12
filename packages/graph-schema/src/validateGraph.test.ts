import { describe, expect, it } from "vitest";
import { validateContextGraph } from "./validateGraph.js";

const validGraph = {
  title: "Test Graph",
  summary: "A graph for tests.",
  nodes: [
    { id: "n1", type: "summary", title: "Summary", body: "Main summary." },
    { id: "n2", type: "decision", title: "Decision", body: "A decision." },
    { id: "n3", type: "assumption", title: "Assumption", body: "An assumption." },
    { id: "n4", type: "risk", title: "Risk", body: "A risk." },
    { id: "n5", type: "task", title: "Task", body: "A task." },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "leads_to" }],
};

describe("validateContextGraph", () => {
  it("passes a valid graph", () => {
    expect(validateContextGraph(validGraph).ok).toBe(true);
  });

  it("fails invalid node types", () => {
    const result = validateContextGraph({
      ...validGraph,
      nodes: [{ ...validGraph.nodes[0], type: "unknown" }],
    });

    expect(result.ok).toBe(false);
  });

  it("fails invalid edge types", () => {
    const result = validateContextGraph({
      ...validGraph,
      edges: [{ ...validGraph.edges[0], type: "relates_to" }],
    });

    expect(result.ok).toBe(false);
  });

  it("fails duplicate node ids", () => {
    const result = validateContextGraph({
      ...validGraph,
      nodes: [validGraph.nodes[0], { ...validGraph.nodes[1], id: "n1" }],
    });

    expect(result.errors).toContain("duplicate node id: n1");
  });

  it("fails duplicate edge ids", () => {
    const result = validateContextGraph({
      ...validGraph,
      edges: [validGraph.edges[0], { ...validGraph.edges[0] }],
    });

    expect(result.errors).toContain("duplicate edge id: e1");
  });

  it("fails edges pointing at missing nodes", () => {
    const result = validateContextGraph({
      ...validGraph,
      edges: [{ id: "e1", source: "n1", target: "missing", type: "supports" }],
    });

    expect(result.errors).toContain("edge e1 target does not exist: missing");
  });

  it("fails self-edges", () => {
    const result = validateContextGraph({
      ...validGraph,
      edges: [{ id: "e1", source: "n1", target: "n1", type: "supports" }],
    });

    expect(result.errors).toContain("edge e1 source and target must be different");
  });

  it("fails empty graphs", () => {
    const result = validateContextGraph({ ...validGraph, nodes: [] });

    expect(result.ok).toBe(false);
  });

  it("accepts quality pass metadata", () => {
    const result = validateContextGraph({
      ...validGraph,
      metadata: {
        generated_at: "2026-05-11T00:00:00.000Z",
        model: "openai/test",
        input_chars: 123,
        version: "phase-1.5",
        quality_pass: {
          enabled: true,
          patch_rounds: 1,
          missing_core_node_types_before: ["assumption", "question"],
          missing_core_node_types_after: ["question"],
          critique_summary: "Added a grounded assumption.",
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.graph?.metadata?.quality_pass?.patch_rounds).toBe(1);
  });
});
