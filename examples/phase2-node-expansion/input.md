# Phase 2 Node Expansion Fixture

We want GraphCtx Phase 2 to prove that a graph can become the interaction
surface for AI work, not just an output artifact.

The user should paste notes, generate a graph, select a node, ask for an
expansion, preview a structured graph patch, and apply it only if useful.

Decision: graph-changing AI actions must return a previewable patch before
they mutate the graph.

Assumption: local deterministic mock mode is enough for UI development and CI.

Risk: an invalid patch could leave dangling edges or hide where new context
came from.

Task: validate patch application and Context Pack export after the patch is
applied.
