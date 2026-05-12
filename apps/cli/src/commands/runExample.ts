import path from "node:path";
import { runExtractCommand, type ExtractCommandOptions } from "./extract.js";

export async function runExampleCommand(exampleDir: string, options: ExtractCommandOptions): Promise<void> {
  const resolvedExampleDir = path.resolve(exampleDir);
  await runExtractCommand(path.join(resolvedExampleDir, "input.md"), {
    ...options,
  });
}
