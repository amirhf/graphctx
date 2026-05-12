import {
  getSelectedSubgraph,
  toContextGraph,
  toGraphDocument,
  type ContextGraph,
  type GraphDocument,
} from "@graphctx/graph-schema";
import { exportContextPackMarkdown } from "./exportMarkdown.js";

export type ExportContextPackInput = {
  graph: ContextGraph | GraphDocument;
  selectedNodeIds?: string[];
};

function isGraphDocument(graph: ContextGraph | GraphDocument): graph is GraphDocument {
  return "createdAt" in graph && "updatedAt" in graph && "id" in graph;
}

export function exportContextPack(input: ExportContextPackInput): string {
  const graphDocument = isGraphDocument(input.graph)
    ? input.graph
    : toGraphDocument(input.graph);
  const selectedGraph =
    input.selectedNodeIds && input.selectedNodeIds.length > 0
      ? getSelectedSubgraph(graphDocument, input.selectedNodeIds)
      : graphDocument;

  return exportContextPackMarkdown(toContextGraph(selectedGraph));
}
