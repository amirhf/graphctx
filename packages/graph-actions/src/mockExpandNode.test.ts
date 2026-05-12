import { applyGraphPatch, validateGraphDocument, validateGraphPatchForGraph } from "@graphctx/graph-schema";
import { describe, expect, it } from "vitest";
import { mockExpandNode } from "./mockExpandNode.js";
import { testGraph } from "./testGraph.fixture.js";

describe("mockExpandNode", () => {
  it("returns a valid patch for a question node", () => {
    const patch = mockExpandNode(testGraph, ["question-1"]);

    expect(patch.addedNodes.map((node) => node.type)).toEqual(["answer", "assumption", "task"]);
    expect(validateGraphPatchForGraph(testGraph, patch).ok).toBe(true);
  });

  it("returns a valid patch for an idea node", () => {
    const patch = mockExpandNode(testGraph, ["idea-1"]);

    expect(patch.addedNodes.map((node) => node.type)).toEqual(["idea", "risk", "task"]);
    expect(validateGraphPatchForGraph(testGraph, patch).ok).toBe(true);
  });

  it("returns a valid patch for an assumption node", () => {
    const patch = mockExpandNode(testGraph, ["assumption-1"]);

    expect(patch.addedNodes.map((node) => node.type)).toEqual(["task", "risk", "question"]);
    expect(validateGraphPatchForGraph(testGraph, patch).ok).toBe(true);
  });

  it("applies without leaving dangling edges", () => {
    const patch = mockExpandNode(testGraph, ["question-1"]);
    const patched = applyGraphPatch(testGraph, patch);

    expect(validateGraphDocument(patched).ok).toBe(true);
    expect(patched.nodes.length).toBe(testGraph.nodes.length + 3);
    expect(patched.edges.length).toBe(testGraph.edges.length + 3);
  });

  it("is deterministic", () => {
    const first = mockExpandNode(testGraph, ["question-1"], "Prefer small patches.");
    const second = mockExpandNode(testGraph, ["question-1"], "Prefer small patches.");

    expect(second).toEqual(first);
  });

  it("avoids ID collisions", () => {
    const graphWithCollision = {
      ...testGraph,
      nodes: [
        ...testGraph.nodes,
        {
          id: "mock-question-1-answer",
          type: "answer" as const,
          title: "Existing answer",
          body: "Existing answer.",
          tags: [],
        },
      ],
    };
    const patch = mockExpandNode(graphWithCollision, ["question-1"]);

    expect(patch.addedNodes[0]?.id).toBe("mock-question-1-answer-2");
    expect(validateGraphPatchForGraph(graphWithCollision, patch).ok).toBe(true);
  });
});
