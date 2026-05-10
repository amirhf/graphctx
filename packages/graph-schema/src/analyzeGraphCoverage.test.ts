import { describe, expect, it } from "vitest";
import { analyzeGraphCoverage } from "./analyzeGraphCoverage.js";
import type { ContextGraph } from "./types.js";

const graph: ContextGraph = {
  title: "Coverage Test",
  summary: "A graph for coverage tests.",
  nodes: [
    {
      id: "n1",
      type: "decision",
      title: "Decision",
      body: "A decision.",
      tags: [],
      source_span: { quote: "A decision." },
    },
    {
      id: "n2",
      type: "risk",
      title: "Risk",
      body: "A risk.",
      tags: [],
      source_span: { quote: "A risk." },
    },
  ],
  edges: [],
};

describe("analyzeGraphCoverage", () => {
  it("reports missing core node types", () => {
    const analysis = analyzeGraphCoverage(graph);

    expect(analysis.missingCoreNodeTypes).toEqual(["assumption", "question", "task"]);
    expect(analysis.findings.map((finding) => finding.id)).toContain("missing-assumption");
    expect(analysis.findings.map((finding) => finding.id)).toContain("missing-question");
    expect(analysis.findings.map((finding) => finding.id)).toContain("missing-task");
  });

  it("computes source traceability ratio", () => {
    const analysis = analyzeGraphCoverage({
      ...graph,
      nodes: [
        graph.nodes[0],
        { ...graph.nodes[1], source_span: undefined },
      ],
    });

    expect(analysis.sourceTraceabilityRatio).toBe(0.5);
    expect(analysis.findings.map((finding) => finding.id)).toContain("low-source-traceability");
  });

  it("reports empty edges and small graphs without failing coverage analysis", () => {
    const analysis = analyzeGraphCoverage(graph);

    expect(analysis.totalEdges).toBe(0);
    expect(analysis.findings.map((finding) => finding.id)).toContain("no-edges");
    expect(analysis.findings.map((finding) => finding.id)).toContain("few-nodes");
  });

  it("does not report missing core node types when all are present", () => {
    const analysis = analyzeGraphCoverage({
      ...graph,
      nodes: [
        ...graph.nodes,
        { id: "n3", type: "assumption", title: "Assumption", body: "An assumption.", tags: [] },
        { id: "n4", type: "question", title: "Question", body: "A question?", tags: [] },
        { id: "n5", type: "task", title: "Task", body: "A task.", tags: [] },
      ],
      edges: [{ id: "e1", source: "n1", target: "n2", type: "leads_to", rationale: "Decision creates risk." }],
    });

    expect(analysis.missingCoreNodeTypes).toEqual([]);
  });

  it("warns when the graph has more than 60 nodes", () => {
    const analysis = analyzeGraphCoverage({
      ...graph,
      nodes: Array.from({ length: 61 }, (_, index) => ({
        id: `n${index + 1}`,
        type: index === 0 ? "decision" : "idea",
        title: `Node ${index + 1}`,
        body: "Body.",
        tags: [],
      })),
    });

    expect(analysis.findings.map((finding) => finding.id)).toContain("too-many-nodes");
  });
});
