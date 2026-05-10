import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runExtractCommand } from "./extract.js";
import { runExampleCommand } from "./runExample.js";

vi.mock("./extract.js", () => ({
  runExtractCommand: vi.fn(),
}));

describe("runExampleCommand", () => {
  beforeEach(() => {
    vi.mocked(runExtractCommand).mockReset();
  });

  it("writes generated files to an outputs subfolder by default", async () => {
    await runExampleCommand("examples/demo", {});

    const exampleDir = path.resolve("examples/demo");
    expect(runExtractCommand).toHaveBeenCalledWith(path.join(exampleDir, "input.md"), {
      outDir: path.join(exampleDir, "outputs"),
    });
  });

  it("honors a custom output directory", async () => {
    await runExampleCommand("examples/demo", { outDir: "examples/demo" });

    const exampleDir = path.resolve("examples/demo");
    expect(runExtractCommand).toHaveBeenCalledWith(path.join(exampleDir, "input.md"), {
      outDir: "examples/demo",
    });
  });
});
