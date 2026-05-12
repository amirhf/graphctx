import { validateGraphPatchForGraph, type GraphPatch } from "@graphctx/graph-schema";
import { buildExpandNodePrompt } from "./expandNodePrompt.js";
import { buildNodeActionContext } from "./buildNodeActionContext.js";
import { mockExpandNode } from "./mockExpandNode.js";
import {
  type ExpandNodeWithContextInput,
  GraphActionError,
} from "./types.js";

export async function expandNodeWithContext(
  input: ExpandNodeWithContextInput,
): Promise<GraphPatch> {
  const mode = input.mode ?? "mock";
  const context = buildNodeActionContext(input.graph, input.targetNodeIds);

  let rawPatch: unknown;
  if (mode === "mock") {
    rawPatch = mockExpandNode(input.graph, input.targetNodeIds, input.instruction);
  } else {
    if (!input.client) {
      throw new GraphActionError(
        "LLM_NOT_CONFIGURED",
        "LLM mode requires an LLM client.",
      );
    }

    try {
      rawPatch = await input.client.completeJson(
        buildExpandNodePrompt(context, input.instruction),
      );
    } catch (error) {
      throw new GraphActionError(
        "LLM_CALL_FAILED",
        error instanceof Error ? error.message : "LLM call failed.",
      );
    }
  }

  const validation = validateGraphPatchForGraph(input.graph, rawPatch);
  if (!validation.ok || !validation.patch) {
    throw new GraphActionError(
      "PATCH_VALIDATION_FAILED",
      `Graph patch validation failed:\n${validation.errors.join("\n")}`,
    );
  }

  return validation.patch;
}
