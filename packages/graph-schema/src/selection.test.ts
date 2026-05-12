import { describe, expect, it } from "vitest";
import { getSelectedSubgraph } from "./selection.js";
import type { GraphDocument } from "./types.js";

const graph: GraphDocument = {
  id: "doc1",
  title: "Selection Graph",
  summary: "A graph for selection tests.",
  createdAt: "2026-05-12T00:00:00.000Z",
  updatedAt: "2026-05-12T00:00:00.000Z",
  nodes: [
    { id: "n1", type: "summary", title: "Summary", body: "Main summary.", tags: [] },
    { id: "n2", type: "decision", title: "Decision", body: "A decision.", tags: [] },
    { id: "n3", type: "risk", title: "Risk", body: "A risk.", tags: [] },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", type: "leads_to" },
    { id: "e2", source: "n2", target: "n3", type: "leads_to" },
  ],
};

describe("getSelectedSubgraph", () => {
  it("returns the full graph for an empty selection", () => {
    const subgraph = getSelectedSubgraph(graph, []);

    expect(subgraph.nodes.map((node) => node.id)).toEqual(["n1", "n2", "n3"]);
    expect(subgraph.edges.map((edge) => edge.id)).toEqual(["e1", "e2"]);
  });

  it("includes only selected nodes", () => {
    const subgraph = getSelectedSubgraph(graph, ["n1", "n2"]);

    expect(subgraph.nodes.map((node) => node.id)).toEqual(["n1", "n2"]);
  });

  it("includes only internal selected edges", () => {
    const subgraph = getSelectedSubgraph(graph, ["n1", "n2"]);

    expect(subgraph.edges.map((edge) => edge.id)).toEqual(["e1"]);
  });

  it("deduplicates selected ids and records selection metadata", () => {
    const subgraph = getSelectedSubgraph(graph, ["n2", "n2"]);

    expect(subgraph.nodes.map((node) => node.id)).toEqual(["n2"]);
    expect(subgraph.metadata?.selectedNodeIds).toEqual(["n2"]);
    expect(subgraph.metadata?.parentGraphId).toBe("doc1");
  });
});
