import type { LlmClient } from "@graphctx/llm-extractor";
import { describe, expect, it } from "vitest";
import { expandNodeWithContext } from "./expandNodeWithContext.js";
import { GraphActionError } from "./types.js";
import { testGraph } from "./testGraph.fixture.js";

describe("expandNodeWithContext", () => {
  it("uses mock mode by default without an API key", async () => {
    const patch = await expandNodeWithContext({
      graph: testGraph,
      targetNodeIds: ["question-1"],
    });

    expect(patch.metadata?.mode).toBe("mock");
    expect(patch.addedNodes).toHaveLength(3);
  });

  it("uses a provided LLM client in llm mode", async () => {
    let prompt = "";
    const client: LlmClient = {
      async completeJson(inputPrompt: string) {
        prompt = inputPrompt;
        return {
          id: "patch-llm",
          action: "expand_node",
          targetNodeIds: ["question-1"],
          summary: "Adds an LLM answer.",
          addedNodes: [
            {
              id: "llm-answer-1",
              type: "answer",
              title: "LLM answer",
              body: "Use preview patches for graph-changing actions.",
              tags: [],
            },
          ],
          updatedNodes: [],
          addedEdges: [
            {
              id: "llm-edge-1",
              source: "llm-answer-1",
              target: "question-1",
              type: "answers",
              rationale: "The answer addresses the selected question.",
            },
          ],
          createdAt: "2026-05-12T00:00:00.000Z",
        };
      },
    };

    const patch = await expandNodeWithContext({
      graph: testGraph,
      targetNodeIds: ["question-1"],
      mode: "llm",
      client,
    });

    expect(prompt).toContain("Return only strict JSON");
    expect(patch.id).toBe("patch-llm");
  });

  it("throws when llm mode has no client", async () => {
    await expect(
      expandNodeWithContext({
        graph: testGraph,
        targetNodeIds: ["question-1"],
        mode: "llm",
      }),
    ).rejects.toMatchObject({
      code: "LLM_NOT_CONFIGURED",
    });
  });

  it("throws when the LLM returns an invalid patch", async () => {
    const client: LlmClient = {
      async completeJson() {
        return {
          id: "patch-invalid",
          action: "expand_node",
          targetNodeIds: ["question-1"],
          summary: "Invalid patch.",
          addedNodes: [],
          updatedNodes: [{ id: "missing", title: "Missing" }],
          addedEdges: [],
          createdAt: "2026-05-12T00:00:00.000Z",
        };
      },
    };

    await expect(
      expandNodeWithContext({
        graph: testGraph,
        targetNodeIds: ["question-1"],
        mode: "llm",
        client,
      }),
    ).rejects.toBeInstanceOf(GraphActionError);
  });
});
