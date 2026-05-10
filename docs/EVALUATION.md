# Evaluation

## A good graph extraction should:

- Preserve the main goal of the conversation
- Extract important decisions
- Make hidden assumptions explicit
- Identify risks and unresolved questions
- Convert next steps into tasks
- Avoid creating too many low-value nodes
- Use clear node titles
- Create meaningful edges
- Preserve source references where possible
- Produce a Context Pack useful enough to paste into a future AI session

## Bad output patterns

- Too many generic nodes
- Repeating the same idea in multiple nodes
- Missing decisions
- Missing risks
- Treating every paragraph as a node
- Producing shallow tasks
- Creating decorative but meaningless edges
- Context Pack reads like a generic summary instead of reusable project context

## Manual Scorecard

Score each example from 1-5:

| Category | Score |
|---|---:|
| Captures goal |  |
| Captures key ideas |  |
| Captures decisions |  |
| Captures assumptions |  |
| Captures risks |  |
| Captures tasks |  |
| Context Pack usefulness |  |
| Graph coherence |  |
| Source traceability |  |
| Overall reuse value |  |

## Automated Evaluation

Run automated evaluation for an example with generated outputs:

```bash
pnpm graphctx evaluate examples/graphctx-mvp-planning
```

Run deterministic checks only:

```bash
pnpm graphctx evaluate examples/graphctx-mvp-planning --skip-llm
pnpm graphctx evaluate-all examples --skip-llm
```

Automated evaluation writes:

- `evaluation.json`
- `evaluation.auto.md`

The automated evaluator combines deterministic checks with an optional LLM judge. Deterministic checks validate graph JSON, count node/edge coverage, check required Context Pack sections, verify task checklist rendering, and estimate source traceability. The LLM judge scores the output against the same Phase 1 criteria and recommends prompt or schema changes.
