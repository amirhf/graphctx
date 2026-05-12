import { nodeTypes, type ContextGraph, type GraphNode, type NodeType } from "@graphctx/graph-schema";

export type GroupedNodes = Record<NodeType, GraphNode[]>;

function createEmptyGroups(): GroupedNodes {
  const groups = {} as GroupedNodes;
  for (const type of nodeTypes) {
    groups[type] = [];
  }
  return groups;
}

export function groupNodesByType(graph: ContextGraph): GroupedNodes {
  return graph.nodes.reduce<GroupedNodes>(
    (groups, node) => {
      groups[node.type].push(node);
      return groups;
    },
    createEmptyGroups(),
  );
}
