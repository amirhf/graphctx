import { exportContextPackMarkdown } from "@graphctx/context-pack-exporter";
import { createEvaluationTemplate, DEFAULT_EXAMPLE_OUTPUT_DIR } from "@graphctx/evaluation";
import { validateContextGraph } from "@graphctx/graph-schema";
import { extractGraph, improveGraphQuality, type LlmProvider } from "@graphctx/llm-extractor";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ExtractCommandOptions = {
  outDir?: string;
  provider?: LlmProvider;
  model?: string;
  patchModel?: string;
  maxInputChars?: string;
  temperature?: string;
  qualityPass?: boolean;
  maxPatchRounds?: string;
};

function parseOptionalInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("--max-patch-rounds must be a nonnegative integer");
  }
  return parsed;
}

function parseOptionalFloat(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("--temperature must be a number");
  }
  return parsed;
}

export function resolveExtractOutputDir(inputPath: string, outDir?: string): string {
  const configuredOutDir = outDir?.trim() || process.env.GRAPHCTX_OUTPUT_DIR?.trim();
  return path.resolve(configuredOutDir || path.join(path.dirname(inputPath), DEFAULT_EXAMPLE_OUTPUT_DIR));
}

export async function runExtractCommand(inputFile: string, options: ExtractCommandOptions): Promise<void> {
  console.log("Reading input...");
  const inputPath = path.resolve(inputFile);
  const input = await readFile(inputPath, "utf8");
  const outDir = resolveExtractOutputDir(inputPath, options.outDir);

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
    temperature: parseOptionalFloat(options.temperature),
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

  if (options.qualityPass) {
    console.log("Analyzing coverage...");
    console.log("Quality pass enabled.");
    console.log("Generating critique...");
    console.log("Patching graph...");
    const qualityResult = await improveGraphQuality({
      input,
      graph: validation.graph,
      options: {
        provider,
        model,
        patchModel: options.patchModel,
        maxPatchRounds: parseOptionalInteger(options.maxPatchRounds, 1),
        temperature: parseOptionalFloat(options.temperature),
      },
    });

    console.log("Validating patched graph...");
    const finalValidation = validateContextGraph(qualityResult.improvedGraph);
    if (!finalValidation.ok || !finalValidation.graph) {
      throw new Error(`Final graph validation failed:\n${finalValidation.errors.join("\n")}`);
    }

    console.log(
      `Coverage before: missing ${
        qualityResult.coverageBefore.missingCoreNodeTypes.join(", ") || "none"
      }`,
    );
    console.log(
      `Coverage after: missing ${
        qualityResult.coverageAfter.missingCoreNodeTypes.join(", ") || "none"
      }`,
    );

    console.log("Writing outputs...");
    await writeFile(path.join(outDir, "graph.initial.json"), `${JSON.stringify(validation.graph, null, 2)}\n`, "utf8");
    await writeFile(path.join(outDir, "graph.json"), `${JSON.stringify(finalValidation.graph, null, 2)}\n`, "utf8");
    await writeFile(path.join(outDir, "context-pack.md"), exportContextPackMarkdown(finalValidation.graph), "utf8");
    await writeFile(path.join(outDir, "critique.json"), `${JSON.stringify(qualityResult.critique, null, 2)}\n`, "utf8");
    await writeFile(
      path.join(outDir, "quality.diagnostics.json"),
      `${JSON.stringify(
        {
          quality_pass_enabled: true,
          accepted_patch: qualityResult.acceptedPatch,
          changed: qualityResult.changed,
          patch_rounds: qualityResult.patchRounds,
          coverage_before: qualityResult.coverageBefore,
          coverage_after: qualityResult.coverageAfter,
          missing_core_node_types_before: qualityResult.coverageBefore.missingCoreNodeTypes,
          missing_core_node_types_after: qualityResult.coverageAfter.missingCoreNodeTypes,
          diagnostics: qualityResult.diagnostics,
          model: qualityResult.model ?? `${provider}/${model}`,
          patch_model: qualityResult.patchModel ?? options.patchModel ?? model,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
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
    return;
  }

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
