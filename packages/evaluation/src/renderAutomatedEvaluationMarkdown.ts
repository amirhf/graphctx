import { evaluationCriteria, type AutomatedEvaluationResult } from "./types.js";

function criterionLabel(criterion: string): string {
  return criterion
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function renderAutomatedEvaluationMarkdown(result: AutomatedEvaluationResult): string {
  const criteriaRows = evaluationCriteria
    .map((criterion) => {
      const score = result.judge?.criteria[criterion];
      return `| ${criterionLabel(criterion)} | ${score?.score ?? ""} | ${score?.notes ?? "Not scored by LLM judge."} |`;
    })
    .join("\n");

  const deterministicWarnings =
    result.deterministic.warnings.length > 0
      ? result.deterministic.warnings.map((warning) => `- ${warning}`).join("\n")
      : "- None";

  const recommendedChanges =
    result.recommendedChanges.length > 0
      ? result.recommendedChanges.map((change) => `- ${change}`).join("\n")
      : "- None";

  return `# Automated Evaluation

## Summary

- Mode: ${result.mode}
- Overall score: ${result.overallScore}/5
- Would reuse: ${result.wouldReuse}
- Biggest missing value: ${result.biggestMissingValue}

## Files

- Input: ${result.files.input}
- Graph: ${result.files.graph}
- Context Pack: ${result.files.contextPack}

## Scorecard

| Category | Score 1-5 | Notes |
|---|---:|---|
${criteriaRows}

## Deterministic Checks

- Graph valid: ${result.deterministic.graphValidation.ok ? "yes" : "no"}
- Nodes: ${result.deterministic.nodeCount}
- Edges: ${result.deterministic.edgeCount}
- Missing important node types: ${result.deterministic.missingImportantNodeTypes.join(", ") || "none"}
- Missing Context Pack sections: ${result.deterministic.missingSections.join(", ") || "none"}
- Task checklist: ${result.deterministic.taskChecklist.checklistItems}/${result.deterministic.taskChecklist.taskNodes}
- Source traceability: ${result.deterministic.sourceTraceability.nodesWithSourceQuote}/${result.deterministic.sourceTraceability.totalNodes} nodes with source quotes

## Deterministic Warnings

${deterministicWarnings}

## Recommended Changes

${recommendedChanges}
`;
}
