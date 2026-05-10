import {
  nodeTypes,
  validateContextGraph,
  type GraphNode,
  type NodeType,
} from "@graphctx/graph-schema";
import type { DeterministicEvaluation, RequiredSectionCheck } from "./types.js";

const importantNodeTypes: NodeType[] = ["decision", "assumption", "risk", "task", "question"];

const requiredSections = [
  "## Goal",
  "## Current Understanding",
  "## Key Ideas",
  "## Decisions Made",
  "## Assumptions",
  "## Open Questions",
  "## Risks",
  "## Tasks / Next Actions",
  "## Useful Source Notes",
  "## Suggested Prompt for Next AI Session",
];

function countByNodeType(nodes: GraphNode[]): Partial<Record<NodeType, number>> {
  return nodes.reduce<Partial<Record<NodeType, number>>>((counts, node) => {
    counts[node.type] = (counts[node.type] ?? 0) + 1;
    return counts;
  }, {});
}

function estimateScore(input: {
  graphOk: boolean;
  missingImportantNodeTypes: NodeType[];
  missingSections: string[];
  taskChecklistOk: boolean;
  sourceRatio: number;
}): number {
  if (!input.graphOk) {
    return 1;
  }

  let score = 5;
  score -= Math.min(2, input.missingImportantNodeTypes.length * 0.5);
  score -= Math.min(1.5, input.missingSections.length * 0.5);
  if (!input.taskChecklistOk) {
    score -= 0.5;
  }
  if (input.sourceRatio === 0) {
    score -= 0.5;
  }

  return Math.max(1, Math.min(5, Math.floor(score)));
}

export function runDeterministicEvaluation(graphJson: unknown, contextPackMarkdown: string): DeterministicEvaluation {
  const graphValidation = validateContextGraph(graphJson);
  const graph = graphValidation.graph;
  const nodes = graph?.nodes ?? [];
  const nodeTypeCounts = countByNodeType(nodes);
  const missingImportantNodeTypes = importantNodeTypes.filter((type) => (nodeTypeCounts[type] ?? 0) === 0);
  const sectionChecks: RequiredSectionCheck[] = requiredSections.map((section) => ({
    section,
    present: contextPackMarkdown.includes(section),
  }));
  const missingSections = sectionChecks.filter((section) => !section.present).map((section) => section.section);
  const taskNodes = nodeTypeCounts.task ?? 0;
  const checklistItems = (contextPackMarkdown.match(/^- \[ \]/gm) ?? []).length;
  const nodesWithSourceQuote = nodes.filter((node) => Boolean(node.source_span?.quote)).length;
  const sourceRatio = nodes.length > 0 ? nodesWithSourceQuote / nodes.length : 0;
  const warnings = [
    ...graphValidation.warnings,
    ...missingImportantNodeTypes.map((type) => `missing ${type} nodes`),
    ...missingSections.map((section) => `missing Context Pack section: ${section}`),
  ];

  for (const type of nodeTypes) {
    nodeTypeCounts[type] ??= 0;
  }

  return {
    graphValidation,
    nodeCount: nodes.length,
    edgeCount: graph?.edges.length ?? 0,
    nodeTypeCounts,
    missingImportantNodeTypes,
    requiredSections: sectionChecks,
    missingSections,
    taskChecklist: {
      taskNodes,
      checklistItems,
      ok: taskNodes === 0 || checklistItems >= taskNodes,
    },
    sourceTraceability: {
      nodesWithSourceQuote,
      totalNodes: nodes.length,
      ratio: Number(sourceRatio.toFixed(2)),
    },
    warnings,
    estimatedScore: estimateScore({
      graphOk: graphValidation.ok,
      missingImportantNodeTypes,
      missingSections,
      taskChecklistOk: taskNodes === 0 || checklistItems >= taskNodes,
      sourceRatio,
    }),
  };
}
