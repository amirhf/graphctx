#!/usr/bin/env node
import { Command } from "commander";
import { config as loadEnv } from "dotenv";
import { runCompareCommand } from "./commands/compare.js";
import { runEvaluateAllCommand, runEvaluateCommand } from "./commands/evaluate.js";
import { runExportCommand } from "./commands/export.js";
import { runExtractCommand } from "./commands/extract.js";
import { runExampleCommand } from "./commands/runExample.js";

loadEnv();

const program = new Command();

program
  .name("graphctx")
  .description("Turn messy AI conversations into context graphs and reusable Context Packs.")
  .version("0.1.0");

program
  .command("extract")
  .argument("<input-file>", "Markdown or text file to extract")
  .option("--out-dir <dir>", "Directory for graph.json, context-pack.md, and evaluation.md")
  .option("--provider <provider>", "LLM provider: openai or openrouter")
  .option("--model <model>", "Model override")
  .option("--patch-model <model>", "Patch model override for --quality-pass")
  .option("--max-input-chars <chars>", "Maximum input characters to send to the LLM")
  .option("--temperature <temperature>", "LLM temperature")
  .option("--quality-pass", "Run the Phase 1.5 critique-and-patch quality pass")
  .option("--max-patch-rounds <rounds>", "Maximum quality patch rounds", "1")
  .action(async (inputFile, options) => {
    await runExtractCommand(inputFile, options);
  });

program
  .command("compare")
  .argument("<input-file>", "Markdown or text file to extract")
  .requiredOption("--models <models>", "Comma-separated model list")
  .option("--out-dir <dir>", "Directory for model run outputs")
  .option("--provider <provider>", "LLM provider: openai or openrouter")
  .option("--max-input-chars <chars>", "Maximum input characters to send to the LLM")
  .option("--temperature <temperature>", "LLM temperature")
  .option("--quality-pass", "Run the Phase 1.5 critique-and-patch quality pass")
  .option("--max-patch-rounds <rounds>", "Maximum quality patch rounds", "1")
  .option("--patch-model <model>", "Patch model override for --quality-pass")
  .action(async (inputFile, options) => {
    await runCompareCommand(inputFile, options);
  });

program
  .command("export")
  .argument("<graph-file>", "Graph JSON file to export")
  .option("--out-dir <dir>", "Directory for context-pack.md")
  .action(async (graphFile, options) => {
    await runExportCommand(graphFile, options);
  });

program
  .command("run-example")
  .argument("<example-dir>", "Example directory containing input.md")
  .option("--out-dir <dir>", "Directory for generated outputs; defaults to <example-dir>/outputs")
  .option("--provider <provider>", "LLM provider: openai or openrouter")
  .option("--model <model>", "Model override")
  .option("--max-input-chars <chars>", "Maximum input characters to send to the LLM")
  .option("--temperature <temperature>", "LLM temperature")
  .action(async (exampleDir, options) => {
    await runExampleCommand(exampleDir, options);
  });

program
  .command("evaluate")
  .argument("<example-dir>", "Example directory containing input.md and generated outputs")
  .option("--out-dir <dir>", "Directory containing graph.json and context-pack.md; defaults to <example-dir>/outputs")
  .option("--provider <provider>", "LLM judge provider: openai or openrouter")
  .option("--model <model>", "LLM judge model override")
  .option("--temperature <temperature>", "LLM judge temperature")
  .option("--skip-llm", "Run deterministic checks only")
  .option("--fail-under <score>", "Exit nonzero when overall score is below this threshold")
  .action(async (exampleDir, options) => {
    await runEvaluateCommand(exampleDir, options);
  });

program
  .command("evaluate-all")
  .argument("[examples-dir]", "Directory containing example folders", "examples")
  .option("--out-dir <dir>", "Output subdirectory or directory containing generated files")
  .option("--provider <provider>", "LLM judge provider: openai or openrouter")
  .option("--model <model>", "LLM judge model override")
  .option("--temperature <temperature>", "LLM judge temperature")
  .option("--skip-llm", "Run deterministic checks only")
  .option("--fail-under <score>", "Exit nonzero when any overall score is below this threshold")
  .action(async (examplesDir, options) => {
    await runEvaluateAllCommand(examplesDir, options);
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
