import type { ContextGraph, GraphNode } from "@graphctx/graph-schema";
import { groupNodesByType } from "./groupNodes.js";

function sourceQuote(node: GraphNode): string {
  return node.source_span?.quote ? `\n  - Source: "${node.source_span.quote}"` : "";
}

function bulletList(nodes: GraphNode[], emptyText: string): string {
  if (nodes.length === 0) {
    return `_${emptyText}_`;
  }

  return nodes
    .map((node) => `- **${node.title}:** ${node.body}${sourceQuote(node)}`)
    .join("\n");
}

function taskList(nodes: GraphNode[]): string {
  if (nodes.length === 0) {
    return "_No explicit tasks were extracted._";
  }

  return nodes
    .map((node) => `- [ ] **${node.title}:** ${node.body}${sourceQuote(node)}`)
    .join("\n");
}

function decisionList(nodes: GraphNode[], graph: ContextGraph): string {
  if (nodes.length === 0) {
    return "_No explicit decisions were extracted._";
  }

  return nodes
    .map((node) => {
      const relatedEdges = graph.edges.filter(
        (edge) => edge.source === node.id || edge.target === node.id,
      );
      const related =
        relatedEdges.length > 0
          ? `\n  - Related nodes: ${relatedEdges
              .map((edge) => (edge.source === node.id ? edge.target : edge.source))
              .join(", ")}`
          : "";
      return `- **Decision:** ${node.title}\n  - Rationale: ${node.body}${related}${sourceQuote(node)}`;
    })
    .join("\n");
}

function assumptionList(nodes: GraphNode[]): string {
  if (nodes.length === 0) {
    return "_No explicit assumptions were extracted._";
  }

  return nodes
    .map((node) => {
      const confidence =
        typeof node.confidence === "number" ? `${Math.round(node.confidence * 100)}%` : "unspecified";
      return `- **Assumption:** ${node.title}\n  - Confidence: ${confidence}\n  - Needs validation: ${node.body}${sourceQuote(node)}`;
    })
    .join("\n");
}

export function exportContextPackMarkdown(graph: ContextGraph): string {
  const groups = groupNodesByType(graph);
  const currentUnderstanding =
    groups.summary.length > 0
      ? bulletList(groups.summary, "No explicit summary nodes were extracted.")
      : graph.summary;

  return `# Context Pack: ${graph.title}

## Goal

${graph.summary}

## Current Understanding

${currentUnderstanding}

## Key Ideas

${bulletList(groups.idea, "No explicit key ideas were extracted.")}

## Claims

${bulletList(groups.claim, "No explicit claims were extracted.")}

## Decisions Made

${decisionList(groups.decision, graph)}

## Assumptions

${assumptionList(groups.assumption)}

## Open Questions

${bulletList(groups.question, "No explicit open questions were extracted.")}

## Answers

${bulletList(groups.answer, "No explicit answers were extracted.")}

## Risks

${bulletList(groups.risk, "No explicit risks were extracted.")}

## Tradeoffs

${bulletList(groups.tradeoff, "No explicit tradeoffs were extracted.")}

## Tasks / Next Actions

${taskList(groups.task)}

## Useful Source Notes

${bulletList(groups.source, "No useful source notes were extracted.")}

## Suggested Prompt for Next AI Session

Use the following context as the current state of the project. Do not restart from basics. Focus on unresolved questions, active assumptions, risks, and the next concrete actions.
`;
}
