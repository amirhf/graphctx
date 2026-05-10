import { describe, expect, it } from "vitest";
import { exportContextPackMarkdown } from "./exportMarkdown.js";

const graph = {
  title: "Exporter Test",
  summary: "Test context pack generation.",
  nodes: [
    { id: "n1", type: "idea", title: "Core Idea", body: "Use context packs." },
    { id: "n2", type: "decision", title: "Local First", body: "Keep phase one local." },
    { id: "n3", type: "assumption", title: "Users Reuse Chats", body: "Users want reusable context." },
    { id: "n4", type: "risk", title: "Shallow Output", body: "The model may produce generic nodes." },
    { id: "n5", type: "task", title: "Run Examples", body: "Generate outputs for samples." },
  ],
  edges: [{ id: "e1", source: "n1", target: "n2", type: "leads_to" }],
} as const;

describe("exportContextPackMarkdown", () => {
  it("renders expected sections and nodes", () => {
    const markdown = exportContextPackMarkdown(graph);

    expect(markdown).toContain("## Decisions Made");
    expect(markdown).toContain("**Decision:** Local First");
    expect(markdown).toContain("## Assumptions");
    expect(markdown).toContain("**Assumption:** Users Reuse Chats");
    expect(markdown).toContain("## Risks");
    expect(markdown).toContain("Shallow Output");
  });

  it("renders tasks as checklist items", () => {
    const markdown = exportContextPackMarkdown(graph);

    expect(markdown).toContain("- [ ] **Run Examples:** Generate outputs for samples.");
  });

  it("renders placeholders for missing sections", () => {
    const markdown = exportContextPackMarkdown(graph);

    expect(markdown).toContain("_No explicit open questions were extracted._");
    expect(markdown).toContain("_No useful source notes were extracted._");
  });

  it("includes the suggested next-session prompt", () => {
    const markdown = exportContextPackMarkdown(graph);

    expect(markdown).toContain("Suggested Prompt for Next AI Session");
  });
});
