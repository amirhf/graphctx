import { describe, expect, it } from "vitest";
import { buildNodeActionContext } from "./buildNodeActionContext.js";
import { GraphActionError } from "./types.js";
import { testGraph } from "./testGraph.fixture.js";

describe("buildNodeActionContext", () => {
  it("includes target nodes", () => {
    const context = buildNodeActionContext(testGraph, ["question-1"]);

    expect(context.targetNodes.map((node) => node.id)).toEqual(["question-1"]);
  });

  it("includes direct neighbors and relevant edges", () => {
    const context = buildNodeActionContext(testGraph, ["question-1"]);

    expect(context.neighboringNodes.map((node) => node.id)).toEqual(["decision-1", "idea-1"]);
    expect(context.relevantEdges.map((edge) => edge.id)).toEqual(["edge-1", "edge-2", "edge-3"]);
  });

  it("includes high-signal global node groups within limits", () => {
    const context = buildNodeActionContext(testGraph, ["idea-1"], { maxGlobalNodes: 6 });

    expect(context.openQuestions.map((node) => node.id)).toEqual(["question-1"]);
    expect(context.activeAssumptions.map((node) => node.id)).toEqual(["assumption-1"]);
    expect(context.decisions.map((node) => node.id)).toEqual(["decision-1"]);
    expect(context.risks.map((node) => node.id)).toEqual(["risk-1"]);
    expect(context.tasks.map((node) => node.id)).toEqual(["task-1"]);
    expect(context.sourceNodes.map((node) => node.id)).toEqual(["source-1"]);
  });

  it("is deterministic", () => {
    const first = buildNodeActionContext(testGraph, ["question-1"]);
    const second = buildNodeActionContext(testGraph, ["question-1"]);

    expect(second).toEqual(first);
  });

  it("bounds neighboring nodes", () => {
    const context = buildNodeActionContext(testGraph, ["question-1"], { maxNeighbors: 1 });

    expect(context.neighboringNodes).toHaveLength(1);
    expect(context.neighboringNodes[0]?.id).toBe("decision-1");
  });

  it("throws when no target node is selected", () => {
    expect(() => buildNodeActionContext(testGraph, [])).toThrow(GraphActionError);
  });

  it("throws when a target node is missing", () => {
    expect(() => buildNodeActionContext(testGraph, ["missing"])).toThrow("Node not found: missing");
  });
});
