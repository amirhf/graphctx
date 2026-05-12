import type { GraphDocument, GraphEdge, GraphNode } from "@graphctx/graph-schema";
import type { LlmClient } from "@graphctx/llm-extractor";

export type NodeActionContext = {
  targetNodes: GraphNode[];
  neighboringNodes: GraphNode[];
  relevantEdges: GraphEdge[];
  graphSummary?: string;
  openQuestions: GraphNode[];
  activeAssumptions: GraphNode[];
  decisions: GraphNode[];
  risks: GraphNode[];
  tasks: GraphNode[];
  sourceNodes: GraphNode[];
};

export type BuildNodeActionContextOptions = {
  maxTargetNodes?: number;
  maxNeighbors?: number;
  maxGlobalNodes?: number;
  maxChars?: number;
};

export type ExpandNodeMode = "mock" | "llm";

export type ExpandNodeWithContextInput = {
  graph: GraphDocument;
  targetNodeIds: string[];
  instruction?: string;
  mode?: ExpandNodeMode;
  client?: LlmClient;
};

export type GraphActionErrorCode =
  | "NO_NODE_SELECTED"
  | "NODE_NOT_FOUND"
  | "PATCH_VALIDATION_FAILED"
  | "LLM_NOT_CONFIGURED"
  | "LLM_CALL_FAILED";

export class GraphActionError extends Error {
  readonly code: GraphActionErrorCode;

  constructor(code: GraphActionErrorCode, message: string) {
    super(message);
    this.name = "GraphActionError";
    this.code = code;
  }
}
