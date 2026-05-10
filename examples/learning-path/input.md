# Placeholder Learning Path Conversation

This is a synthetic placeholder. Replace it with a real learning-path conversation before evaluating Phase 1 quality.

## Notes

The learner wants to understand LangGraph, MCP, and agent workflow design well enough to build production-grade AI tools. They already know TypeScript, backend systems, and basic LLM API usage, but they are weak on durable agent state, tool protocols, evaluation, and observability.

The learning path should start with core concepts, then move into small projects:

- Understand graph-based control flow.
- Build a simple agent with tool calls.
- Add durable checkpoints and human approval.
- Expose a local MCP server.
- Evaluate outputs with deterministic and manual checks.

Assumptions:

- The learner learns best through projects.
- TypeScript examples are more useful than Python examples for this person.
- A small end-to-end project will reveal gaps faster than reading docs alone.

Risks:

- The ecosystem changes quickly.
- The learner may over-focus on frameworks instead of core design ideas.
- Evaluation may be skipped unless it is built into every project.

Open questions:

- Should the first project use LangGraph directly or a simpler custom workflow?
- Which MCP client should be used for testing?
- What does "production-grade" mean for the first milestone?
