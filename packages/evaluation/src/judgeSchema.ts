import { z } from "zod";
import { evaluationCriteria } from "./types.js";

export const CriterionScoreSchema = z.object({
  score: z.number().int().min(1).max(5),
  notes: z.string().min(1),
  evidence: z.string().min(1),
});

export const JudgeEvaluationSchema = z.object({
  criteria: z.object(
    Object.fromEntries(evaluationCriteria.map((criterion) => [criterion, CriterionScoreSchema])) as Record<
      (typeof evaluationCriteria)[number],
      typeof CriterionScoreSchema
    >,
  ),
  would_reuse: z.enum(["yes", "no", "maybe"]),
  biggest_missing_value: z.string().min(1),
  recommended_changes: z.array(z.string().min(1)).default([]),
});
