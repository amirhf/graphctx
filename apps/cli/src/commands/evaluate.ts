import {
  evaluateExample,
  renderAutomatedEvaluationMarkdown,
  resolveExampleOutputDir,
  type EvaluateExampleOptions,
} from "@graphctx/evaluation";
import type { LlmProvider } from "@graphctx/llm-extractor";
import { access, readdir } from "node:fs/promises";
import path from "node:path";

export type EvaluateCommandOptions = {
  provider?: LlmProvider;
  model?: string;
  temperature?: string;
  skipLlm?: boolean;
  failUnder?: string;
  outDir?: string;
};

function parseEvaluationOptions(options: EvaluateCommandOptions): EvaluateExampleOptions {
  return {
    provider: options.provider,
    model: options.model,
    temperature: options.temperature ? Number.parseFloat(options.temperature) : undefined,
    skipLlm: options.skipLlm,
    outDir: options.outDir,
  };
}

function parseFailUnder(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
    throw new Error("--fail-under must be a number between 1 and 5");
  }
  return parsed;
}

async function hasGeneratedOutputs(exampleDir: string, outDir?: string): Promise<boolean> {
  const outputDir = resolveExampleOutputDir(exampleDir, outDir);
  try {
    await Promise.all([
      access(path.join(exampleDir, "input.md")),
      access(path.join(outputDir, "graph.json")),
      access(path.join(outputDir, "context-pack.md")),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function runEvaluateCommand(exampleDir: string, options: EvaluateCommandOptions): Promise<void> {
  console.log("Evaluating example...");
  const result = await evaluateExample(exampleDir, parseEvaluationOptions(options));
  console.log(renderAutomatedEvaluationMarkdown(result));

  const failUnder = parseFailUnder(options.failUnder);
  if (failUnder !== undefined && result.overallScore < failUnder) {
    throw new Error(`Evaluation score ${result.overallScore}/5 is below threshold ${failUnder}/5`);
  }
}

export async function runEvaluateAllCommand(examplesDir: string, options: EvaluateCommandOptions): Promise<void> {
  const resolvedExamplesDir = path.resolve(examplesDir);
  const entries = await readdir(resolvedExamplesDir, { withFileTypes: true });
  const failUnder = parseFailUnder(options.failUnder);
  let evaluated = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const exampleDir = path.join(resolvedExamplesDir, entry.name);
    if (!(await hasGeneratedOutputs(exampleDir, options.outDir))) {
      skipped += 1;
      console.log(`Skipping ${entry.name}: missing outputs/graph.json or outputs/context-pack.md`);
      continue;
    }

    console.log(`Evaluating ${entry.name}...`);
    const result = await evaluateExample(exampleDir, parseEvaluationOptions(options));
    evaluated += 1;

    if (failUnder !== undefined && result.overallScore < failUnder) {
      failed += 1;
      console.warn(`Score ${result.overallScore}/5 is below threshold ${failUnder}/5 for ${entry.name}`);
    } else {
      console.log(`Score ${result.overallScore}/5 for ${entry.name}`);
    }
  }

  console.log(`Done. Evaluated: ${evaluated}. Skipped: ${skipped}.`);

  if (failed > 0) {
    throw new Error(`${failed} evaluation(s) fell below threshold ${failUnder}/5`);
  }
}
