import {
  analyzeGraphCoverage,
  validateContextGraph,
  type ContextGraph,
  type CoverageAnalysis,
  type NodeType,
} from "@graphctx/graph-schema";
import { buildGraphCritiquePrompt, createNoopGraphCritique, GraphCritiqueSchema, type GraphCritique } from "./critiquePrompt.js";
import { createLlmClient } from "./extractGraph.js";
import type { LlmClient, LlmProvider } from "./llmClient.js";
import { buildGraphPatchPrompt } from "./patchPrompt.js";

export type ImproveGraphQualityOptions = {
  maxPatchRounds?: number;
  provider?: LlmProvider;
  model?: string;
  patchModel?: string;
  temperature?: number;
  force?: boolean;
  client?: LlmClient;
  patchClient?: LlmClient;
};

export type ImproveGraphQualityResult = {
  originalGraph: ContextGraph;
  improvedGraph: ContextGraph;
  coverageBefore: CoverageAnalysis;
  coverageAfter: CoverageAnalysis;
  critique: GraphCritique;
  changed: boolean;
  acceptedPatch: boolean;
  patchRounds: number;
  diagnostics: string[];
  model?: string;
  patchModel?: string;
};

const IMPORTANT_FINDING_IDS = new Set([
  "missing-decision",
  "missing-assumption",
  "missing-risk",
  "missing-question",
  "missing-task",
  "low-source-traceability",
  "no-edges",
]);

function shouldRunPatch(coverage: CoverageAnalysis, force: boolean): boolean {
  return force || coverage.findings.some((finding) => IMPORTANT_FINDING_IDS.has(finding.id));
}

function countImprovedTypes(before: CoverageAnalysis, after: CoverageAnalysis, types: readonly NodeType[]): boolean {
  return types.some((type) => after.nodeTypeCounts[type] > before.nodeTypeCounts[type]);
}

function highValueCoreDropped(before: CoverageAnalysis, after: CoverageAnalysis): NodeType | undefined {
  for (const type of ["decision", "assumption", "risk", "question", "task"] as const) {
    if (before.nodeTypeCounts[type] > 0 && after.nodeTypeCounts[type] === 0) {
      return type;
    }
  }
  return undefined;
}

function withQualityMetadata(args: {
  graph: ContextGraph;
  patchRounds: number;
  coverageBefore: CoverageAnalysis;
  coverageAfter: CoverageAnalysis;
  critique: GraphCritique;
}): ContextGraph {
  return {
    ...args.graph,
    metadata: {
      ...args.graph.metadata,
      version: "phase-1.5",
      quality_pass: {
        enabled: true,
        patch_rounds: args.patchRounds,
        missing_core_node_types_before: args.coverageBefore.missingCoreNodeTypes,
        missing_core_node_types_after: args.coverageAfter.missingCoreNodeTypes,
        critique_summary: args.critique.summary,
      },
    },
  };
}

function evaluatePatchAcceptance(args: {
  originalGraph: ContextGraph;
  patchedGraph: ContextGraph;
  coverageBefore: CoverageAnalysis;
  coverageAfter: CoverageAnalysis;
  validationErrors: string[];
}): string[] {
  const rejectionReasons: string[] = [];

  if (args.validationErrors.length > 0) {
    rejectionReasons.push(`patched graph failed validation: ${args.validationErrors.join("; ")}`);
  }

  if (args.coverageAfter.totalNodes > 60 && args.coverageAfter.totalNodes > args.coverageBefore.totalNodes) {
    rejectionReasons.push(`patched graph has ${args.coverageAfter.totalNodes} nodes, above the recommended maximum of 60`);
  }

  if (args.coverageAfter.sourceTraceabilityRatio + 0.2 < args.coverageBefore.sourceTraceabilityRatio) {
    rejectionReasons.push(
      `source traceability dropped from ${args.coverageBefore.sourceTraceabilityRatio} to ${args.coverageAfter.sourceTraceabilityRatio}`,
    );
  }

  const droppedType = highValueCoreDropped(args.coverageBefore, args.coverageAfter);
  if (droppedType) {
    rejectionReasons.push(`patched graph removed all ${droppedType} nodes`);
  }

  if (args.patchedGraph.nodes.length === 0) {
    rejectionReasons.push("patched graph has no nodes");
  }

  const missingCoreImproved =
    args.coverageAfter.missingCoreNodeTypes.length < args.coverageBefore.missingCoreNodeTypes.length;
  const sourceImproved = args.coverageAfter.sourceTraceabilityRatio > args.coverageBefore.sourceTraceabilityRatio;
  const targetTypesImproved = countImprovedTypes(args.coverageBefore, args.coverageAfter, [
    "assumption",
    "question",
    "task",
  ]);

  if (!missingCoreImproved && !sourceImproved && !targetTypesImproved) {
    rejectionReasons.push("patched graph did not improve missing core node types, source traceability, or assumption/question/task coverage");
  }

  return rejectionReasons;
}

export async function improveGraphQuality(args: {
  input: string;
  graph: ContextGraph;
  options?: ImproveGraphQualityOptions;
}): Promise<ImproveGraphQualityResult> {
  const options = args.options ?? {};
  const maxPatchRounds = Math.max(0, options.maxPatchRounds ?? 1);
  const coverageBefore = analyzeGraphCoverage(args.graph);
  const diagnostics: string[] = [];

  if (maxPatchRounds === 0 || !shouldRunPatch(coverageBefore, options.force ?? false)) {
    const critique = createNoopGraphCritique("No important coverage warnings were found; patching was skipped.");
    const improvedGraph = withQualityMetadata({
      graph: args.graph,
      patchRounds: 0,
      coverageBefore,
      coverageAfter: coverageBefore,
      critique,
    });

    diagnostics.push("Quality pass skipped because coverage did not require patching.");
    return {
      originalGraph: args.graph,
      improvedGraph,
      coverageBefore,
      coverageAfter: coverageBefore,
      critique,
      changed: false,
      acceptedPatch: false,
      patchRounds: 0,
      diagnostics,
      model: options.model,
      patchModel: options.patchModel ?? options.model,
    };
  }

  const critiqueClientInfo = createLlmClient({
    provider: options.provider,
    model: options.model,
    temperature: options.temperature,
    client: options.client,
  });
  const patchClientInfo = createLlmClient({
    provider: options.provider,
    model: options.patchModel ?? options.model,
    temperature: options.temperature,
    client: options.patchClient ?? options.client,
  });

  diagnostics.push("Generated coverage analysis for initial graph.");
  const rawCritique = await critiqueClientInfo.client.completeJson(
    buildGraphCritiquePrompt({
      input: args.input,
      graph: args.graph,
      coverage: coverageBefore,
    }),
  );
  const critique = GraphCritiqueSchema.parse(rawCritique);
  diagnostics.push("Generated structured graph critique.");

  const rawPatch = await patchClientInfo.client.completeJson(
    buildGraphPatchPrompt({
      input: args.input,
      graph: args.graph,
      coverage: coverageBefore,
      critique,
    }),
  );
  const validation = validateContextGraph(rawPatch);
  const patchedGraph = validation.graph;

  if (!validation.ok || !patchedGraph) {
    diagnostics.push(`Rejected patch: patched graph failed validation: ${validation.errors.join("; ")}`);
    return {
      originalGraph: args.graph,
      improvedGraph: withQualityMetadata({
        graph: args.graph,
        patchRounds: 0,
        coverageBefore,
        coverageAfter: coverageBefore,
        critique,
      }),
      coverageBefore,
      coverageAfter: coverageBefore,
      critique,
      changed: false,
      acceptedPatch: false,
      patchRounds: 0,
      diagnostics,
      model: critiqueClientInfo.model,
      patchModel: patchClientInfo.model,
    };
  }

  const coverageAfter = analyzeGraphCoverage(patchedGraph);
  const rejectionReasons = evaluatePatchAcceptance({
    originalGraph: args.graph,
    patchedGraph,
    coverageBefore,
    coverageAfter,
    validationErrors: validation.errors,
  });

  if (rejectionReasons.length > 0) {
    diagnostics.push(...rejectionReasons.map((reason) => `Rejected patch: ${reason}`));
    return {
      originalGraph: args.graph,
      improvedGraph: withQualityMetadata({
        graph: args.graph,
        patchRounds: 0,
        coverageBefore,
        coverageAfter: coverageBefore,
        critique,
      }),
      coverageBefore,
      coverageAfter: coverageBefore,
      critique,
      changed: false,
      acceptedPatch: false,
      patchRounds: 0,
      diagnostics,
      model: critiqueClientInfo.model,
      patchModel: patchClientInfo.model,
    };
  }

  diagnostics.push("Accepted patched graph.");
  return {
    originalGraph: args.graph,
    improvedGraph: withQualityMetadata({
      graph: patchedGraph,
      patchRounds: 1,
      coverageBefore,
      coverageAfter,
      critique,
    }),
    coverageBefore,
    coverageAfter,
    critique,
    changed: true,
    acceptedPatch: true,
    patchRounds: 1,
    diagnostics,
    model: critiqueClientInfo.model,
    patchModel: patchClientInfo.model,
  };
}
