import type { GraphPatch } from "@graphctx/graph-schema";
import type { NodeActionContext } from "./types.js";

function compactNode(node: NodeActionContext["targetNodes"][number]): object {
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    body: node.body,
    confidence: node.confidence,
    tags: node.tags,
    status: node.status,
    source_span: node.source_span,
  };
}

function compactEdge(edge: NodeActionContext["relevantEdges"][number]): object {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    rationale: edge.rationale,
    confidence: edge.confidence,
  };
}

const graphPatchShape: GraphPatch = {
  id: "patch-example",
  action: "expand_node",
  targetNodeIds: ["target-node-id"],
  summary: "One sentence summary of the proposed graph changes.",
  addedNodes: [],
  updatedNodes: [],
  deletedNodeIds: [],
  addedEdges: [],
  updatedEdges: [],
  deletedEdgeIds: [],
  warnings: [],
  createdAt: "2026-05-12T00:00:00.000Z",
  metadata: {},
};

export function buildExpandNodePrompt(
  context: NodeActionContext,
  instruction?: string,
): string {
  const payload = {
    instruction: instruction?.trim() || undefined,
    graphSummary: context.graphSummary,
    targetNodes: context.targetNodes.map(compactNode),
    neighboringNodes: context.neighboringNodes.map(compactNode),
    relevantEdges: context.relevantEdges.map(compactEdge),
    openQuestions: context.openQuestions.map(compactNode),
    activeAssumptions: context.activeAssumptions.map(compactNode),
    decisions: context.decisions.map(compactNode),
    risks: context.risks.map(compactNode),
    tasks: context.tasks.map(compactNode),
    sourceNodes: context.sourceNodes.map(compactNode),
  };

  return `You are expanding a selected part of a context graph.

Return only strict JSON matching the GraphPatch shape. Do not include Markdown, prose outside JSON, or comments.

Rules:
- Focus on the selected target node or nodes.
- Use the surrounding graph context; do not restart from basics.
- Preserve existing decisions unless the context explicitly challenges them.
- Add new nodes only when they are useful and concrete.
- Prefer node types: answer, assumption, risk, task, question, source, claim, idea, summary.
- Create typed edges from existing or added nodes so the patch is inspectable.
- Include warnings when the context is insufficient.
- Do not delete existing graph content unless explicitly instructed.
- Use ISO datetime strings.

Expected JSON shape:
${JSON.stringify(graphPatchShape, null, 2)}

Context:
${JSON.stringify(payload, null, 2)}
`;
}
