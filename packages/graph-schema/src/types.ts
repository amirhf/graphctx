import type { z } from "zod";
import type {
  ContextGraphSchema,
  edgeTypes,
  GraphEdgeSchema,
  GraphNodeSchema,
  nodeTypes,
  QualityPassMetadataSchema,
  SourceSpanSchema,
} from "./schema.js";

export type NodeType = (typeof nodeTypes)[number];
export type EdgeType = (typeof edgeTypes)[number];
export type SourceSpan = z.infer<typeof SourceSpanSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type QualityPassMetadata = z.infer<typeof QualityPassMetadataSchema>;
export type ContextGraph = z.infer<typeof ContextGraphSchema>;

export type ValidateContextGraphResult = {
  ok: boolean;
  graph?: ContextGraph;
  errors: string[];
  warnings: string[];
};
