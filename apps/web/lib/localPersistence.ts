import { validateGraphDocument, type GraphDocument } from "@graphctx/graph-schema";

const currentGraphKey = "graphctx.phase2.currentGraph";

export function loadCurrentGraph(): GraphDocument | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.localStorage.getItem(currentGraphKey);
  if (!raw) {
    return undefined;
  }

  try {
    const validation = validateGraphDocument(JSON.parse(raw));
    return validation.ok ? validation.graph : undefined;
  } catch {
    return undefined;
  }
}

export function saveCurrentGraph(graph: GraphDocument): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(currentGraphKey, JSON.stringify(graph));
}
