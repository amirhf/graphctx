import { describe, expect, it } from "vitest";
import { applyGraphPatch, validateGraphPatchForGraph } from "./patch.js";
import type { GraphDocument, GraphPatch } from "./types.js";

const graph: GraphDocument = {
  id: "doc1",
  title: "Patch Graph",
  summary: "A graph for patch tests.",
  createdAt: "2026-05-12T00:00:00.000Z",
  updatedAt: "2026-05-12T00:00:00.000Z",
  nodes: [
    { id: "q1", type: "question", title: "Question", body: "What should we do?", tags: [] },
    { id: "d1", type: "decision", title: "Decision", body: "Ship the MVP.", tags: [] },
    { id: "r1", type: "risk", title: "Risk", body: "Scope may grow.", tags: [] },
  ],
  edges: [
    { id: "e1", source: "d1", target: "q1", type: "answers" },
    { id: "e2", source: "r1", target: "d1", type: "depends_on" },
  ],
};

const validPatch: GraphPatch = {
  id: "patch1",
  action: "expand_node",
  targetNodeIds: ["q1"],
  summary: "Adds an answer and follow-up task.",
  addedNodes: [
    { id: "a1", type: "answer", title: "Answer", body: "Start with a focused MVP.", tags: [] },
    { id: "t1", type: "task", title: "Task", body: "Validate the MVP scope.", tags: [] },
  ],
  updatedNodes: [{ id: "q1", status: "accepted" }],
  addedEdges: [
    { id: "e3", source: "a1", target: "q1", type: "answers" },
    { id: "e4", source: "t1", target: "a1", type: "depends_on" },
  ],
  createdAt: "2026-05-12T00:00:00.000Z",
};

describe("graph patches", () => {
  it("validates a valid patch", () => {
    expect(validateGraphPatchForGraph(graph, validPatch).ok).toBe(true);
  });

  it("applies a valid patch", () => {
    const patched = applyGraphPatch(graph, validPatch);

    expect(patched.nodes.map((node) => node.id)).toEqual(["q1", "d1", "r1", "a1", "t1"]);
    expect(patched.edges.map((edge) => edge.id)).toEqual(["e1", "e2", "e3", "e4"]);
    expect(patched.nodes.find((node) => node.id === "q1")?.status).toBe("accepted");
  });

  it("fails a patch with an unknown updated node", () => {
    const result = validateGraphPatchForGraph(graph, {
      ...validPatch,
      updatedNodes: [{ id: "missing", title: "Missing" }],
    });

    expect(result.errors).toContain("updated node does not exist: missing");
  });

  it("fails a patch with a dangling added edge", () => {
    const result = validateGraphPatchForGraph(graph, {
      ...validPatch,
      addedEdges: [{ id: "e3", source: "a1", target: "missing", type: "answers" }],
    });

    expect(result.errors).toContain("added edge e3 target does not exist: missing");
  });

  it("fails a patch with a duplicate added node id", () => {
    const result = validateGraphPatchForGraph(graph, {
      ...validPatch,
      addedNodes: [
        { id: "a1", type: "answer", title: "Answer", body: "Answer.", tags: [] },
        { id: "a1", type: "answer", title: "Answer 2", body: "Answer 2.", tags: [] },
      ],
    });

    expect(result.errors).toContain("duplicate added node id: a1");
  });

  it("deleting a node removes related edges", () => {
    const patched = applyGraphPatch(graph, {
      ...validPatch,
      addedNodes: [],
      updatedNodes: [],
      deletedNodeIds: ["d1"],
      addedEdges: [],
    });

    expect(patched.nodes.map((node) => node.id)).toEqual(["q1", "r1"]);
    expect(patched.edges).toEqual([]);
  });

  it("updates updatedAt when applying a patch", () => {
    const patched = applyGraphPatch(graph, validPatch);

    expect(patched.updatedAt).not.toBe(graph.updatedAt);
  });

  it("throws when applying an invalid patch", () => {
    expect(() =>
      applyGraphPatch(graph, {
        ...validPatch,
        updatedNodes: [{ id: "missing", title: "Missing" }],
      }),
    ).toThrow("Graph patch validation failed");
  });
});
