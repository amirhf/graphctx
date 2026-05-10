export function buildExtractionPrompt(input: string): string {
  return `
You are GraphCtx, a tool that converts messy AI conversations or notes into a structured context graph.

Your task:
Extract a high-signal reusable context graph from the input.

Return ONLY valid JSON matching this schema:

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
    "version": "phase-1"
  }
}

Extraction rules:
- Extract only meaningful reusable units of context.
- Do not create one node per paragraph.
- Prefer fewer high-quality nodes over many shallow nodes.
- Preserve important decisions and their rationale.
- Make hidden assumptions explicit.
- Capture unresolved questions.
- Capture risks, blockers, and uncertainties.
- Convert next steps into concrete tasks.
- Include source/evidence nodes only when useful.
- Use clear, non-generic node titles.
- Create edges only when the relationship is meaningful.
- It is acceptable for some nodes to have no edge if no strong relationship exists.
- Use node IDs n1, n2, n3...
- Use edge IDs e1, e2, e3...
- Return valid JSON only. No Markdown. No commentary.

Recommended node count:
- Short input: 8-15 nodes
- Medium input: 15-30 nodes
- Long input: 30-50 nodes
- Do not exceed 60 nodes unless absolutely necessary.

Input:
${input}
`;
}
