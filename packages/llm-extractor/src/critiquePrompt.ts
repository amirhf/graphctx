import type { ContextGraph, CoverageAnalysis } from "@graphctx/graph-schema";
import { z } from "zod";

const coreCritiqueNodeTypes = ["decision", "assumption", "risk", "question", "task"] as const;
const coreCritiqueNodeTypeSet = new Set<string>(coreCritiqueNodeTypes);

function normalizeMissingNodeTypes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedTypes = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const normalized = item.toLowerCase().trim().replace(/[\s-]+/g, "_");
    const alias = normalized === "open_question" || normalized === "open_questions" ? "question" : normalized;
    if (coreCritiqueNodeTypeSet.has(alias)) {
      normalizedTypes.add(alias);
    }
  }

  return [...normalizedTypes];
}

export const GraphCritiqueSchema = z.object({
  summary: z.string().min(1),
  missing_node_types: z.preprocess(normalizeMissingNodeTypes, z.array(z.enum(coreCritiqueNodeTypes))),
  issues: z.array(
    z.object({
      type: z.enum([
        "missing_node_type",
        "weak_node",
        "duplicate_node",
        "missing_edge",
        "source_traceability",
        "other",
      ]),
      severity: z.enum(["low", "medium", "high"]),
      description: z.string().min(1),
      suggested_fix: z.string().min(1),
    }),
  ),
  patch_plan: z.array(z.string().min(1)),
});

export type GraphCritique = z.infer<typeof GraphCritiqueSchema>;

export function createNoopGraphCritique(summary: string): GraphCritique {
  return {
    summary,
    missing_node_types: [],
    issues: [],
    patch_plan: [],
  };
}

export function buildGraphCritiquePrompt(args: {
  input: string;
  graph: ContextGraph;
  coverage: CoverageAnalysis;
}): string {
  return `
You are GraphCtx's extraction quality reviewer.

Your task is to critique a current ContextGraph for reusable-context gaps. Focus especially on missing or weak:
- assumptions
- tasks / next actions
- open questions
- decisions that are implied but not explicit
- risks that are underrepresented
- weak or generic nodes
- duplicate nodes
- missing source quotes

Do not invent content. Only recommend additions or changes that are explicit in, or strongly implied by, the source input.
Only include decision, assumption, risk, question, or task in missing_node_types. Use source_traceability issues for missing source quotes instead of adding source to missing_node_types.

Return ONLY valid JSON matching this exact shape:
{
  "summary": "short critique summary",
  "missing_node_types": ["decision | assumption | risk | question | task"],
  "issues": [
    {
      "type": "missing_node_type | weak_node | duplicate_node | missing_edge | source_traceability | other",
      "severity": "low | medium | high",
      "description": "specific issue",
      "suggested_fix": "specific grounded fix"
    }
  ],
  "patch_plan": ["ordered patch step"]
}

Coverage analysis:
${JSON.stringify(args.coverage, null, 2)}

Current graph JSON:
${JSON.stringify(args.graph, null, 2)}

Original input:
${args.input}
`;
}
