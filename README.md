# GraphCtx

Turn messy AI conversations into structured context graphs and reusable Context Packs.

## Status

This version is a local extraction/export engine with an opt-in Phase 1.5 quality pass. It does not include the visual graph UI yet.

## Quickstart

```bash
pnpm install
cp .env.example .env
# add an OpenAI or OpenRouter API key
pnpm graphctx run-example examples/graphctx-mvp-planning
```

## Extract Output

By default, direct `extract` writes these Phase 1 files next to the input unless `--out-dir` is provided:

- `graph.json`
- `context-pack.md`
- `evaluation.md`

With `--quality-pass`, `extract` writes:

- `graph.initial.json`
- `graph.json`
- `context-pack.md`
- `evaluation.md`
- `critique.json`
- `quality.diagnostics.json`

Example runs use a cleaner default and write generated files under:

```text
examples/<case>/outputs/
```

## Commands

```bash
pnpm graphctx extract examples/graphctx-mvp-planning/input.md
pnpm graphctx extract examples/graphctx-mvp-planning/input.md --quality-pass
pnpm graphctx extract examples/graphctx-mvp-planning/input.md --quality-pass --patch-model gpt-4.1
pnpm graphctx extract examples/graphctx-mvp-planning/input.md --provider openrouter
pnpm graphctx compare examples/graphctx-mvp-planning/input.md --models gpt-4.1-mini,gpt-4.1 --quality-pass
pnpm graphctx export examples/graphctx-mvp-planning/outputs/graph.json
pnpm graphctx run-example examples/graphctx-mvp-planning
pnpm graphctx run-example examples/graphctx-mvp-planning --out-dir examples/graphctx-mvp-planning
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

- `outputs/evaluation.json`
- `outputs/evaluation.auto.md`

Use `--skip-llm` for CI-friendly deterministic checks without API calls.

Use `--fail-under` to make evaluation fail below a score threshold:

```bash
pnpm graphctx evaluate examples/graphctx-mvp-planning --skip-llm --fail-under 4
```

## Phase 1.5 Quality Pass

The quality pass is opt-in:

```bash
pnpm graphctx extract examples/<case>/input.md --quality-pass
```

It runs a deterministic coverage check, asks the LLM to critique missing reusable context, then asks for a complete patched graph. The patch is accepted only if it validates and improves missing core node types, source traceability, or assumption/question/task coverage without bloating the graph.

Useful options:

```bash
--max-patch-rounds 1
--patch-model <model>
--model <model>
--temperature <number>
--provider openai|openrouter
--max-input-chars <chars>
```

Quality runs write:

- `graph.initial.json`
- `graph.json`
- `context-pack.md`
- `evaluation.md`
- `critique.json`
- `quality.diagnostics.json`

Without `--quality-pass`, direct `extract` keeps the Phase 1 behavior and writes only `graph.json`, `context-pack.md`, and `evaluation.md`.

When quality pass is run through `run-example`, those files are written under `examples/<case>/outputs/`.

For lightweight model comparison:

```bash
pnpm graphctx compare examples/<case>/input.md --models gpt-4.1-mini,gpt-4.1 --quality-pass
```

Comparison outputs are written under `examples/<case>/runs/<model>/` unless `--out-dir` is provided. Each model run uses the same output layout as `extract`.

## Environment

OpenAI:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

OpenRouter:

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

Optional:

```bash
GRAPHCTX_MAX_INPUT_CHARS=120000
GRAPHCTX_OUTPUT_DIR=
```

## Current Limitations

- LLM output quality varies.
- Source spans are quote-based, not exact character offsets.
- No UI yet.
- No persistence beyond generated files.
- No hosted mode.
- No live API tests run by default.
