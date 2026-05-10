import type { ContextGraph, CoverageAnalysis } from "@graphctx/graph-schema";
import type { GraphCritique } from "./critiquePrompt.js";

export function buildGraphPatchPrompt(args: {
  input: string;
  graph: ContextGraph;
  coverage: CoverageAnalysis;
  critique: GraphCritique;
}): string {
  return `
You are GraphCtx's graph patcher.

Return a complete patched ContextGraph JSON object, not a diff. Return JSON only.

Patch goals:
- Preserve good existing nodes, especially decisions, risks, tasks, assumptions, and questions.
- Add missing assumption, question, task, decision, or risk nodes only when justified by the source input.
- Do not fabricate unsupported content.
- Include source_span.quote whenever possible.
- Keep node IDs valid and unique.
- Keep edge IDs valid and unique.
- Add meaningful edges for new nodes.
- Avoid bloating the graph.
- Do not exceed 60 nodes unless the input is very long and the added nodes are clearly necessary.
- Do not remove strong existing decisions, risks, tasks, assumptions, or questions.
- If a missing category is genuinely absent from the input, do not invent nodes for it.

The output must match this ContextGraph shape:
{
  "title": "string",
  "summary": "string",
  "nodes": [
    {
      "id": "n1",
      "type": "idea | question | assumption | decision | risk | task | source | summary",
      "title": "short clear title",
      "body": "specific reusable context",
      "confidence": 0.0,
      "tags": ["optional"],
      "source_span": {
        "quote": "short quote from source text when possible"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "part_of | expands | supports | contradicts | depends_on | leads_to | answers",
      "rationale": "why these nodes are connected"
    }
  ],
  "metadata": {
    "version": "phase-1.5"
  }
}

Coverage analysis:
${JSON.stringify(args.coverage, null, 2)}

Critique:
${JSON.stringify(args.critique, null, 2)}

Current graph JSON:
${JSON.stringify(args.graph, null, 2)}

Original input:
${args.input}
`;
}
