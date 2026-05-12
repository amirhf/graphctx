# GraphCtx

Turn messy AI conversations into structured context graphs and reusable Context Packs.

## Status

This version is a local extraction/export engine with an opt-in quality pass. It does not include the visual graph UI yet.

## Quickstart

```bash
pnpm install
cp .env.example .env
# add an OpenAI or OpenRouter API key
pnpm graphctx run-examples
```

## Extract Output

By default, commands write generated files under an `outputs/` folder unless `--out-dir` is provided.

For `extract` and `run-example`, the default output folder is:

```text
examples/<case>/outputs/
```

Without `--quality-pass`, extraction writes:

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

## Commands

### `extract`

Extracts a graph and Context Pack from a Markdown or text input file.

```bash
pnpm graphctx extract examples/graphctx-mvp-planning/input.md
```

Use `--quality-pass` to run the critique-and-patch layer:

```bash
pnpm graphctx extract examples/graphctx-mvp-planning/input.md --quality-pass
pnpm graphctx extract examples/graphctx-mvp-planning/input.md --quality-pass --patch-model gpt-4.1
```

Use `--provider` or `--model` to override the configured LLM:

```bash
pnpm graphctx extract examples/graphctx-mvp-planning/input.md --provider openrouter
```

### `compare`

Runs extraction for multiple models and writes each run to a separate model folder. This is useful for comparing graph coverage, Context Pack quality, and quality-pass behavior across models or prompts.

```bash
pnpm graphctx compare examples/graphctx-mvp-planning/input.md --models gpt-4.1-mini,gpt-4.1 --quality-pass
```

By default, comparison runs are written under `examples/<case>/outputs/runs/<model>/`.

### `export`

Regenerates `context-pack.md` from an existing `graph.json` without calling an LLM. If the graph is already inside an `outputs/` folder, the Context Pack is written there; otherwise it is written to a sibling `outputs/` folder.

```bash
pnpm graphctx export examples/graphctx-mvp-planning/outputs/graph.json
```

### `run-example`

Runs extraction for an example directory containing `input.md`. By default, generated files are written to `examples/<case>/outputs/`.

```bash
pnpm graphctx run-example examples/graphctx-mvp-planning
```

Use `--out-dir` to intentionally write somewhere else:

```bash
pnpm graphctx run-example examples/graphctx-mvp-planning --out-dir /tmp/graphctx-output
```

### `run-examples`

Runs extraction and evaluation for every immediate child folder under a parent examples directory. Each child folder must contain `input.md`. Evaluation uses the LLM judge by default.

```bash
pnpm graphctx run-examples
pnpm graphctx run-examples examples --quality-pass
pnpm graphctx run-examples examples --quality-pass --skip-llm
pnpm graphctx run-examples examples --provider openrouter --model openai/gpt-4.1-mini
```

Use judge-specific options when the evaluator should use a different model from extraction:

```bash
pnpm graphctx run-examples examples --judge-provider openai --judge-model gpt-4.1
```

### `evaluate`

Evaluates one generated example using deterministic checks and, unless `--skip-llm` is passed, an optional LLM judge. By default, it reads from and writes to `examples/<case>/outputs/`.

```bash
pnpm graphctx evaluate examples/graphctx-mvp-planning
pnpm graphctx evaluate examples/graphctx-mvp-planning --skip-llm
```

### `evaluate-all`

Evaluates every example folder with generated outputs. Examples missing `outputs/graph.json` or `outputs/context-pack.md` are skipped.

```bash
pnpm graphctx evaluate-all examples --skip-llm
```

### Development Commands

Build all workspace packages:

```bash
pnpm build
```

Run the full test suite:

```bash
pnpm test
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

## Quality Pass

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

Without `--quality-pass`, `extract` writes only `graph.json`, `context-pack.md`, and `evaluation.md` under `outputs/`.

For lightweight model comparison:

```bash
pnpm graphctx compare examples/<case>/input.md --models gpt-4.1-mini,gpt-4.1 --quality-pass
```

Comparison outputs are written under `examples/<case>/outputs/runs/<model>/` unless `--out-dir` is provided. Each model run uses the same output layout as `extract`.

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
