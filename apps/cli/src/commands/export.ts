import { exportContextPackMarkdown } from "@graphctx/context-pack-exporter";
import { DEFAULT_EXAMPLE_OUTPUT_DIR } from "@graphctx/evaluation";
import { validateContextGraph } from "@graphctx/graph-schema";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ExportCommandOptions = {
  outDir?: string;
};

export function resolveExportOutputDir(graphPath: string, outDir?: string): string {
  if (outDir?.trim()) {
    return path.resolve(outDir.trim());
  }

  const graphDir = path.dirname(graphPath);
  if (path.basename(graphDir) === DEFAULT_EXAMPLE_OUTPUT_DIR) {
    return graphDir;
  }

  return path.join(graphDir, DEFAULT_EXAMPLE_OUTPUT_DIR);
}

export async function runExportCommand(graphFile: string, options: ExportCommandOptions): Promise<void> {
  console.log("Reading graph...");
  const graphPath = path.resolve(graphFile);
  const graphJson = JSON.parse(await readFile(graphPath, "utf8")) as unknown;
  const validation = validateContextGraph(graphJson);

  console.log("Validating graph...");
  if (validation.warnings.length > 0) {
    for (const warning of validation.warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }
  if (!validation.ok || !validation.graph) {
    throw new Error(`Validation failed:\n${validation.errors.join("\n")}`);
  }

  const outDir = resolveExportOutputDir(graphPath, options.outDir);
  await mkdir(outDir, { recursive: true });

  console.log("Writing context-pack.md...");
  await writeFile(path.join(outDir, "context-pack.md"), exportContextPackMarkdown(validation.graph), "utf8");
  console.log("Done.");
}
