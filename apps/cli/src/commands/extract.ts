import { exportContextPackMarkdown } from "@graphctx/context-pack-exporter";
import { createEvaluationTemplate } from "@graphctx/evaluation";
import { validateContextGraph } from "@graphctx/graph-schema";
import { extractGraph, type LlmProvider } from "@graphctx/llm-extractor";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ExtractCommandOptions = {
  outDir?: string;
  provider?: LlmProvider;
  model?: string;
  maxInputChars?: string;
  temperature?: string;
};

export async function runExtractCommand(inputFile: string, options: ExtractCommandOptions): Promise<void> {
  console.log("Reading input...");
  const inputPath = path.resolve(inputFile);
  const input = await readFile(inputPath, "utf8");
  const configuredOutDir = options.outDir?.trim() || process.env.GRAPHCTX_OUTPUT_DIR?.trim();
  const outDir = path.resolve(configuredOutDir || path.dirname(inputPath));

  const provider = options.provider ?? (process.env.LLM_PROVIDER as LlmProvider | undefined) ?? "openai";
  const model =
    options.model ??
    (provider === "openrouter" ? process.env.OPENROUTER_MODEL : process.env.OPENAI_MODEL) ??
    (provider === "openrouter" ? "openai/gpt-4.1-mini" : "gpt-4.1-mini");
  console.log(`Extracting graph with ${provider}/${model}...`);

  const graph = await extractGraph(input, {
    provider,
    model,
    maxInputChars: options.maxInputChars ? Number.parseInt(options.maxInputChars, 10) : undefined,
    temperature: options.temperature ? Number.parseFloat(options.temperature) : undefined,
  });

  console.log("Validating graph...");
  const validation = validateContextGraph(graph);
  if (validation.warnings.length > 0) {
    for (const warning of validation.warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }
  if (!validation.ok || !validation.graph) {
    throw new Error(`Validation failed:\n${validation.errors.join("\n")}`);
  }

  await mkdir(outDir, { recursive: true });

  console.log("Writing graph.json...");
  await writeFile(path.join(outDir, "graph.json"), `${JSON.stringify(validation.graph, null, 2)}\n`, "utf8");

  console.log("Writing context-pack.md...");
  await writeFile(path.join(outDir, "context-pack.md"), exportContextPackMarkdown(validation.graph), "utf8");

  console.log("Writing evaluation.md...");
  await writeFile(
    path.join(outDir, "evaluation.md"),
    createEvaluationTemplate({
      inputFile: path.basename(inputPath),
      graphFile: "graph.json",
      contextPackFile: "context-pack.md",
    }),
    "utf8",
  );

  console.log("Done.");
}
