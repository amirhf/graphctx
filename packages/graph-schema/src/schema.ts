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
] as const;

export const edgeTypes = [
  "part_of",
  "expands",
  "supports",
  "contradicts",
  "depends_on",
  "leads_to",
  "answers",
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
  tags: z.array(z.string().min(1)).default([]),
  source_span: SourceSpanSchema,
});

export const GraphEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.enum(edgeTypes),
  rationale: z.string().optional(),
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
