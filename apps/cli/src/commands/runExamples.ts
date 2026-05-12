import { evaluateExample } from "@graphctx/evaluation";
import type { LlmProvider } from "@graphctx/llm-extractor";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { runExtractCommand } from "./extract.js";

export type RunExamplesCommandOptions = {
  provider?: LlmProvider;
  model?: string;
  maxInputChars?: string;
  temperature?: string;
  qualityPass?: boolean;
  patchModel?: string;
  maxPatchRounds?: string;
  skipLlm?: boolean;
  judgeProvider?: LlmProvider;
  judgeModel?: string;
  judgeTemperature?: string;
  failUnder?: string;
};

export type RunExamplesSummary = {
  extracted: number;
  evaluated: number;
  skipped: number;
  failed: number;
  failures: Array<{
    example: string;
    reason: string;
  }>;
};

function parseOptionalFloat(value: string | undefined, optionName: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${optionName} must be a number`);
  }
  return parsed;
}

function parseFailUnder(value: string | undefined): number | undefined {
  const parsed = parseOptionalFloat(value, "--fail-under");
  if (parsed !== undefined && (parsed < 1 || parsed > 5)) {
    throw new Error("--fail-under must be a number between 1 and 5");
  }
  return parsed;
}

async function hasInputFile(exampleDir: string): Promise<boolean> {
  try {
    await access(path.join(exampleDir, "input.md"));
    return true;
  } catch {
    return false;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function findExampleDirs(examplesDir: string): Promise<{
  examples: string[];
  skipped: string[];
}> {
  const resolvedExamplesDir = path.resolve(examplesDir);
  const entries = await readdir(resolvedExamplesDir, { withFileTypes: true });
  const examples: string[] = [];
  const skipped: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) {
      continue;
    }

    const exampleDir = path.join(resolvedExamplesDir, entry.name);
    if (await hasInputFile(exampleDir)) {
      examples.push(exampleDir);
    } else {
      skipped.push(exampleDir);
    }
  }

  return { examples, skipped };
}

export async function runExamplesCommand(
  examplesDir = "examples",
  options: RunExamplesCommandOptions = {},
): Promise<RunExamplesSummary> {
  const { examples, skipped } = await findExampleDirs(examplesDir);
  const failUnder = parseFailUnder(options.failUnder);
  const judgeTemperature = parseOptionalFloat(options.judgeTemperature, "--judge-temperature");
  const summary: RunExamplesSummary = {
    extracted: 0,
    evaluated: 0,
    skipped: skipped.length,
    failed: 0,
    failures: [],
  };

  for (const skippedDir of skipped) {
    console.log(`Skipping ${path.basename(skippedDir)}: missing input.md`);
  }

  for (const exampleDir of examples) {
    const exampleName = path.basename(exampleDir);
    const inputPath = path.join(exampleDir, "input.md");

    try {
      console.log(`Extracting ${exampleName}...`);
      await runExtractCommand(inputPath, {
        provider: options.provider,
        model: options.model,
        maxInputChars: options.maxInputChars,
        temperature: options.temperature,
        qualityPass: options.qualityPass,
        patchModel: options.patchModel,
        maxPatchRounds: options.maxPatchRounds,
      });
      summary.extracted += 1;
    } catch (error) {
      summary.failed += 1;
      summary.failures.push({ example: exampleName, reason: errorMessage(error) });
      console.warn(`Failed ${exampleName} extraction: ${errorMessage(error)}`);
      continue;
    }

    try {
      console.log(`Evaluating ${exampleName}...`);
      const result = await evaluateExample(exampleDir, {
        provider: options.judgeProvider,
        model: options.judgeModel,
        temperature: judgeTemperature,
        skipLlm: options.skipLlm,
      });
      summary.evaluated += 1;

      if (failUnder !== undefined && result.overallScore < failUnder) {
        summary.failed += 1;
        const reason = `evaluation score ${result.overallScore}/5 is below threshold ${failUnder}/5`;
        summary.failures.push({ example: exampleName, reason });
        console.warn(`Failed ${exampleName}: ${reason}`);
      } else {
        console.log(`Score ${result.overallScore}/5 for ${exampleName}`);
      }
    } catch (error) {
      summary.failed += 1;
      summary.failures.push({ example: exampleName, reason: errorMessage(error) });
      console.warn(`Failed ${exampleName} evaluation: ${errorMessage(error)}`);
    }
  }

  console.log(
    `Done. Extracted: ${summary.extracted}. Evaluated: ${summary.evaluated}. Skipped: ${summary.skipped}. Failed: ${summary.failed}.`,
  );

  if (summary.failed > 0) {
    throw new Error(`${summary.failed} example run(s) failed`);
  }

  return summary;
}
