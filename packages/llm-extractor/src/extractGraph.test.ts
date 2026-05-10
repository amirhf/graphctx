import { describe, expect, it } from "vitest";
import { extractGraph } from "./extractGraph.js";
import type { LlmClient } from "./llmClient.js";

describe("extractGraph", () => {
  it("normalizes common LLM type aliases before validation", async () => {
    const client: LlmClient = {
      async completeJson() {
        return {
          title: "Alias Test",
          summary: "Tests normalization.",
          nodes: [
            { id: "n1", type: "success", title: "Success", body: "Useful output." },
            { id: "n2", type: "action", title: "Action", body: "Run the example." },
            { id: "n3", type: "assumption", title: "Assumption", body: "Users want this." },
            { id: "n4", type: "risk", title: "Risk", body: "Output may be shallow." },
            { id: "n5", type: "decision", title: "Decision", body: "Keep it local." },
          ],
          edges: [{ id: "e1", source: "n1", target: "n2", type: "relates_to" }],
        };
      },
    };

    const graph = await extractGraph("input", {
      client,
      provider: "openrouter",
      model: "test-model",
    });

    expect(graph.nodes[0]?.type).toBe("summary");
    expect(graph.nodes[1]?.type).toBe("task");
    expect(graph.edges[0]?.type).toBe("expands");
  });
});
