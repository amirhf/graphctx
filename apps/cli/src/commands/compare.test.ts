import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runExtractCommand } from "./extract.js";
import { runCompareCommand } from "./compare.js";

vi.mock("./extract.js", () => ({
  runExtractCommand: vi.fn(),
}));

describe("runCompareCommand", () => {
  beforeEach(() => {
    vi.mocked(runExtractCommand).mockReset();
  });

  it("writes model runs under outputs/runs by default", async () => {
    await runCompareCommand("examples/demo/input.md", {
      models: "model-a,provider/model-b",
      qualityPass: true,
    });

    const inputPath = path.resolve("examples/demo/input.md");
    const baseOutDir = path.join(path.dirname(inputPath), "outputs", "runs");
    expect(runExtractCommand).toHaveBeenNthCalledWith(1, inputPath, {
      outDir: path.join(baseOutDir, "model-a"),
      model: "model-a",
      provider: undefined,
      patchModel: undefined,
      maxInputChars: undefined,
      temperature: undefined,
      qualityPass: true,
      maxPatchRounds: undefined,
    });
    expect(runExtractCommand).toHaveBeenNthCalledWith(2, inputPath, {
      outDir: path.join(baseOutDir, "provider_model-b"),
      model: "provider/model-b",
      provider: undefined,
      patchModel: undefined,
      maxInputChars: undefined,
      temperature: undefined,
      qualityPass: true,
      maxPatchRounds: undefined,
    });
  });

  it("honors a custom base output directory", async () => {
    await runCompareCommand("examples/demo/input.md", {
      models: "model-a",
      outDir: "custom-runs",
    });

    expect(runExtractCommand).toHaveBeenCalledWith(path.resolve("examples/demo/input.md"), {
      outDir: path.join(path.resolve("custom-runs"), "model-a"),
      model: "model-a",
      provider: undefined,
      patchModel: undefined,
      maxInputChars: undefined,
      temperature: undefined,
      qualityPass: undefined,
      maxPatchRounds: undefined,
    });
  });
});
