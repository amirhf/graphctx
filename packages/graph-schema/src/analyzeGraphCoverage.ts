import { nodeTypes } from "./schema.js";
import type { ContextGraph, NodeType } from "./types.js";

export type CoverageFindingSeverity = "info" | "warning" | "error";

export type CoverageFinding = {
  id: string;
  severity: CoverageFindingSeverity;
  message: string;
  nodeTypes?: NodeType[];
  recommendation?: string;
};

export type CoverageAnalysis = {
  nodeTypeCounts: Record<NodeType, number>;
  totalNodes: number;
  totalEdges: number;
  sourceTraceabilityRatio: number;
  taskChecklistCount?: number;
  findings: CoverageFinding[];
  missingCoreNodeTypes: NodeType[];
  reusableContextScoreEstimate?: number;
};

export const CORE_REUSABLE_NODE_TYPES = [
  "decision",
  "assumption",
  "risk",
  "question",
  "task",
] as const satisfies readonly NodeType[];

function countByNodeType(graph: ContextGraph): Record<NodeType, number> {
  const counts = Object.fromEntries(nodeTypes.map((type) => [type, 0])) as Record<NodeType, number>;

  for (const node of graph.nodes) {
    counts[node.type] += 1;
  }

  return counts;
}

function estimateReusableContextScore(input: {
  missingCoreNodeTypes: NodeType[];
  sourceTraceabilityRatio: number;
  totalNodes: number;
  totalEdges: number;
}): number {
  let score = 5;
  score -= Math.min(2.5, input.missingCoreNodeTypes.length * 0.5);

  if (input.sourceTraceabilityRatio < 0.8) {
    score -= input.sourceTraceabilityRatio === 0 ? 1 : 0.5;
  }
  if (input.totalEdges === 0) {
    score -= 0.5;
  }
  if (input.totalNodes > 60 || input.totalNodes < 8) {
    score -= 0.5;
  }

  return Math.max(1, Math.min(5, Number(score.toFixed(1))));
}

export function analyzeGraphCoverage(graph: ContextGraph): CoverageAnalysis {
  const nodeTypeCounts = countByNodeType(graph);
  const totalNodes = graph.nodes.length;
  const totalEdges = graph.edges.length;
  const nodesWithSourceQuote = graph.nodes.filter((node) => Boolean(node.source_span?.quote?.trim())).length;
  const sourceTraceabilityRatio = totalNodes > 0 ? Number((nodesWithSourceQuote / totalNodes).toFixed(2)) : 0;
  const missingCoreNodeTypes = CORE_REUSABLE_NODE_TYPES.filter((type) => nodeTypeCounts[type] === 0);
  const findings: CoverageFinding[] = [];

  for (const type of missingCoreNodeTypes) {
    findings.push({
      id: `missing-${type}`,
      severity: "warning",
      message: `Graph has zero ${type} nodes.`,
      nodeTypes: [type],
      recommendation: `Recover explicit or strongly implied ${type} context if supported by the input.`,
    });
  }

  if (sourceTraceabilityRatio < 0.8) {
    findings.push({
      id: "low-source-traceability",
      severity: "warning",
      message: `Only ${Math.round(sourceTraceabilityRatio * 100)}% of nodes include a source quote.`,
      recommendation: "Add source_span.quote values for nodes when the input contains supporting text.",
    });
  }

  if (totalNodes > 60) {
    findings.push({
      id: "too-many-nodes",
      severity: "warning",
      message: `Graph has ${totalNodes} nodes; recommended maximum is 60.`,
      recommendation: "Merge weak, duplicate, or overly granular nodes.",
    });
  }

  if (totalNodes < 8) {
    findings.push({
      id: "few-nodes",
      severity: "info",
      message: `Graph has only ${totalNodes} nodes.`,
      recommendation: "For medium or long inputs, check whether important reusable context was missed.",
    });
  }

  if (totalEdges === 0) {
    findings.push({
      id: "no-edges",
      severity: "warning",
      message: "Graph has no edges.",
      recommendation: "Add meaningful relationships between decisions, assumptions, risks, questions, and tasks.",
    });
  }

  if (totalEdges > 0) {
    const edgesWithoutRationale = graph.edges.filter((edge) => !edge.rationale?.trim()).length;
    if (edgesWithoutRationale / totalEdges > 0.5) {
      findings.push({
        id: "weak-edge-rationales",
        severity: "warning",
        message: `${edgesWithoutRationale} of ${totalEdges} edges have empty rationale.`,
        recommendation: "Add short rationale text where it helps inspect graph coherence.",
      });
    }
  }

  return {
    nodeTypeCounts,
    totalNodes,
    totalEdges,
    sourceTraceabilityRatio,
    taskChecklistCount: nodeTypeCounts.task,
    findings,
    missingCoreNodeTypes,
    reusableContextScoreEstimate: estimateReusableContextScore({
      missingCoreNodeTypes,
      sourceTraceabilityRatio,
      totalNodes,
      totalEdges,
    }),
  };
}
