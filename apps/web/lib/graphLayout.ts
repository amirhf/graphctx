import type { GraphDocument, NodeType } from "@graphctx/graph-schema";

const typeOrder: NodeType[] = [
  "source",
  "summary",
  "idea",
  "claim",
  "question",
  "answer",
  "decision",
  "assumption",
  "risk",
  "tradeoff",
  "task",
];

export type GraphPosition = {
  x: number;
  y: number;
};

export function layoutGraph(graph: GraphDocument): Record<string, GraphPosition> {
  const positions: Record<string, GraphPosition> = {};
  const columns = new Map<NodeType, number>();
  typeOrder.forEach((type, index) => columns.set(type, index));
  const rowsByType = new Map<NodeType, number>();

  for (const node of graph.nodes) {
    const column = columns.get(node.type) ?? typeOrder.length;
    const row = rowsByType.get(node.type) ?? 0;
    positions[node.id] = {
      x: column * 250,
      y: row * 118,
    };
    rowsByType.set(node.type, row + 1);
  }

  return positions;
}
