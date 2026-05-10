# Phase 1 Design

## Purpose

GraphCtx Phase 1 tests whether messy AI conversations or note dumps can be converted into reusable project context.

The local pipeline is:

```text
input.md
-> extract graph with LLM
-> validate graph JSON
-> export context-pack.md
-> create evaluation.md
```

## Scope

Phase 1 includes only the local extraction/export engine:

- TypeScript pnpm workspace
- fixed graph schema
- OpenAI and OpenRouter extraction clients
- deterministic Markdown exporter
- deterministic evaluation template
- CLI commands
- example input folders

Phase 1 excludes UI, accounts, cloud persistence, hosted services, browser extensions, graph databases, vector databases, collaboration, analytics, and agent execution.

## Data Model

Nodes use these types:

```text
idea, question, assumption, decision, risk, task, source, summary
```

Edges use these types:

```text
part_of, expands, supports, contradicts, depends_on, leads_to, answers
```

The schema is intentionally small so extraction quality can be evaluated before adding UI or advanced graph behavior.

## Validation

Zod validates the graph shape. Custom validation enforces unique node and edge IDs, valid edge endpoints, no self-edges, and at least one node. Warnings flag overly large graphs and missing decision, assumption, risk, or task nodes.

## Export

The Context Pack exporter does not call an LLM. It deterministically groups extracted nodes into reusable Markdown sections.
