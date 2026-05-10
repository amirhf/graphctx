import type { LlmProvider } from "@graphctx/llm-extractor";
import path from "node:path";
import { runExtractCommand } from "./extract.js";

export type CompareCommandOptions = {
  models: string;
  outDir?: string;
  provider?: LlmProvider;
  maxInputChars?: string;
  temperature?: string;
  qualityPass?: boolean;
  maxPatchRounds?: string;
  patchModel?: string;
};

function safeRunName(model: string): string {
  return model.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function runCompareCommand(inputFile: string, options: CompareCommandOptions): Promise<void> {
  const models = options.models
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  if (models.length === 0) {
    throw new Error("--models must include at least one model");
  }

  const inputPath = path.resolve(inputFile);
  const baseOutDir = path.resolve(options.outDir?.trim() || path.join(path.dirname(inputPath), "runs"));

  for (const model of models) {
    const runName = safeRunName(model);
    const runOutDir = path.join(baseOutDir, runName);
    console.log(`Running comparison extraction for ${model}...`);
    await runExtractCommand(inputPath, {
      outDir: runOutDir,
      provider: options.provider,
      model,
      patchModel: options.patchModel,
      maxInputChars: options.maxInputChars,
      temperature: options.temperature,
      qualityPass: options.qualityPass,
      maxPatchRounds: options.maxPatchRounds,
    });
  }
}
