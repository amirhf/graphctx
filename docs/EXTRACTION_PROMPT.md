# Extraction Prompt

The extraction prompt lives in `packages/llm-extractor/src/prompts.ts`.

It instructs the LLM to:

- extract high-signal reusable context
- identify goals, ideas, decisions, assumptions, risks, questions, tasks, and useful sources
- avoid one node per paragraph
- prefer fewer clear nodes over graph density
- use readable IDs such as `n1` and `e1`
- return valid JSON only

Recommended node count:

- Short input: 8-15 nodes
- Medium input: 15-30 nodes
- Long input: 30-50 nodes
- Do not exceed 60 nodes unless absolutely necessary

Prompt changes should be evaluated against the five Phase 1 examples before becoming defaults.
