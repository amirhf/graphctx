import type { GraphDocument, GraphEdge, GraphNode, NodeType } from "@graphctx/graph-schema";
import {
  type BuildNodeActionContextOptions,
  GraphActionError,
  type NodeActionContext,
} from "./types.js";

const DEFAULT_MAX_TARGET_NODES = 3;
const DEFAULT_MAX_NEIGHBORS = 12;
const DEFAULT_MAX_GLOBAL_NODES = 20;
const DEFAULT_MAX_CHARS = 16000;

function stableNodeSort(a: GraphNode, b: GraphNode): number {
  return a.id.localeCompare(b.id) || a.title.localeCompare(b.title);
}

function stableEdgeSort(a: GraphEdge, b: GraphEdge): number {
  return a.id.localeCompare(b.id);
}

function nodeTextSize(node: GraphNode): number {
  return [
    node.id,
    node.type,
    node.title,
    node.body,
    ...(node.tags ?? []),
    node.source_span?.quote ?? "",
  ].join("\n").length;
}

function edgeTextSize(edge: GraphEdge): number {
  return [edge.id, edge.source, edge.target, edge.type, edge.rationale ?? ""].join("\n").length;
}

function contextSize(context: NodeActionContext): number {
  const nodeGroups = [
    context.targetNodes,
    context.neighboringNodes,
    context.openQuestions,
    context.activeAssumptions,
    context.decisions,
    context.risks,
    context.tasks,
    context.sourceNodes,
  ];
  const nodeSize = nodeGroups.flat().reduce((total, node) => total + nodeTextSize(node), 0);
  const edgeSize = context.relevantEdges.reduce((total, edge) => total + edgeTextSize(edge), 0);
  return nodeSize + edgeSize + (context.graphSummary?.length ?? 0);
}

function trimToBudget(context: NodeActionContext, maxChars: number): NodeActionContext {
  const trimmed: NodeActionContext = {
    ...context,
    targetNodes: [...context.targetNodes],
    neighboringNodes: [...context.neighboringNodes],
    relevantEdges: [...context.relevantEdges],
    openQuestions: [...context.openQuestions],
    activeAssumptions: [...context.activeAssumptions],
    decisions: [...context.decisions],
    risks: [...context.risks],
    tasks: [...context.tasks],
    sourceNodes: [...context.sourceNodes],
  };

  const optionalGroups: Array<keyof Pick<
    NodeActionContext,
    | "sourceNodes"
    | "tasks"
    | "risks"
    | "openQuestions"
    | "activeAssumptions"
    | "decisions"
    | "neighboringNodes"
  >> = [
    "sourceNodes",
    "tasks",
    "risks",
    "openQuestions",
    "activeAssumptions",
    "decisions",
    "neighboringNodes",
  ];

  for (const group of optionalGroups) {
    while (contextSize(trimmed) > maxChars && trimmed[group].length > 0) {
      trimmed[group] = trimmed[group].slice(0, -1);
    }
  }

  while (contextSize(trimmed) > maxChars && trimmed.relevantEdges.length > 0) {
    trimmed.relevantEdges = trimmed.relevantEdges.slice(0, -1);
  }

  if (contextSize(trimmed) > maxChars && trimmed.graphSummary) {
    trimmed.graphSummary = trimmed.graphSummary.slice(0, Math.max(0, maxChars));
  }

  return trimmed;
}

function uniqueNodes(nodes: GraphNode[]): GraphNode[] {
  const seen = new Set<string>();
  const unique: GraphNode[] = [];

  for (const node of nodes) {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      unique.push(node);
    }
  }

  return unique;
}

function scoreGlobalNode(node: GraphNode, input: {
  targetIds: Set<string>;
  neighborIds: Set<string>;
  connectedNodeIds: Set<string>;
  targetTags: Set<string>;
}): number {
  let score = 0;
  if (input.neighborIds.has(node.id)) {
    score += 20;
  }
  if (input.connectedNodeIds.has(node.id)) {
    score += 10;
  }
  for (const tag of node.tags ?? []) {
    if (input.targetTags.has(tag)) {
      score += 2;
    }
  }
  if (typeof node.confidence === "number") {
    score += node.confidence;
  }
  if (input.targetIds.has(node.id)) {
    score += 100;
  }
  return score;
}

function selectGlobalNodes(
  graph: GraphDocument,
  type: NodeType,
  limit: number,
  input: {
    targetIds: Set<string>;
    neighborIds: Set<string>;
    connectedNodeIds: Set<string>;
    targetTags: Set<string>;
  },
): GraphNode[] {
  return graph.nodes
    .filter((node) => node.type === type && !input.targetIds.has(node.id))
    .sort((a, b) => {
      const scoreDiff = scoreGlobalNode(b, input) - scoreGlobalNode(a, input);
      return scoreDiff || stableNodeSort(a, b);
    })
    .slice(0, limit);
}

export function buildNodeActionContext(
  graph: GraphDocument,
  targetNodeIds: string[],
  options: BuildNodeActionContextOptions = {},
): NodeActionContext {
  const selectedIds = [...new Set(targetNodeIds)].slice(
    0,
    options.maxTargetNodes ?? DEFAULT_MAX_TARGET_NODES,
  );

  if (selectedIds.length === 0) {
    throw new GraphActionError("NO_NODE_SELECTED", "Select at least one node before running an action.");
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const missingIds = selectedIds.filter((id) => !nodesById.has(id));
  if (missingIds.length > 0) {
    throw new GraphActionError("NODE_NOT_FOUND", `Node not found: ${missingIds.join(", ")}`);
  }

  const targetNodes = selectedIds
    .map((id) => nodesById.get(id))
    .filter((node): node is GraphNode => Boolean(node));
  const targetIds = new Set(targetNodes.map((node) => node.id));
  const touchingTargetEdges = graph.edges.filter(
    (edge) => targetIds.has(edge.source) || targetIds.has(edge.target),
  );
  const neighborIds = new Set<string>();
  for (const edge of touchingTargetEdges) {
    if (!targetIds.has(edge.source)) {
      neighborIds.add(edge.source);
    }
    if (!targetIds.has(edge.target)) {
      neighborIds.add(edge.target);
    }
  }

  const neighboringNodes = [...neighborIds]
    .map((id) => nodesById.get(id))
    .filter((node): node is GraphNode => Boolean(node))
    .sort(stableNodeSort)
    .slice(0, options.maxNeighbors ?? DEFAULT_MAX_NEIGHBORS);
  const boundedNeighborIds = new Set(neighboringNodes.map((node) => node.id));
  const contextNodeIds = new Set([...targetIds, ...boundedNeighborIds]);
  const relevantEdges = graph.edges
    .filter((edge) => contextNodeIds.has(edge.source) || contextNodeIds.has(edge.target))
    .sort(stableEdgeSort);
  const targetTags = new Set(targetNodes.flatMap((node) => node.tags ?? []));
  const connectedNodeIds = new Set<string>();
  for (const edge of relevantEdges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  const globalLimit = options.maxGlobalNodes ?? DEFAULT_MAX_GLOBAL_NODES;
  const selectorInput = {
    targetIds,
    neighborIds: boundedNeighborIds,
    connectedNodeIds,
    targetTags,
  };
  const perTypeLimit = Math.max(1, Math.ceil(globalLimit / 6));
  const context: NodeActionContext = {
    targetNodes,
    neighboringNodes,
    relevantEdges,
    graphSummary: graph.summary,
    openQuestions: selectGlobalNodes(graph, "question", perTypeLimit, selectorInput),
    activeAssumptions: selectGlobalNodes(graph, "assumption", perTypeLimit, selectorInput),
    decisions: selectGlobalNodes(graph, "decision", perTypeLimit, selectorInput),
    risks: selectGlobalNodes(graph, "risk", perTypeLimit, selectorInput),
    tasks: selectGlobalNodes(graph, "task", perTypeLimit, selectorInput),
    sourceNodes: selectGlobalNodes(graph, "source", perTypeLimit, selectorInput),
  };

  context.neighboringNodes = uniqueNodes(context.neighboringNodes);
  return trimToBudget(context, options.maxChars ?? DEFAULT_MAX_CHARS);
}
