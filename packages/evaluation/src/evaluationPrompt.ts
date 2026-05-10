export function buildEvaluationPrompt(input: {
  sourceInput: string;
  graphJson: unknown;
  contextPackMarkdown: string;
  deterministicSummary: unknown;
}): string {
  return `
You are evaluating GraphCtx, a tool that turns messy AI conversations or notes into:
1. a structured context graph
2. a reusable Markdown Context Pack

Your job is to judge whether the generated graph and Context Pack preserve useful reusable context from the original input.

Do not rewrite the output. Do not be generous because the output looks polished. Penalize generic summaries, missing decisions, missing assumptions, missing risks, shallow tasks, decorative edges, and unsupported claims.

Return ONLY valid JSON matching this shape:

{
  "criteria": {
    "captures_main_goal": { "score": 1, "notes": "string", "evidence": "string" },
    "captures_key_ideas": { "score": 1, "notes": "string", "evidence": "string" },
    "captures_decisions": { "score": 1, "notes": "string", "evidence": "string" },
    "captures_assumptions": { "score": 1, "notes": "string", "evidence": "string" },
    "captures_risks": { "score": 1, "notes": "string", "evidence": "string" },
    "captures_tasks": { "score": 1, "notes": "string", "evidence": "string" },
    "context_pack_usefulness": { "score": 1, "notes": "string", "evidence": "string" },
    "graph_coherence": { "score": 1, "notes": "string", "evidence": "string" },
    "source_traceability": { "score": 1, "notes": "string", "evidence": "string" },
    "overall_reuse_value": { "score": 1, "notes": "string", "evidence": "string" }
  },
  "would_reuse": "yes | no | maybe",
  "biggest_missing_value": "string",
  "recommended_changes": ["string"]
}

Scoring rubric:
1 = unusable or mostly wrong
2 = partially useful but misses important context
3 = usable with clear gaps
4 = strong and reusable with minor gaps
5 = excellent; could be pasted into a future AI session with high confidence

Original input:
${input.sourceInput}

Deterministic check summary:
${JSON.stringify(input.deterministicSummary, null, 2)}

Generated graph JSON:
${JSON.stringify(input.graphJson, null, 2)}

Generated Context Pack:
${input.contextPackMarkdown}
`;
}
