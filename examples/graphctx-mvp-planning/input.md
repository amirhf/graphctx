# GraphCtx MVP Planning Conversation

This is a condensed real planning context for dogfooding GraphCtx on its own design.

## Core Idea

Instead of treating LLM interaction as one long linear chat, model it as a graph of thinking. Each node can represent a question, claim, idea, research result, decision, task, assumption, source, or plan. The graph becomes the durable thinking workspace, while the LLM becomes an operator that can act on parts of that graph.

## Product Thesis

Linear chat is not enough for complex AI-assisted thinking. Complex reasoning, research, and planning should be represented as structured, inspectable, reusable context.

## MVP Promise

Turn messy AI conversations into structured context graphs and reusable Context Packs.

## Strongest MVP Direction

The cleanest MVP is a graph-first AI workspace where a user can start from a messy idea or conversation, then progressively turn it into a structured map of questions, research nodes, decisions, risks, assumptions, and next actions.

The Context Pack export is the most practical value artifact. If extraction and export are weak, a graph UI will not create real value.

## Decisions

- Start with Context Pack quality before graph UI.
- Use a small node taxonomy: idea, question, assumption, decision, risk, task, source, summary.
- Use a small edge taxonomy: part_of, expands, supports, contradicts, depends_on, leads_to, answers.
- Start local-first and open-source with user-provided API keys.
- Do not build auth, collaboration, cloud hosting, browser extension, graph database, vector database, or advanced agent workflows in Phase 1.

## Assumptions

- Users have long AI conversations they want to reuse.
- Context Pack export is valuable enough to paste into future AI sessions.
- Graph structure improves understanding and may justify a UI later.
- Fixed node and edge taxonomies are understandable enough for early users.
- Source traceability matters for trust.
- Technical builders, founders, consultants, and AI power users are a good first audience.

## Risks

- The LLM may produce impressive-looking but shallow nodes.
- The graph may become too dense or generic if the prompt encourages one node per paragraph.
- The visual graph may distract from validating whether reusable context is actually valuable.
- Source spans may be unreliable if they rely only on quotes.

## Phase 1 Build

Build a local TypeScript CLI that reads a Markdown or text file, extracts a context graph with an LLM, validates the graph JSON, exports a deterministic Markdown Context Pack, and creates a manual evaluation template.

The command should produce:

- graph.json
- context-pack.md
- evaluation.md

## Success Criteria

- Five sample inputs produce valid graph JSON.
- Five sample inputs produce readable Context Packs.
- At least three outputs score 4/5 or higher on Context Pack usefulness.
- The generated Context Pack is useful enough to paste into a future AI session.

## Next Actions

- Bootstrap the pnpm TypeScript workspace.
- Implement the graph schema and validator first.
- Implement deterministic Context Pack export before LLM integration.
- Add OpenAI and OpenRouter clients behind the same interface.
- Run extraction against at least the GraphCtx MVP planning example.
- Score results manually and update Phase 1 results.
