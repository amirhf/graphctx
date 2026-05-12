# Context Pack: Phase 2 Node Expansion

## Goal

Phase 2 should validate select-node expansion through previewable graph patches.

## Current Understanding

- **Phase 2 workflow:** Phase 2 should prove select node, expand with context, preview patch, apply, and export.

## Key Ideas

_No explicit key ideas were extracted._

## Claims

_No explicit claims were extracted._

## Decisions Made

- **Decision:** Preview patches before apply
  - Rationale: Graph-changing AI actions must return a previewable patch before they mutate the graph.
  - Related nodes: question-1, risk-1

## Assumptions

- **Assumption:** Mock mode is enough for development
  - Confidence: unspecified
  - Needs validation: Local deterministic mock mode can support UI development and CI.
- **Assumption:** Assumption behind How should node expansion work?
  - Confidence: unspecified
  - Needs validation: The current graph contains enough context to propose a bounded answer without restarting from basics.

## Open Questions

- **How should node expansion work?:** The selected node should drive an expansion that returns a structured graph patch.

## Answers

- **Draft answer for How should node expansion work?:** A focused next answer should address "How should node expansion work?" using the current graph context.

## Risks

- **Patch can corrupt graph:** An invalid patch could leave dangling edges or hide where new context came from.

## Tradeoffs

_No explicit tradeoffs were extracted._

## Tasks / Next Actions

- [ ] **Validate patched export:** Validate patch application and Context Pack export after the patch is applied.
- [ ] **Validate answer for How should node expansion work?:** Review the proposed answer against the original source notes and update the graph if it is unsupported.

## Useful Source Notes

_No useful source notes were extracted._

## Suggested Prompt for Next AI Session

Use the following context as the current state of the project. Do not restart from basics. Focus on unresolved questions, active assumptions, risks, and the next concrete actions.
