# Context Pack: GraphCtx MVP Planning Context Graph

## Goal

This context graph captures the core ideas, product thesis, MVP direction, decisions, assumptions, risks, phase 1 build plan, success criteria, and next actions for the GraphCtx MVP project focused on converting messy AI conversations into structured context graphs and reusable Context Packs.

## Current Understanding

- **Success Criteria for Phase 1:** Five sample inputs produce valid graph JSON and readable Context Packs; at least three outputs score 4/5 or higher on Context Pack usefulness; generated Context Packs are useful for future AI sessions.
  - Source: "Five sample inputs produce valid graph JSON... At least three outputs score 4/5 or higher on Context Pack usefulness."

## Key Ideas

- **Graph-based LLM Interaction Model:** Model LLM interaction as a graph of thinking where each node represents a question, claim, idea, research result, decision, task, assumption, source, or plan, making the graph a durable thinking workspace.
  - Source: "Instead of treating LLM interaction as one long linear chat, model it as a graph of thinking."
- **Structured, Inspectable, Reusable Context:** Complex AI-assisted reasoning, research, and planning require structured, inspectable, and reusable context rather than linear chat.
  - Source: "Linear chat is not enough for complex AI-assisted thinking."

## Decisions Made

- **Decision:** Focus on Context Pack Quality Before Graph UI
  - Rationale: Prioritize the quality of Context Pack export before developing the graph user interface to ensure practical value.
  - Related nodes: n14
  - Source: "Start with Context Pack quality before graph UI."
- **Decision:** Use Small Fixed Node and Edge Taxonomies
  - Rationale: Adopt a small node taxonomy (idea, question, assumption, decision, risk, task, source, summary) and a small edge taxonomy (part_of, expands, supports, contradicts, depends_on, leads_to, answers) for clarity and usability.
  - Related nodes: n13
  - Source: "Use a small node taxonomy... Use a small edge taxonomy..."
- **Decision:** Phase 1 Excludes Auth, Collaboration, Cloud, and Advanced Features
  - Rationale: Do not build authentication, collaboration, cloud hosting, browser extension, graph database, vector database, or advanced agent workflows in Phase 1 to focus on core MVP.
  - Related nodes: n13
  - Source: "Do not build auth, collaboration, cloud hosting, browser extension, graph database, vector database, or advanced agent workflows in Phase 1."

## Assumptions

- **Assumption:** Users Have Long AI Conversations to Reuse
  - Confidence: 85%
  - Needs validation: Target users engage in long AI conversations that they want to reuse and structure for future sessions.
  - Source: "Users have long AI conversations they want to reuse."
- **Assumption:** Context Pack Export is Valuable
  - Confidence: 90%
  - Needs validation: Exporting Context Packs is valuable enough for users to paste into future AI sessions, providing practical reuse.
  - Source: "Context Pack export is valuable enough to paste into future AI sessions."
- **Assumption:** Graph Structure Improves Understanding
  - Confidence: 80%
  - Needs validation: Using a graph structure improves understanding of complex conversations and may justify building a UI later.
  - Source: "Graph structure improves understanding and may justify a UI later."

## Open Questions

_No explicit open questions were extracted._

## Risks

- **LLM May Produce Shallow Nodes:** The LLM might generate nodes that look impressive but lack depth or meaningful content.
  - Source: "The LLM may produce impressive-looking but shallow nodes."
- **Graph May Become Too Dense or Generic:** If the prompt encourages one node per paragraph, the graph may become overly dense or generic, reducing usefulness.
  - Source: "The graph may become too dense or generic if the prompt encourages one node per paragraph."
- **Visual Graph May Distract from Validation:** The visual representation of the graph might distract users from validating whether the extracted reusable context is actually valuable.
  - Source: "The visual graph may distract from validating whether reusable context is actually valuable."
- **Source Spans May Be Unreliable:** Source spans relying solely on quotes may be unreliable, potentially affecting trust and traceability.
  - Source: "Source spans may be unreliable if they rely only on quotes."

## Tasks / Next Actions

- [ ] **Build Local TypeScript CLI for Phase 1:** Develop a local TypeScript CLI that reads Markdown or text files, extracts context graphs with an LLM, validates graph JSON, exports deterministic Markdown Context Packs, and creates a manual evaluation template.
  - Source: "Build a local TypeScript CLI that reads a Markdown or text file, extracts a context graph with an LLM, validates the graph JSON, exports a deterministic Markdown Context Pack, and creates a manual evaluation template."
- [ ] **Produce graph.json, context-pack.md, and evaluation.md:** The CLI command should output graph.json, context-pack.md, and evaluation.md files as deliverables.
  - Source: "The command should produce: graph.json, context-pack.md, evaluation.md"
- [ ] **Bootstrap pnpm TypeScript Workspace:** Initialize the pnpm TypeScript workspace as the first development step.
  - Source: "Bootstrap the pnpm TypeScript workspace."
- [ ] **Implement Graph Schema and Validator:** Develop the graph schema and JSON validator before other components.
  - Source: "Implement the graph schema and validator first."
- [ ] **Implement Deterministic Context Pack Export:** Create the deterministic Context Pack export functionality before integrating the LLM.
  - Source: "Implement deterministic Context Pack export before LLM integration."
- [ ] **Add OpenAI and OpenRouter Clients:** Integrate OpenAI and OpenRouter clients behind a unified interface for LLM access.
  - Source: "Add OpenAI and OpenRouter clients behind the same interface."
- [ ] **Run Extraction on GraphCtx MVP Planning Example:** Test the extraction process using the GraphCtx MVP planning conversation as input.
  - Source: "Run extraction against at least the GraphCtx MVP planning example."
- [ ] **Manually Score Extraction Results:** Manually evaluate extraction outputs and update Phase 1 results accordingly.
  - Source: "Score results manually and update Phase 1 results."

## Useful Source Notes

_No useful source notes were extracted._

## Suggested Prompt for Next AI Session

Use the following context as the current state of the project. Do not restart from basics. Focus on unresolved questions, active assumptions, risks, and the next concrete actions.
