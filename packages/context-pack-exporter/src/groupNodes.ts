import type { ContextGraph, GraphNode, NodeType } from "@graphctx/graph-schema";

export type GroupedNodes = Record<NodeType, GraphNode[]>;

export function groupNodesByType(graph: ContextGraph): GroupedNodes {
  return graph.nodes.reduce<GroupedNodes>(
    (groups, node) => {
      groups[node.type].push(node);
      return groups;
    },
    {
      idea: [],
      question: [],
      assumption: [],
      decision: [],
      risk: [],
      task: [],
      source: [],
      summary: [],
    },
  );
}
