import { z } from "zod";

export const nodeTypes = [
  "idea",
  "question",
  "assumption",
  "decision",
  "risk",
  "task",
  "source",
  "summary",
  "answer",
  "claim",
  "tradeoff",
] as const;

export const edgeTypes = [
  "part_of",
  "expands",
  "supports",
  "contradicts",
  "depends_on",
  "leads_to",
  "answers",
  "derived_from",
] as const;

export const SourceSpanSchema = z
  .object({
    start: z.number().int().nonnegative().optional(),
    end: z.number().int().nonnegative().optional(),
    quote: z.string().min(1).optional(),
  })
  .optional();

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(nodeTypes),
  title: z.string().min(1),
  body: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  created_by: z.enum(["ai", "user", "system"]).optional(),
  tags: z.array(z.string().min(1)).default([]),
  status: z.enum(["active", "draft", "accepted", "rejected"]).optional(),
  source_span: SourceSpanSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const GraphEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.enum(edgeTypes),
  rationale: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  created_by: z.enum(["ai", "user", "system"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GraphDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceText: z.string().optional(),
  summary: z.string().min(1),
  nodes: z.array(GraphNodeSchema).min(1, "graph must contain at least one node"),
  edges: z.array(GraphEdgeSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const graphPatchActions = [
  "expand_node",
  "import_text",
  "summarize_subgraph",
] as const;

const UpdatedGraphNodeSchema = GraphNodeSchema.partial().extend({
  id: z.string().min(1),
});

const UpdatedGraphEdgeSchema = GraphEdgeSchema.partial().extend({
  id: z.string().min(1),
});

export const GraphPatchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(graphPatchActions),
  targetNodeIds: z.array(z.string().min(1)),
  summary: z.string().min(1),
  addedNodes: z.array(GraphNodeSchema).default([]),
  updatedNodes: z.array(UpdatedGraphNodeSchema).default([]),
  deletedNodeIds: z.array(z.string().min(1)).optional(),
  addedEdges: z.array(GraphEdgeSchema).default([]),
  updatedEdges: z.array(UpdatedGraphEdgeSchema).optional(),
  deletedEdgeIds: z.array(z.string().min(1)).optional(),
  warnings: z.array(z.string().min(1)).optional(),
  createdAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const QualityPassMetadataSchema = z.object({
  enabled: z.boolean(),
  patch_rounds: z.number().int().nonnegative(),
  missing_core_node_types_before: z.array(z.enum(nodeTypes)),
  missing_core_node_types_after: z.array(z.enum(nodeTypes)),
  critique_summary: z.string().optional(),
});

export const ContextGraphSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  nodes: z.array(GraphNodeSchema).min(1, "graph must contain at least one node"),
  edges: z.array(GraphEdgeSchema),
  metadata: z
    .object({
      generated_at: z.string().optional(),
      model: z.string().optional(),
      input_chars: z.number().int().nonnegative().optional(),
      version: z.string().optional(),
      quality_pass: QualityPassMetadataSchema.optional(),
    })
    .optional(),
});
