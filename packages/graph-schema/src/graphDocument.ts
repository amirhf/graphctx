import { GraphDocumentSchema } from "./schema.js";
import type {
  ContextGraph,
  GraphDocument,
  GraphEdge,
  GraphNode,
  ValidateGraphDocumentResult,
} from "./types.js";

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "graph";
}

export type ToGraphDocumentOptions = {
  id?: string;
  sourceText?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
};

export function toGraphDocument(
  graph: ContextGraph,
  options: ToGraphDocumentOptions = {},
): GraphDocument {
  const now = new Date().toISOString();

  return {
    id: options.id ?? `${slugify(graph.title)}-document`,
    title: graph.title,
    sourceText: options.sourceText,
    summary: graph.summary,
    nodes: graph.nodes,
    edges: graph.edges,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? options.createdAt ?? now,
    metadata: {
      ...(graph.metadata ?? {}),
      ...(options.metadata ?? {}),
    },
  };
}

export function toContextGraph(document: GraphDocument): ContextGraph {
  return {
    title: document.title,
    summary: document.summary,
    nodes: document.nodes,
    edges: document.edges,
    metadata: document.metadata as ContextGraph["metadata"],
  };
}

function validateGraphShape(nodes: GraphNode[], edges: GraphEdge[]): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const id of findDuplicates(nodes.map((node) => node.id))) {
    errors.push(`duplicate node id: ${id}`);
  }

  for (const id of findDuplicates(edges.map((edge) => edge.id))) {
    errors.push(`duplicate edge id: ${id}`);
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`edge ${edge.id} source does not exist: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`edge ${edge.id} target does not exist: ${edge.target}`);
    }
    if (edge.source === edge.target) {
      errors.push(`edge ${edge.id} source and target must be different`);
    }
  }

  for (const node of nodes) {
    if (
      node.source_span?.start !== undefined &&
      node.source_span.end !== undefined &&
      node.source_span.start > node.source_span.end
    ) {
      errors.push(`node ${node.id} source_span start must be less than or equal to end`);
    }
  }

  if (nodes.length > 60) {
    warnings.push(`graph has ${nodes.length} nodes; recommended maximum is 60`);
  }

  return { errors, warnings };
}

export function validateGraphDocument(input: unknown): ValidateGraphDocumentResult {
  const parsed = GraphDocumentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      }),
      warnings: [],
    };
  }

  const graph = parsed.data;
  const { errors, warnings } = validateGraphShape(graph.nodes, graph.edges);

  return {
    ok: errors.length === 0,
    graph: errors.length === 0 ? graph : undefined,
    errors,
    warnings,
  };
}
