import { describe, expect, it } from "vitest";
import { toContextGraph, toGraphDocument, validateGraphDocument } from "./graphDocument.js";
import type { ContextGraph, GraphDocument } from "./types.js";

const contextGraph: ContextGraph = {
  title: "Phase 2 Graph",
  summary: "A graph for document tests.",
  nodes: [
    { id: "n1", type: "summary", title: "Summary", body: "Main summary.", tags: [] },
    { id: "n2", type: "decision", title: "Decision", body: "A decision.", tags: [] },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "leads_to" }],
  metadata: { version: "phase-1.5" },
};

const graphDocument: GraphDocument = {
  id: "doc1",
  title: "Phase 2 Graph",
  summary: "A graph for document tests.",
  nodes: contextGraph.nodes,
  edges: contextGraph.edges,
  createdAt: "2026-05-12T00:00:00.000Z",
  updatedAt: "2026-05-12T00:00:00.000Z",
  metadata: { phase: "phase2" },
};

describe("GraphDocument utilities", () => {
  it("wraps a ContextGraph as a GraphDocument", () => {
    const document = toGraphDocument(contextGraph, {
      id: "phase2-doc",
      sourceText: "Source notes.",
      createdAt: "2026-05-12T00:00:00.000Z",
    });

    expect(document.id).toBe("phase2-doc");
    expect(document.sourceText).toBe("Source notes.");
    expect(document.metadata?.version).toBe("phase-1.5");
    expect(validateGraphDocument(document).ok).toBe(true);
  });

  it("converts a GraphDocument back to a ContextGraph", () => {
    expect(toContextGraph(graphDocument)).toEqual({
      title: graphDocument.title,
      summary: graphDocument.summary,
      nodes: graphDocument.nodes,
      edges: graphDocument.edges,
      metadata: graphDocument.metadata,
    });
  });

  it("fails duplicate node ids", () => {
    const result = validateGraphDocument({
      ...graphDocument,
      nodes: [graphDocument.nodes[0], { ...graphDocument.nodes[1], id: "n1" }],
    });

    expect(result.errors).toContain("duplicate node id: n1");
  });

  it("fails duplicate edge ids", () => {
    const result = validateGraphDocument({
      ...graphDocument,
      edges: [graphDocument.edges[0], { ...graphDocument.edges[0] }],
    });

    expect(result.errors).toContain("duplicate edge id: e1");
  });

  it("fails dangling edges", () => {
    const result = validateGraphDocument({
      ...graphDocument,
      edges: [{ id: "e1", source: "n1", target: "missing", type: "supports" }],
    });

    expect(result.errors).toContain("edge e1 target does not exist: missing");
  });

  it("fails invalid source spans", () => {
    const result = validateGraphDocument({
      ...graphDocument,
      nodes: [
        {
          ...graphDocument.nodes[0],
          source_span: { start: 10, end: 5 },
        },
      ],
      edges: [],
    });

    expect(result.errors).toContain(
      "node n1 source_span start must be less than or equal to end",
    );
  });
});
