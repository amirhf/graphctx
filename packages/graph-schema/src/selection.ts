import type { GraphDocument } from "./types.js";

export function getSelectedSubgraph(
  graph: GraphDocument,
  selectedNodeIds: string[],
): GraphDocument {
  const selectedIds = [...new Set(selectedNodeIds)];

  if (selectedIds.length === 0) {
    return {
      ...graph,
      nodes: [...graph.nodes],
      edges: [...graph.edges],
      metadata: graph.metadata ? { ...graph.metadata } : undefined,
    };
  }

  const selectedIdSet = new Set(selectedIds);
  const nodes = graph.nodes.filter((node) => selectedIdSet.has(node.id));
  const includedNodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter(
    (edge) => includedNodeIds.has(edge.source) && includedNodeIds.has(edge.target),
  );

  return {
    ...graph,
    id: `${graph.id}-selection`,
    title: `Selected subgraph: ${graph.title}`,
    nodes,
    edges,
    metadata: {
      ...(graph.metadata ?? {}),
      selectedNodeIds: selectedIds,
      parentGraphId: graph.id,
    },
  };
}
