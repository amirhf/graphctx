import type { ContextGraph, NodeType, ValidateContextGraphResult } from "@graphctx/graph-schema";

export const evaluationCriteria = [
  "captures_main_goal",
  "captures_key_ideas",
  "captures_decisions",
  "captures_assumptions",
  "captures_risks",
  "captures_tasks",
  "context_pack_usefulness",
  "graph_coherence",
  "source_traceability",
  "overall_reuse_value",
] as const;

export type EvaluationCriterion = (typeof evaluationCriteria)[number];

export type CriterionScore = {
  score: number;
  notes: string;
  evidence: string;
};

export type JudgeEvaluation = {
  criteria: Record<EvaluationCriterion, CriterionScore>;
  would_reuse: "yes" | "no" | "maybe";
  biggest_missing_value: string;
  recommended_changes: string[];
};

export type RequiredSectionCheck = {
  section: string;
  present: boolean;
};

export type DeterministicEvaluation = {
  graphValidation: ValidateContextGraphResult;
  nodeCount: number;
  edgeCount: number;
  nodeTypeCounts: Partial<Record<NodeType, number>>;
  missingImportantNodeTypes: NodeType[];
  requiredSections: RequiredSectionCheck[];
  missingSections: string[];
  taskChecklist: {
    taskNodes: number;
    checklistItems: number;
    ok: boolean;
  };
  sourceTraceability: {
    nodesWithSourceQuote: number;
    totalNodes: number;
    ratio: number;
  };
  warnings: string[];
  estimatedScore: number;
};

export type AutomatedEvaluationResult = {
  exampleName?: string;
  files: {
    input: string;
    graph: string;
    contextPack: string;
  };
  generatedAt: string;
  mode: "deterministic" | "hybrid";
  provider?: string;
  model?: string;
  deterministic: DeterministicEvaluation;
  judge: JudgeEvaluation | null;
  overallScore: number;
  wouldReuse: "yes" | "no" | "maybe";
  biggestMissingValue: string;
  recommendedChanges: string[];
};

export type EvaluateGraphAndContextPackInput = {
  sourceInput: string;
  graphJson: unknown;
  contextPackMarkdown: string;
  files?: {
    input: string;
    graph: string;
    contextPack: string;
  };
  exampleName?: string;
  skipLlm?: boolean;
  provider?: "openai" | "openrouter";
  model?: string;
  temperature?: number;
};

export type EvaluateExampleOptions = {
  skipLlm?: boolean;
  provider?: "openai" | "openrouter";
  model?: string;
  temperature?: number;
  write?: boolean;
};
