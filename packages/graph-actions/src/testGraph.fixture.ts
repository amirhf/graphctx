import type { GraphDocument } from "@graphctx/graph-schema";

export const testGraph: GraphDocument = {
  id: "phase2-test-graph",
  title: "Phase 2 Test Graph",
  summary: "A compact graph for node action tests.",
  createdAt: "2026-05-12T00:00:00.000Z",
  updatedAt: "2026-05-12T00:00:00.000Z",
  nodes: [
    {
      id: "idea-1",
      type: "idea",
      title: "Graph as interaction surface",
      body: "Users should manipulate graph nodes directly.",
      tags: ["phase2", "ui"],
    },
    {
      id: "question-1",
      type: "question",
      title: "How should expansion work?",
      body: "The selected node should drive a bounded graph patch.",
      tags: ["phase2"],
    },
    {
      id: "decision-1",
      type: "decision",
      title: "Use preview patches",
      body: "Graph-changing AI actions must be previewed before apply.",
      tags: ["phase2"],
    },
    {
      id: "assumption-1",
      type: "assumption",
      title: "Local mock mode is enough",
      body: "A deterministic mock can support UI development and CI.",
      tags: ["phase2"],
    },
    {
      id: "risk-1",
      type: "risk",
      title: "Patch may corrupt graph",
      body: "Patch application needs validation against dangling edges.",
      tags: ["phase2"],
    },
    {
      id: "task-1",
      type: "task",
      title: "Build patch tests",
      body: "Add tests for valid and invalid graph patches.",
      tags: ["phase2"],
    },
    {
      id: "source-1",
      type: "source",
      title: "Phase 2 spec",
      body: "The implementation should prove select node, expand, preview, apply.",
      tags: ["phase2"],
    },
  ],
  edges: [
    {
      id: "edge-1",
      source: "idea-1",
      target: "question-1",
      type: "leads_to",
      rationale: "The interaction idea raises the expansion question.",
    },
    {
      id: "edge-2",
      source: "decision-1",
      target: "question-1",
      type: "answers",
      rationale: "Preview patches answer part of the expansion flow.",
    },
    {
      id: "edge-3",
      source: "risk-1",
      target: "decision-1",
      type: "depends_on",
      rationale: "The risk motivates patch validation.",
    },
  ],
};
