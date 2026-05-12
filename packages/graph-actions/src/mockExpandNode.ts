import type { EdgeType, GraphDocument, GraphEdge, GraphNode, GraphPatch } from "@graphctx/graph-schema";

const MOCK_CREATED_AT = "2026-05-12T00:00:00.000Z";

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "node";
}

function uniqueId(base: string, usedIds: Set<string>): string {
  let candidate = base;
  let index = 2;

  while (usedIds.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function createNode(input: {
  id: string;
  type: GraphNode["type"];
  title: string;
  body: string;
  tags?: string[];
}): GraphNode {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    body: input.body,
    tags: input.tags ?? [],
    created_by: "system",
    status: "draft",
    metadata: { mode: "mock" },
  };
}

function createEdge(input: {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  rationale: string;
}): GraphEdge {
  return {
    id: input.id,
    source: input.source,
    target: input.target,
    type: input.type,
    rationale: input.rationale,
    created_by: "system",
    metadata: { mode: "mock" },
  };
}

export function mockExpandNode(
  graph: GraphDocument,
  targetNodeIds: string[],
  instruction?: string,
): GraphPatch {
  const target = graph.nodes.find((node) => node.id === targetNodeIds[0]);
  if (!target) {
    throw new Error(`Node not found: ${targetNodeIds[0] ?? ""}`);
  }

  const usedNodeIds = new Set(graph.nodes.map((node) => node.id));
  const usedEdgeIds = new Set(graph.edges.map((edge) => edge.id));
  const base = `mock-${slugify(target.id)}`;
  const tagSet = new Set([...(target.tags ?? []), "mock-expansion"]);
  const tags = [...tagSet].sort();
  const addedNodes: GraphNode[] = [];
  const addedEdges: GraphEdge[] = [];

  const addNode = (suffix: string, type: GraphNode["type"], title: string, body: string): GraphNode => {
    const node = createNode({
      id: uniqueId(`${base}-${suffix}`, usedNodeIds),
      type,
      title,
      body,
      tags,
    });
    addedNodes.push(node);
    return node;
  };

  const addEdge = (suffix: string, source: string, targetId: string, type: EdgeType, rationale: string): void => {
    addedEdges.push(
      createEdge({
        id: uniqueId(`${base}-${suffix}`, usedEdgeIds),
        source,
        target: targetId,
        type,
        rationale,
      }),
    );
  };

  if (target.type === "question") {
    const answer = addNode(
      "answer",
      "answer",
      `Draft answer for ${target.title}`,
      `A focused next answer should address "${target.title}" using the current graph context.`,
    );
    const assumption = addNode(
      "assumption",
      "assumption",
      `Assumption behind ${target.title}`,
      "The current graph contains enough context to propose a bounded answer without restarting from basics.",
    );
    const task = addNode(
      "task",
      "task",
      `Validate answer for ${target.title}`,
      "Review the proposed answer against the original source notes and update the graph if it is unsupported.",
    );

    addEdge("answers", answer.id, target.id, "answers", "The new answer addresses the selected question.");
    addEdge("assumption-supports", assumption.id, answer.id, "supports", "The assumption supports the draft answer.");
    addEdge("task-depends", task.id, answer.id, "depends_on", "The validation task depends on the draft answer.");
  } else if (target.type === "idea") {
    const expandedIdea = addNode(
      "idea",
      "idea",
      `Expanded idea: ${target.title}`,
      `A more concrete version of this idea should identify the next decision, risk, and validation step.`,
    );
    const risk = addNode(
      "risk",
      "risk",
      `Risk for ${target.title}`,
      "The idea may be too broad unless it is connected to a concrete user workflow or test.",
    );
    const task = addNode(
      "task",
      "task",
      `Test ${target.title}`,
      "Turn the idea into a small validation task with a clear expected result.",
    );

    addEdge("expands", target.id, expandedIdea.id, "expands", "The new idea refines the selected idea.");
    addEdge("risk", risk.id, expandedIdea.id, "contradicts", "The risk challenges the expanded idea.");
    addEdge("task", task.id, expandedIdea.id, "depends_on", "The task validates the expanded idea.");
  } else if (target.type === "assumption") {
    const task = addNode(
      "task",
      "task",
      `Validate assumption: ${target.title}`,
      "Check whether this assumption is supported by source evidence or user feedback.",
    );
    const risk = addNode(
      "risk",
      "risk",
      `Risk if wrong: ${target.title}`,
      "If this assumption is wrong, downstream decisions may need to be revisited.",
    );
    const question = addNode(
      "question",
      "question",
      `Open question for ${target.title}`,
      "What evidence would confirm or disconfirm this assumption?",
    );

    addEdge("task", task.id, target.id, "depends_on", "The validation task depends on the selected assumption.");
    addEdge("risk", risk.id, target.id, "contradicts", "The risk captures the cost of a false assumption.");
    addEdge("question", question.id, target.id, "depends_on", "The question identifies missing evidence.");
  } else {
    const summary = addNode(
      "summary",
      "summary",
      `Expansion summary for ${target.title}`,
      "This node summarizes the next useful context to add around the selected node.",
    );
    const task = addNode(
      "task",
      "task",
      `Follow up on ${target.title}`,
      "Review this area of the graph and add concrete decisions, risks, or questions as needed.",
    );

    addEdge("summary", target.id, summary.id, "expands", "The summary expands the selected node.");
    addEdge("task", task.id, summary.id, "depends_on", "The task follows from the expansion summary.");
  }

  return {
    id: `patch-${base}`,
    action: "expand_node",
    targetNodeIds: [target.id],
    summary: instruction?.trim()
      ? `Mock expansion for "${target.title}" using instruction: ${instruction.trim()}`
      : `Mock expansion for "${target.title}".`,
    addedNodes,
    updatedNodes: [],
    addedEdges,
    warnings: ["Mock mode generated deterministic placeholder content."],
    createdAt: MOCK_CREATED_AT,
    metadata: { mode: "mock" },
  };
}
