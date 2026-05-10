import { createLlmClient } from "@graphctx/llm-extractor";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildEvaluationPrompt } from "./evaluationPrompt.js";
import { JudgeEvaluationSchema } from "./judgeSchema.js";
import { renderAutomatedEvaluationMarkdown } from "./renderAutomatedEvaluationMarkdown.js";
import { runDeterministicEvaluation } from "./deterministicChecks.js";
import type {
  AutomatedEvaluationResult,
  EvaluateExampleOptions,
  EvaluateGraphAndContextPackInput,
  JudgeEvaluation,
} from "./types.js";

export const DEFAULT_EXAMPLE_OUTPUT_DIR = "outputs";

function fallbackMissingValue(result: ReturnType<typeof runDeterministicEvaluation>): string {
  if (!result.graphValidation.ok) {
    return "Graph JSON failed validation.";
  }
  if (result.missingImportantNodeTypes.length > 0) {
    return `Missing important node types: ${result.missingImportantNodeTypes.join(", ")}.`;
  }
  if (result.missingSections.length > 0) {
    return `Missing Context Pack sections: ${result.missingSections.join(", ")}.`;
  }
  return "No major deterministic gaps found; LLM judge was skipped.";
}

export function resolveExampleOutputDir(exampleDir: string, outDir?: string): string {
  const resolvedExampleDir = path.resolve(exampleDir);
  const trimmedOutDir = outDir?.trim();

  if (!trimmedOutDir) {
    return path.join(resolvedExampleDir, DEFAULT_EXAMPLE_OUTPUT_DIR);
  }

  if (path.isAbsolute(trimmedOutDir) || trimmedOutDir.includes("/") || trimmedOutDir.includes("\\")) {
    return path.resolve(trimmedOutDir);
  }

  return path.join(resolvedExampleDir, trimmedOutDir);
}

function displayPath(fromDir: string, filePath: string): string {
  const relative = path.relative(fromDir, filePath) || path.basename(filePath);
  return relative.split(path.sep).join("/");
}

export async function evaluateGraphAndContextPack(
  input: EvaluateGraphAndContextPackInput,
): Promise<AutomatedEvaluationResult> {
  const deterministic = runDeterministicEvaluation(input.graphJson, input.contextPackMarkdown);
  let judge: JudgeEvaluation | null = null;
  let provider: string | undefined;
  let model: string | undefined;

  if (!input.skipLlm) {
    const clientInfo = createLlmClient({
      provider: input.provider,
      model: input.model,
      temperature: input.temperature ?? 0,
    });
    provider = clientInfo.provider;
    model = clientInfo.model;
    const rawJudge = await clientInfo.client.completeJson(
      buildEvaluationPrompt({
        sourceInput: input.sourceInput,
        graphJson: input.graphJson,
        contextPackMarkdown: input.contextPackMarkdown,
        deterministicSummary: deterministic,
      }),
    );
    judge = JudgeEvaluationSchema.parse(rawJudge);
  }

  const overallScore = judge?.criteria.overall_reuse_value.score ?? deterministic.estimatedScore;
  const wouldReuse =
    judge?.would_reuse ?? (overallScore >= 4 ? "yes" : overallScore >= 3 ? "maybe" : "no");

  return {
    exampleName: input.exampleName,
    files: input.files ?? {
      input: "input.md",
      graph: "graph.json",
      contextPack: "context-pack.md",
    },
    generatedAt: new Date().toISOString(),
    mode: judge ? "hybrid" : "deterministic",
    provider,
    model,
    deterministic,
    judge,
    overallScore,
    wouldReuse,
    biggestMissingValue: judge?.biggest_missing_value ?? fallbackMissingValue(deterministic),
    recommendedChanges: judge?.recommended_changes ?? deterministic.warnings,
  };
}

export async function evaluateExample(
  exampleDir: string,
  options: EvaluateExampleOptions = {},
): Promise<AutomatedEvaluationResult> {
  const resolvedDir = path.resolve(exampleDir);
  const outputDir = resolveExampleOutputDir(resolvedDir, options.outDir);
  const inputPath = path.join(resolvedDir, "input.md");
  const graphPath = path.join(outputDir, "graph.json");
  const contextPackPath = path.join(outputDir, "context-pack.md");
  const [sourceInput, graphRaw, contextPackMarkdown] = await Promise.all([
    readFile(inputPath, "utf8"),
    readFile(graphPath, "utf8"),
    readFile(contextPackPath, "utf8"),
  ]);

  const result = await evaluateGraphAndContextPack({
    sourceInput,
    graphJson: JSON.parse(graphRaw) as unknown,
    contextPackMarkdown,
    files: {
      input: displayPath(resolvedDir, inputPath),
      graph: displayPath(resolvedDir, graphPath),
      contextPack: displayPath(resolvedDir, contextPackPath),
    },
    exampleName: path.basename(resolvedDir),
    skipLlm: options.skipLlm,
    provider: options.provider,
    model: options.model,
    temperature: options.temperature,
  });

  if (options.write ?? true) {
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, "evaluation.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    await writeFile(
      path.join(outputDir, "evaluation.auto.md"),
      renderAutomatedEvaluationMarkdown(result),
      "utf8",
    );
  }

  return result;
}
