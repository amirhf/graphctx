import { GraphPatchSchema } from "./schema.js";
import { validateGraphDocument } from "./graphDocument.js";
import type {
  GraphDocument,
  GraphEdge,
  GraphNode,
  GraphPatch,
  ValidateGraphPatchResult,
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

function removeUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>;
}

function applyParsedPatch(graph: GraphDocument, patch: GraphPatch): GraphDocument {
  const deletedNodeIds = new Set(patch.deletedNodeIds ?? []);
  const deletedEdgeIds = new Set(patch.deletedEdgeIds ?? []);

  const nodeMap = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    if (!deletedNodeIds.has(node.id)) {
      nodeMap.set(node.id, { ...node });
    }
  }

  for (const update of patch.updatedNodes) {
    const existing = nodeMap.get(update.id);
    if (existing) {
      nodeMap.set(update.id, {
        ...existing,
        ...removeUndefined(update),
      });
    }
  }

  for (const node of patch.addedNodes) {
    nodeMap.set(node.id, { ...node });
  }

  const edgeMap = new Map<string, GraphEdge>();
  for (const edge of graph.edges) {
    if (
      !deletedEdgeIds.has(edge.id) &&
      !deletedNodeIds.has(edge.source) &&
      !deletedNodeIds.has(edge.target)
    ) {
      edgeMap.set(edge.id, { ...edge });
    }
  }

  for (const update of patch.updatedEdges ?? []) {
    const existing = edgeMap.get(update.id);
    if (existing) {
      edgeMap.set(update.id, {
        ...existing,
        ...removeUndefined(update),
      });
    }
  }

  for (const edge of patch.addedEdges) {
    edgeMap.set(edge.id, { ...edge });
  }

  const nodeIds = new Set(nodeMap.keys());
  const edges = [...edgeMap.values()].filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );

  return {
    ...graph,
    nodes: [...nodeMap.values()],
    edges,
    updatedAt: new Date().toISOString(),
    metadata: graph.metadata ? { ...graph.metadata } : undefined,
  };
}

export function validateGraphPatchForGraph(
  graph: GraphDocument,
  input: unknown,
): ValidateGraphPatchResult {
  const parsed = GraphPatchSchema.safeParse(input);

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

  const patch = parsed.data;
  const errors: string[] = [];
  const warnings = [...(patch.warnings ?? [])];
  const existingNodeIds = new Set(graph.nodes.map((node) => node.id));
  const existingEdgeIds = new Set(graph.edges.map((edge) => edge.id));
  const addedNodeIds = new Set(patch.addedNodes.map((node) => node.id));
  const deletedNodeIds = new Set(patch.deletedNodeIds ?? []);
  const addedEdgeIds = new Set(patch.addedEdges.map((edge) => edge.id));
  const deletedEdgeIds = new Set(patch.deletedEdgeIds ?? []);

  for (const id of findDuplicates(patch.targetNodeIds)) {
    errors.push(`duplicate target node id: ${id}`);
  }

  for (const id of patch.targetNodeIds) {
    if (!existingNodeIds.has(id)) {
      errors.push(`target node does not exist: ${id}`);
    }
  }

  for (const id of findDuplicates(patch.addedNodes.map((node) => node.id))) {
    errors.push(`duplicate added node id: ${id}`);
  }

  for (const node of patch.addedNodes) {
    if (existingNodeIds.has(node.id)) {
      errors.push(`added node already exists: ${node.id}`);
    }
  }

  for (const update of patch.updatedNodes) {
    if (!existingNodeIds.has(update.id)) {
      errors.push(`updated node does not exist: ${update.id}`);
    }
    if (deletedNodeIds.has(update.id)) {
      errors.push(`node cannot be both updated and deleted: ${update.id}`);
    }
  }

  for (const id of patch.deletedNodeIds ?? []) {
    if (!existingNodeIds.has(id)) {
      errors.push(`deleted node does not exist: ${id}`);
    }
    if (addedNodeIds.has(id)) {
      errors.push(`node cannot be both added and deleted: ${id}`);
    }
  }

  for (const id of findDuplicates(patch.addedEdges.map((edge) => edge.id))) {
    errors.push(`duplicate added edge id: ${id}`);
  }

  for (const edge of patch.addedEdges) {
    if (existingEdgeIds.has(edge.id)) {
      errors.push(`added edge already exists: ${edge.id}`);
    }
  }

  for (const update of patch.updatedEdges ?? []) {
    if (!existingEdgeIds.has(update.id)) {
      errors.push(`updated edge does not exist: ${update.id}`);
    }
    if (deletedEdgeIds.has(update.id)) {
      errors.push(`edge cannot be both updated and deleted: ${update.id}`);
    }
  }

  for (const id of patch.deletedEdgeIds ?? []) {
    if (!existingEdgeIds.has(id)) {
      errors.push(`deleted edge does not exist: ${id}`);
    }
    if (addedEdgeIds.has(id)) {
      errors.push(`edge cannot be both added and deleted: ${id}`);
    }
  }

  const availableNodeIds = new Set(
    [...existingNodeIds, ...addedNodeIds].filter((id) => !deletedNodeIds.has(id)),
  );

  for (const edge of patch.addedEdges) {
    if (!availableNodeIds.has(edge.source)) {
      errors.push(`added edge ${edge.id} source does not exist: ${edge.source}`);
    }
    if (!availableNodeIds.has(edge.target)) {
      errors.push(`added edge ${edge.id} target does not exist: ${edge.target}`);
    }
    if (edge.source === edge.target) {
      errors.push(`added edge ${edge.id} source and target must be different`);
    }
  }

  const existingEdgesById = new Map(graph.edges.map((edge) => [edge.id, edge]));
  for (const update of patch.updatedEdges ?? []) {
    const existing = existingEdgesById.get(update.id);
    if (!existing) {
      continue;
    }
    const source = update.source ?? existing.source;
    const target = update.target ?? existing.target;
    if (!availableNodeIds.has(source)) {
      errors.push(`updated edge ${update.id} source does not exist: ${source}`);
    }
    if (!availableNodeIds.has(target)) {
      errors.push(`updated edge ${update.id} target does not exist: ${target}`);
    }
    if (source === target) {
      errors.push(`updated edge ${update.id} source and target must be different`);
    }
  }

  if (errors.length === 0) {
    const validation = validateGraphDocument(applyParsedPatch(graph, patch));
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  }

  return {
    ok: errors.length === 0,
    patch: errors.length === 0 ? patch : undefined,
    errors,
    warnings,
  };
}

export function applyGraphPatch(graph: GraphDocument, input: unknown): GraphDocument {
  const validation = validateGraphPatchForGraph(graph, input);
  if (!validation.ok || !validation.patch) {
    throw new Error(`Graph patch validation failed:\n${validation.errors.join("\n")}`);
  }

  return applyParsedPatch(graph, validation.patch);
}
