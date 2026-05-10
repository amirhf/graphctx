# Phase 1 Results

## Summary

Phase 1 has been bootstrapped as a local TypeScript extraction/export engine.

## What Was Built

- pnpm TypeScript workspace
- graph schema and validation
- OpenAI and OpenRouter extractor clients
- deterministic Context Pack exporter
- deterministic evaluation template generator
- local CLI
- five example input folders

## Example Outputs

| Example | Graph Generated | Context Pack Generated | Manual Score | Notes |
|---|---|---|---:|---|
| graphctx-mvp-planning | Yes | Yes |  | Generated with OpenRouter using `openai/gpt-4.1-mini`; manual scoring pending |
| technical-design | No | No |  | Placeholder input |
| startup-validation | No | No |  | Placeholder input |
| learning-path | No | No |  | Placeholder input |
| consulting-discovery | No | No |  | Placeholder input |

## What Worked

- The local CLI generated `graph.json`, `context-pack.md`, and `evaluation.md` for the GraphCtx planning example.
- The generated graph validated successfully after adding light LLM alias normalization for common invented node/edge labels.
- The Context Pack grouped decisions, assumptions, risks, and tasks into readable reusable sections.

## What Failed or Felt Weak

- The first live extraction returned an invented node type, `success`, which required extractor-side normalization.
- Empty `GRAPHCTX_OUTPUT_DIR=` initially wrote outputs to the workspace root; empty env values are now treated as unset.

## Extraction Issues

- LLMs may invent reasonable but invalid labels such as `success`; Phase 1 now normalizes a small set of aliases while keeping the schema strict.

## Context Pack Issues

- The first generated GraphCtx Context Pack did not extract explicit open questions or source nodes, even though it captured decisions, risks, assumptions, and tasks.

## Schema Changes Needed

## Decision: Continue to Phase 2?

Choose one:

- Continue to graph UI
- Improve extraction first
- Reposition around Context Pack Generator

## Recommended Phase 2 Scope
