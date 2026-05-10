import { exportContextPackMarkdown } from "@graphctx/context-pack-exporter";
import { validateContextGraph } from "@graphctx/graph-schema";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ExportCommandOptions = {
  outDir?: string;
};

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

  const outDir = path.resolve(options.outDir ?? path.dirname(graphPath));
  await mkdir(outDir, { recursive: true });

  console.log("Writing context-pack.md...");
  await writeFile(path.join(outDir, "context-pack.md"), exportContextPackMarkdown(validation.graph), "utf8");
  console.log("Done.");
}
