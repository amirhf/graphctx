import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveExportOutputDir } from "./export.js";

describe("resolveExportOutputDir", () => {
  it("defaults to an outputs subfolder beside root-level graph files", () => {
    const graphPath = path.resolve("examples/demo/graph.json");

    expect(resolveExportOutputDir(graphPath)).toBe(path.join(path.dirname(graphPath), "outputs"));
  });

  it("keeps output in the same folder when the graph is already in outputs", () => {
    const graphPath = path.resolve("examples/demo/outputs/graph.json");

    expect(resolveExportOutputDir(graphPath)).toBe(path.dirname(graphPath));
  });

  it("honors a custom output directory", () => {
    const graphPath = path.resolve("examples/demo/graph.json");

    expect(resolveExportOutputDir(graphPath, "custom-output")).toBe(path.resolve("custom-output"));
  });
});
