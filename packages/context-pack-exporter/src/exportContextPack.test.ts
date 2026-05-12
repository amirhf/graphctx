import { validateGraphDocument, type GraphDocument } from "@graphctx/graph-schema";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { exportContextPack } from "./exportContextPack.js";

const graphDocument: GraphDocument = {
  id: "export-doc",
  title: "Exporter Adapter Test",
  summary: "Test selected and full Context Pack export.",
  createdAt: "2026-05-12T00:00:00.000Z",
  updatedAt: "2026-05-12T00:00:00.000Z",
  nodes: [
    { id: "q1", type: "question", title: "Question", body: "What should happen?", tags: [] },
    { id: "a1", type: "answer", title: "Answer", body: "Use a preview patch.", tags: [] },
    { id: "d1", type: "decision", title: "Decision", body: "Preview before apply.", tags: [] },
    { id: "r1", type: "risk", title: "Risk", body: "Unselected risk.", tags: [] },
  ],
  edges: [
    { id: "e1", source: "a1", target: "q1", type: "answers" },
    { id: "e2", source: "d1", target: "q1", type: "supports" },
    { id: "e3", source: "r1", target: "d1", type: "contradicts" },
  ],
};

async function readFixtureJson<T>(fileName: string): Promise<T> {
  const filePath = path.join(process.cwd(), "examples", "phase2-node-expansion", fileName);
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function readFixtureText(fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), "examples", "phase2-node-expansion", fileName);
  return readFile(filePath, "utf8");
}

describe("exportContextPack", () => {
  it("exports a full GraphDocument", () => {
    const markdown = exportContextPack({ graph: graphDocument });

    expect(markdown).toContain("# Context Pack: Exporter Adapter Test");
    expect(markdown).toContain("## Answers");
    expect(markdown).toContain("**Answer:** Use a preview patch.");
    expect(markdown).toContain("Unselected risk.");
  });

  it("exports a selected subgraph only", () => {
    const markdown = exportContextPack({
      graph: graphDocument,
      selectedNodeIds: ["q1", "a1"],
    });

    expect(markdown).toContain("# Context Pack: Selected subgraph: Exporter Adapter Test");
    expect(markdown).toContain("**Question:** What should happen?");
    expect(markdown).toContain("**Answer:** Use a preview patch.");
    expect(markdown).not.toContain("Unselected risk.");
    expect(markdown).not.toContain("Preview before apply.");
  });

  it("exports a ContextGraph by wrapping it as a document", () => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...contextGraph } = graphDocument;
    const markdown = exportContextPack({ graph: contextGraph });

    expect(markdown).toContain("# Context Pack: Exporter Adapter Test");
    expect(markdown).toContain("**Answer:** Use a preview patch.");
  });

  it("exports the patched Phase 2 fixture with new answer nodes", async () => {
    const graph = await readFixtureJson<GraphDocument>("updated-graph.json");
    const expected = await readFixtureText("context-pack.md");
    const validation = validateGraphDocument(graph);

    expect(validation.ok).toBe(true);
    expect(exportContextPack({ graph }).trim()).toBe(expected.trim());
  });
});
