# GraphCtx

Turn messy AI conversations into structured context graphs and reusable Context Packs.

## Phase 1 Status

This version is a local extraction/export engine. It does not include the visual graph UI yet.

## Quickstart

```bash
pnpm install
cp .env.example .env
# add an OpenAI or OpenRouter API key
pnpm graphctx extract examples/graphctx-mvp-planning/input.md
```

## Output

The extract command writes these files next to the input unless `--out-dir` is provided:

- `graph.json`
- `context-pack.md`
- `evaluation.md`

## Commands

```bash
pnpm graphctx extract examples/graphctx-mvp-planning/input.md
pnpm graphctx extract examples/graphctx-mvp-planning/input.md --provider openrouter
pnpm graphctx export examples/graphctx-mvp-planning/graph.json
pnpm graphctx run-example examples/graphctx-mvp-planning
pnpm graphctx evaluate examples/graphctx-mvp-planning
pnpm graphctx evaluate examples/graphctx-mvp-planning --skip-llm
pnpm graphctx evaluate-all examples --skip-llm
pnpm test
pnpm build
```

## Automated Evaluation

Generated examples can be evaluated with deterministic checks plus an optional LLM judge:

```bash
pnpm graphctx evaluate examples/graphctx-mvp-planning
```

This writes:

- `evaluation.json`
- `evaluation.auto.md`

Use `--skip-llm` for CI-friendly deterministic checks without API calls.

## Environment

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

## Current Limitations

- LLM output quality varies.
- Source spans are quote-based, not exact character offsets.
- No UI yet.
- No persistence beyond generated files.
- No hosted mode.
- No live API tests run by default.
