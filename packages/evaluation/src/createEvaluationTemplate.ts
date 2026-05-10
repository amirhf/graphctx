export type EvaluationTemplateOptions = {
  inputFile?: string;
  graphFile?: string;
  contextPackFile?: string;
};

export function createEvaluationTemplate(options: EvaluationTemplateOptions = {}): string {
  const inputFile = options.inputFile ?? "input.md";
  const graphFile = options.graphFile ?? "graph.json";
  const contextPackFile = options.contextPackFile ?? "context-pack.md";

  return `# Evaluation

## Input

- File: ${inputFile}
- Graph: ${graphFile}
- Context Pack: ${contextPackFile}

## Manual Scorecard

| Category | Score 1-5 | Notes |
|---|---:|---|
| Captures main goal |  |  |
| Captures key ideas |  |  |
| Captures decisions |  |  |
| Captures assumptions |  |  |
| Captures risks |  |  |
| Captures tasks |  |  |
| Context Pack usefulness |  |  |
| Graph coherence |  |  |
| Source traceability |  |  |
| Overall reuse value |  |  |

## Would I paste this Context Pack into a future AI session?

Yes / No / Maybe

## Biggest Missing Value

-

## Prompt or Schema Changes Needed

-
`;
}
