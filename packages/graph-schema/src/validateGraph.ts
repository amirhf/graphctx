import { ContextGraphSchema } from "./schema.js";
import type { ContextGraph, ValidateContextGraphResult } from "./types.js";

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

export function validateContextGraph(input: unknown): ValidateContextGraphResult {
  const parsed = ContextGraphSchema.safeParse(input);

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

  const graph: ContextGraph = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const id of findDuplicates(graph.nodes.map((node) => node.id))) {
    errors.push(`duplicate node id: ${id}`);
  }

  for (const id of findDuplicates(graph.edges.map((edge) => edge.id))) {
    errors.push(`duplicate edge id: ${id}`);
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const edge of graph.edges) {
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

  if (graph.nodes.length > 60) {
    warnings.push(`graph has ${graph.nodes.length} nodes; recommended maximum is 60`);
  }

  for (const type of ["decision", "assumption", "risk", "task"] as const) {
    if (!graph.nodes.some((node) => node.type === type)) {
      warnings.push(`graph has zero ${type} nodes`);
    }
  }

  return {
    ok: errors.length === 0,
    graph: errors.length === 0 ? graph : undefined,
    errors,
    warnings,
  };
}
