import type { GraphDocument, GraphEdge, GraphNode } from "@graphctx/graph-schema";

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function excerpt(value: string, fallback: string): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return fallback;
  }
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function titleFromText(text: string): string {
  const firstLine = text
    .split(/\n+/)
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .find(Boolean);
  return excerpt(firstLine ?? "Untitled graph", "Untitled graph").slice(0, 80);
}

function node(input: Omit<GraphNode, "tags"> & { tags?: string[] }): GraphNode {
  return {
    ...input,
    tags: input.tags ?? [],
    created_by: input.created_by ?? "system",
  };
}

function edge(input: GraphEdge): GraphEdge {
  return input;
}

export function createMockGraphFromText(text: string): GraphDocument {
  const now = new Date().toISOString();
  const title = titleFromText(text);
  const paragraphs = text
    .split(/\n{2,}/)
    .map(normalizeWhitespace)
    .filter(Boolean);
  const summaryBody = excerpt(paragraphs[0] ?? text, "Source notes are ready for graph extraction.");
  const ideaBody = excerpt(paragraphs[1] ?? text, "The notes contain a reusable idea worth inspecting.");
  const questionBody = excerpt(paragraphs[2] ?? "What should be expanded next?", "What should be expanded next?");

  const nodes: GraphNode[] = [
    node({
      id: "source-1",
      type: "source",
      title: "Source notes",
      body: summaryBody,
      tags: ["mock"],
    }),
    node({
      id: "summary-1",
      type: "summary",
      title,
      body: summaryBody,
      tags: ["mock"],
    }),
    node({
      id: "idea-1",
      type: "idea",
      title: "Reusable context",
      body: ideaBody,
      tags: ["mock"],
    }),
    node({
      id: "question-1",
      type: "question",
      title: "Expansion target",
      body: questionBody,
      tags: ["mock"],
    }),
    node({
      id: "decision-1",
      type: "decision",
      title: "Preview before apply",
      body: "Graph-changing actions should produce a patch that can be inspected before mutation.",
      tags: ["mock", "phase2"],
    }),
    node({
      id: "task-1",
      type: "task",
      title: "Review graph shape",
      body: "Inspect the generated nodes, correct weak fields, then export a Context Pack.",
      tags: ["mock", "phase2"],
    }),
  ];

  const edges: GraphEdge[] = [
    edge({
      id: "edge-1",
      source: "source-1",
      target: "summary-1",
      type: "derived_from",
      rationale: "The summary is derived from the pasted source notes.",
    }),
    edge({
      id: "edge-2",
      source: "summary-1",
      target: "idea-1",
      type: "leads_to",
      rationale: "The summary points to a reusable idea.",
    }),
    edge({
      id: "edge-3",
      source: "idea-1",
      target: "question-1",
      type: "leads_to",
      rationale: "The idea raises a focused expansion question.",
    }),
    edge({
      id: "edge-4",
      source: "decision-1",
      target: "question-1",
      type: "supports",
      rationale: "Patch preview supports controlled expansion.",
    }),
    edge({
      id: "edge-5",
      source: "task-1",
      target: "summary-1",
      type: "depends_on",
      rationale: "Graph review depends on the generated structure.",
    }),
  ];

  return {
    id: "local-mock-graph",
    title,
    sourceText: text,
    summary: summaryBody,
    nodes,
    edges,
    createdAt: now,
    updatedAt: now,
    metadata: {
      phase: "phase2",
      mode: "mock",
    },
  };
}
