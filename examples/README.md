# Phase 1 Test Examples

These examples are used to test whether GraphCtx can turn messy AI conversations or notes into useful reusable Context Packs.

Run one example:

```bash
pnpm graphctx run-example examples/graphctx-mvp-planning
```

Generated files are written to an ignored output folder:

```text
examples/graphctx-mvp-planning/outputs/
```

Evaluate the generated output:

```bash
pnpm graphctx evaluate examples/graphctx-mvp-planning --skip-llm
```

Run extraction and evaluation for every example folder:

```bash
pnpm graphctx run-examples examples --skip-llm
pnpm graphctx run-examples examples --quality-pass --skip-llm
```

To intentionally write generated files somewhere else, pass an explicit output directory:

```bash
pnpm graphctx run-example examples/graphctx-mvp-planning --out-dir /tmp/graphctx-output
```

The first example uses real GraphCtx planning material. The other four examples are synthetic placeholders and should be replaced with real user conversations before judging Phase 1 quality.
