# Phase 1.5 Design

## Why Phase 1.5 Exists

Phase 1 can generate valid graphs and Context Packs, but automated evaluation showed inconsistent coverage of reusable-context categories such as assumptions, open questions, and tasks. Phase 1.5 adds an opt-in quality pass that improves extraction reliability without changing the local-first, no-UI scope.

## Quality Problems Observed

- Some graphs capture goals, ideas, decisions, risks, and source traceability while missing assumptions, tasks, or questions.
- Context Packs are less reusable when these categories are absent from planning and design conversations.
- Missing categories should not be filled by hallucination; they should be recovered only when explicit or strongly implied by the input.

## New Pipeline

```text
input.md
-> initial graph extraction
-> graph validation
-> coverage analysis
-> critique prompt
-> patch prompt
-> patched graph validation
-> acceptance heuristic
-> context-pack.md
-> diagnostics
```

The Phase 1 command remains unchanged unless `--quality-pass` is provided.

## Coverage Analyzer

Coverage analysis lives in `@graphctx/graph-schema` so both extraction and evaluation can use it without creating a package cycle. It reports node type counts, missing core reusable node types, source traceability ratio, edge count, weak edge rationales, and graph size warnings.

Core reusable node types are:

- `decision`
- `assumption`
- `risk`
- `question`
- `task`

Coverage findings are advisory. They never make an otherwise valid graph invalid.

## Critique Pass

The critique pass receives the original input, current graph JSON, and coverage analysis. It returns strict JSON describing missing node types, concrete issues, and a patch plan. The prompt explicitly asks the model not to invent unsupported content.

## Patch Pass

The patch pass returns a complete patched `ContextGraph`, not a diff. It must preserve strong existing nodes, add only grounded missing reusable context, include source quotes when possible, keep IDs valid and unique, and avoid graph bloat.

## Acceptance Heuristic

A patch is accepted only when:

- the patched graph validates
- missing core node types decrease, source traceability improves, or assumption/question/task counts improve
- node count does not grow beyond 60 without reason
- source traceability does not significantly regress
- existing high-value core categories are not erased

Rejected patches fall back to the original graph with quality metadata and diagnostics explaining why the patch was rejected.

## Output Files

With `--quality-pass`, extraction writes:

- `graph.initial.json`
- `graph.json`
- `context-pack.md`
- `evaluation.md`
- `critique.json`
- `quality.diagnostics.json`

When run through `run-example`, these files are written under `examples/<case>/outputs/` by default.

Without `--quality-pass`, extraction keeps the Phase 1 outputs:

- `graph.json`
- `context-pack.md`
- `evaluation.md`

## Known Limitations

- The first implementation supports one practical patch round by default.
- The quality pass still depends on LLM judgment for critique and patching.
- Coverage checks are simple heuristics, not a full semantic evaluator.
- Source spans remain quote-based rather than exact character offsets.
