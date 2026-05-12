import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveExtractOutputDir } from "./extract.js";

describe("resolveExtractOutputDir", () => {
  const originalGraphctxOutputDir = process.env.GRAPHCTX_OUTPUT_DIR;

  beforeEach(() => {
    delete process.env.GRAPHCTX_OUTPUT_DIR;
  });

  afterEach(() => {
    if (originalGraphctxOutputDir === undefined) {
      delete process.env.GRAPHCTX_OUTPUT_DIR;
    } else {
      process.env.GRAPHCTX_OUTPUT_DIR = originalGraphctxOutputDir;
    }
  });

  it("defaults to an outputs subfolder beside the input file", () => {
    const inputPath = path.resolve("examples/demo/input.md");

    expect(resolveExtractOutputDir(inputPath)).toBe(path.join(path.dirname(inputPath), "outputs"));
  });

  it("honors an explicit output directory", () => {
    const inputPath = path.resolve("examples/demo/input.md");

    expect(resolveExtractOutputDir(inputPath, "custom-output")).toBe(path.resolve("custom-output"));
  });

  it("honors GRAPHCTX_OUTPUT_DIR when no explicit output directory is provided", () => {
    const inputPath = path.resolve("examples/demo/input.md");
    process.env.GRAPHCTX_OUTPUT_DIR = "env-output";

    expect(resolveExtractOutputDir(inputPath)).toBe(path.resolve("env-output"));
  });
});
