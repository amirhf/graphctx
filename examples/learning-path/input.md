# Evaluation Fixture: MCP-Based BI Specification Workflow

> **Public-safe fixture.** This file is a sanitized and condensed Markdown version of a longer AI-assisted planning conversation. It is intended for evaluating graph/context extraction systems.  
> It removes private file names, personal details, and assessment-specific identifiers. The BI product name has been generalized to **MockBI**.  
> It preserves the structure of the reasoning: planning, session decomposition, dependency mapping, prompt orchestration, final review, and targeted cleanup.

---

## 1. Scenario Overview

A user is preparing a technical specification for a mock **MCP server** that exposes a Tableau-like business intelligence platform to AI agents.

The expected final deliverable is a single coherent technical specification. The spec should cover:

- Product/domain model
- SQLite-backed schema
- MCP tool surface
- Detailed tool contracts
- Workflow-to-tool mapping
- Pagination, filtering, sorting, and query semantics
- Seed data strategy
- Filesystem artifact behavior for renders and exports
- Testing strategy
- Failure modes
- Open questions and trade-offs

The user wants to use AI as a structured design partner, not as a one-shot generator.

---

## 2. Initial User Request

The user asks for a plan to deliver the assessment in the strongest possible shape with help from AI.

Key requirements:

- Refresh MCP concepts.
- Understand Tableau-like BI platform behavior.
- Design a believable mock BI domain model.
- Define a focused MCP tool surface.
- Write implementable tool contracts.
- Ensure the final spec can be tested against realistic workflows.
- Build or describe a test harness that validates the spec against test cases.

---

## 3. Initial Planning Response

The assistant reframes the work as a **contract-design assessment**, not a coding task.

### Main Recommendation

Treat the submission as a technical contract for an agent-facing BI system.

The strongest answer should show:

| Evaluation Signal | What It Means |
|---|---|
| Agent-friendly tool design | Tools are discoverable, focused, and have model-facing descriptions. |
| Realistic BI behavior | The mock feels like a dashboard/analytics platform, not a toy database wrapper. |
| SQLite + filesystem implementability | Every tool maps cleanly to local tables and generated files. |
| Senior engineering judgment | The spec explains trade-offs, exclusions, and recovery paths. |
| Testability | Workflows can be validated using seeded scenarios and golden fixtures. |

### Core Strategy

The recommended sequence:

1. Refresh MCP tool-design principles.
2. Research Tableau-like BI behavior.
3. Define the domain model.
4. Design the SQLite schema.
5. Define shared filter/query/pagination semantics.
6. Design the MCP tool surface.
7. Write detailed tool contracts.
8. Map workflows to tool calls.
9. Define seed data.
10. Define tests and validation harness.
11. Assemble the final spec.
12. Run a critique pass.
13. Polish and submit.

---

## 4. MCP Refresh Areas

The assistant identifies the MCP concepts most relevant to this assessment:

| Topic | Why It Matters |
|---|---|
| MCP server role | The server exposes domain capabilities to an AI client. |
| Tools | Model-callable functions with schema-defined inputs and outputs. |
| Tool descriptions | The model sees them, so descriptions influence planning and tool choice. |
| JSON Schema | Inputs must be strongly typed and validated. |
| Structured errors | Agents need recoverable error responses. |
| Tool boundaries | Prefer focused `list`, `get`, `query`, `render`, and `export` tools. |
| Resources/prompts | Useful background concepts, but the assessment centers on tools. |

The suggested output from this session is a short file:

```text
research/mcp_refresh_notes.md
```

---

## 5. BI Product Realism Areas

The assistant recommends using Tableau-like behavior as inspiration without copying a real API.

Important BI concepts to understand:

- Datasources
- Fields and semantic roles
- Workbooks
- Dashboards
- Views / worksheets / charts
- Filters
- Extract freshness
- Rendered images
- CSV/JSON export
- Cached view data
- Stale or unavailable data sources
- Invalid filters
- Export and render failures

The assistant notes that the mock should support realistic analyst workflows:

1. Find available datasources.
2. Inspect fields.
3. Browse workbooks and dashboards.
4. Open a view.
5. Apply filters.
6. Query underlying data.
7. Render charts as images.
8. Export data.

---

## 6. Recommended Domain Interpretation

The assistant proposes a practical domain model.

| Concept | Recommended Meaning |
|---|---|
| Datasource | A published semantic dataset backed by one or more SQLite tables. |
| Field | A typed column or calculated field with metadata, semantic role, and filterability. |
| Workbook | A curated analytical container. |
| Dashboard | A grouping of related views inside a workbook. |
| View | A single chart/worksheet with a saved query and visual configuration. |
| Filter | A saved default filter or a runtime override. |
| Render | A generated PNG/SVG artifact under a renders directory. |
| Export | A generated CSV/JSON artifact under an exports directory. |

### Important Assumption

For v1, **workbooks contain dashboards, dashboards group views, and views are individual charts or worksheets**.

This keeps the mock realistic while still implementable.

---

## 7. Initial Tool Surface

The assistant proposes a focused tool surface.

| Category | Tool | Purpose |
|---|---|---|
| Search | `mockbi.search_content` | Search across datasources, workbooks, dashboards, and views. |
| Datasource discovery | `mockbi.list_datasources` | Browse available datasources. |
| Datasource detail | `mockbi.get_datasource` | Inspect datasource metadata and fields. |
| Field discovery | `mockbi.list_field_values` | Discover distinct values/ranges for filters. |
| Workbook discovery | `mockbi.list_workbooks` | Browse/search workbooks. |
| Workbook detail | `mockbi.get_workbook` | Return workbook metadata and dashboards. |
| Dashboard detail | `mockbi.get_dashboard` | Return dashboard layout and contained views. |
| View detail | `mockbi.get_view` | Return chart config, fields, filters, and metadata. |
| View data | `mockbi.get_view_data` | Execute a saved view with optional filter overrides. |
| Datasource query | `mockbi.query_datasource` | Run structured analytical queries over a datasource. |
| Render | `mockbi.render_view_image` | Generate a PNG/SVG chart artifact. |
| View export | `mockbi.export_view_data` | Export view data to CSV/JSON. |
| Query export | `mockbi.export_datasource_query` | Export a structured query result to CSV/JSON. |

### Intentionally Excluded Tools

The assistant recommends excluding:

- Raw SQL execution
- General-purpose “analyze everything” tools
- Dedicated period comparison tools
- Dashboard editing tools
- Authentication/multi-tenant tools
- Long-running async job polling, unless required
- External integrations

Reason: the assessment is about a read-only mock BI system, not a full BI product.

---

## 8. Shared Query and Filter Semantics

The assistant recommends centralizing common semantics to avoid inconsistent tool contracts.

### Pagination

- Cursor-based pagination.
- Default page size: `25`.
- Maximum page size: `100`.
- Stable ordering required.
- Cursor should be opaque to the agent.

Example cursor contents before encoding:

```json
{
  "sort_key": "2026-04-22T10:00:00Z",
  "id": "view_sales_by_region"
}
```

### Runtime Filter Shape

```json
{
  "field_id": "fld_order_date",
  "operator": "between",
  "value": ["2026-01-01", "2026-04-01"],
  "mode": "narrow"
}
```

### Recommended Operators

| Data Type | Operators |
|---|---|
| string | `eq`, `neq`, `in`, `contains`, `is_null`, `is_not_null` |
| number | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`, `is_null`, `is_not_null` |
| date/time | `eq`, `before`, `after`, `between`, `is_null`, `is_not_null` |
| boolean | `eq`, `is_null`, `is_not_null` |

### Structured Query Shape

The assistant recommends structured queries rather than raw SQL:

```json
{
  "datasource_id": "ds_retail_sales",
  "select": ["fld_region", "fld_revenue"],
  "filters": [
    {
      "field_id": "fld_order_date",
      "operator": "between",
      "value": ["2026-01-01", "2026-04-01"]
    }
  ],
  "group_by": ["fld_region"],
  "aggregations": [
    {
      "field_id": "fld_revenue",
      "function": "sum",
      "as": "total_revenue"
    }
  ],
  "sort": [
    {
      "field": "total_revenue",
      "direction": "desc"
    }
  ],
  "limit": 10
}
```

Rationale:

- Safer than raw SQL.
- Easier to validate.
- Easier for agents to construct.
- Easier to map to SQLite.

---

## 9. Schema Design Direction

The assistant proposes a SQLite-backed schema with filesystem-backed artifacts.

### Core Tables

| Table | Purpose |
|---|---|
| `datasources` | Published datasource metadata. |
| `datasource_tables` | Logical/physical tables backing a datasource. |
| `fields` | Field metadata, data type, role, aggregation, and filterability. |
| `field_values_cache` | Cached distinct values/ranges for filter discovery. |
| `workbooks` | Workbook metadata. |
| `dashboards` | Dashboard/grouping metadata. |
| `dashboard_views` | Maps dashboards to views. |
| `views` | View/chart metadata. |
| `view_fields` | Maps fields to visual roles. |
| `view_filters` | Saved view filters. |
| `view_query_specs` | Saved structured query spec for a view. |
| `rendered_views` | Generated render artifact records. |
| `exports` | Export artifact records. |
| `mock_failures` | Deterministic failure scenarios. |

### ID Strategy

Use stable, opaque IDs with type prefixes:

```text
ds_retail_sales
fld_order_date
wb_executive_overview
dash_revenue_overview
view_sales_by_region
exp_20260501_001
rend_20260501_001
```

IDs should be stable in seed data and not expose physical database row IDs.

---

## 10. Workflow-to-Tool Mapping

The assistant maps the required workflows to tool sequences.

| Workflow | Example Tool Sequence |
|---|---|
| Explore datasources | `list_datasources` → `get_datasource` → `list_field_values` |
| View workbook contents | `list_workbooks` → `get_workbook` → `get_dashboard` → `get_view` |
| Apply filters to views | `get_view` → `list_field_values` → `get_view_data` |
| Query datasource | `get_datasource` → `query_datasource` |
| Compare time periods | `query_datasource` twice with different date filters, then compare results client-side. |
| Analyze view details | `get_view` → `get_view_data` |
| Generate view images | `get_view` → `render_view_image` |
| Export view data | `get_view` → `export_view_data` |

### Notable Design Decision

The assistant recommends **not** adding a dedicated `compare_periods` tool.

Instead, comparison should emerge from normal query/view tools. This keeps the tool surface general and avoids domain-specific overfitting.

---

## 11. Seed Data Strategy

The assistant recommends realistic but bounded seed data.

### Recommended Domains

- Retail sales
- Finance/budget
- Marketing funnel
- Support operations
- Inventory/logistics
- HR/headcount

### Seed Data Should Include

- Several datasources
- Multiple workbooks
- Multiple dashboards per workbook
- Multiple views per dashboard
- Date fields
- Numeric measures
- Categorical dimensions
- Missing values
- Zero values
- Outliers
- Date gaps
- Stale cache examples
- Temporarily unavailable datasource examples
- Expired export examples

### Filesystem Assets

```text
fixtures/
  renders/
  exports/
  thumbnails/
```

Generated artifacts should be represented in SQLite metadata and stored under predictable local paths.

---

## 12. Testing Strategy

The assistant recommends describing a test harness even if the final deliverable is only a document.

### Test Harness Structure

```text
mockbi-assessment/
  spec/
    mockbi_mcp_server_spec.md
  harness/
    schema.sql
    seed.py
    tools_simulator.py
    fs/
      renders/
      exports/
      thumbnails/
  tests/
    scenarios.yaml
    test_contract_shapes.py
    test_workflows.py
    test_pagination.py
    test_filters.py
    test_exports.py
    test_renders.py
    golden/
      explore_datasources.json
      filtered_view_data.json
      exported_csv_metadata.json
```

### Test Types

| Test Type | What It Validates |
|---|---|
| Contract tests | Tool input/output/error shapes match the spec. |
| Workflow tests | Required workflows can be completed end-to-end. |
| Pagination tests | Cursor handling, stable ordering, page-size limits. |
| Filter tests | Operators, invalid fields, incompatible types, null behavior. |
| Export tests | CSV/JSON artifact metadata and file path behavior. |
| Render tests | PNG/SVG artifact generation metadata. |
| Failure-mode tests | Stale cache, unavailable datasource, expired export, invalid cursor. |
| Seed validation tests | Seed data integrity and realistic relationships. |
| Agent simulation tests | Whether an agent can choose plausible tool sequences from user tasks. |

### Example Scenario

```yaml
- id: W3
  name: Apply filters to a view
  user_task: "Show regional sales for Q1 only."
  steps:
    - tool: mockbi.get_view
      input:
        view_id: view_sales_by_region
    - tool: mockbi.get_view_data
      input:
        view_id: view_sales_by_region
        filters:
          - field_id: fld_order_date
            operator: between
            value: ["2026-01-01", "2026-04-01"]
  assertions:
    - response includes applied_filters
    - response includes rows or series
    - valid empty result is not treated as an error
```

---

## 13. Session-Based AI Workflow

The assistant proposes breaking the work into structured AI sessions, each saving output to a Markdown file.

### Session List

| Session | Output |
|---|---|
| 1. MCP refresh | `research/mcp_refresh_notes.md` |
| 2. BI behavior research | `research/bi_behavior_notes.md` |
| 3. Assessment strategy | `planning/assessment_success_strategy.md` |
| 4. Domain model and assumptions | `design/domain_model_and_assumptions.md` |
| 5. Schema design | `design/schema_design.md` |
| 6. Query/filter/pagination semantics | `design/query_filter_pagination_semantics.md` |
| 7. Failure modes and trade-offs | `spec/open_questions_and_tradeoffs.md` |
| 8. Tool surface overview | `design/tool_surface_overview.md` |
| 9. Detailed tool contracts | `spec/tool_contracts_draft.md` |
| 10. Workflow mapping | `spec/workflow_mapping.md` |
| 11. Seed data strategy | `design/seed_data_strategy.md` |
| 12. Testing strategy | `spec/testing_strategy.md` |
| 13. Final spec assembly | `spec/mockbi_mcp_server_technical_spec.md` |
| 14. Final critique | `review/final_spec_review.md` |
| 15. Final polish | update final spec in place |

---

## 14. Dependency Map

The assistant explains that sessions should feed each other rather than run independently.

| Session | Strongly Depends On | Feeds Into |
|---|---|---|
| MCP refresh | Assessment file | Tool design, testing, final spec |
| BI behavior research | Assessment file | Domain model, schema, tool surface |
| Assessment strategy | MCP + BI notes | All later planning |
| Domain model | BI research + strategy | Schema, tools, trade-offs |
| Schema design | Domain model | Tool contracts, seed data, tests |
| Query/filter semantics | MCP + domain + schema | Tool contracts, workflows, tests |
| Failure modes/trade-offs | BI research + schema + semantics | Tool contracts, testing, final spec |
| Tool surface | MCP + domain + schema + semantics | Detailed contracts, workflows |
| Tool contracts | Tool surface + semantics | Workflows, tests, final spec |
| Workflow mapping | Tool contracts | Seed data, testing |
| Seed data | Schema + workflows | Testing |
| Testing | Tools + seed data + workflows | Final spec |
| Final assembly | All prior outputs | Review |
| Review | Final spec | Polish |
| Polish | Review findings | Final submission |

### Dependency Rule

Do not write detailed tool contracts before these four items are stable:

1. Domain model
2. Schema and ID strategy
3. Shared filter/query/pagination semantics
4. Failure/error model

---

## 15. Codex-Friendly Prompt Orchestration

The assistant later rewrites each session prompt for use in a coding agent environment.

Each prompt explicitly states:

- Which files to read.
- Which file to create.
- What sections to include.
- Which prior decisions are source-of-truth.
- What not to do yet.

Example pattern:

```text
Read these files first:
- assessment/mockbi_assessment.md
- research/mcp_refresh_notes.md
- design/domain_model_and_assumptions.md

Create this file:
- design/schema_design.md

Use the domain model as the source of truth.
Keep the schema implementable with SQLite and filesystem artifacts.
Do not write the final spec yet.
```

This turns the planning process into a reproducible design pipeline.

---

## 16. Final Polish Prompt

After a first review found around 25 issues, the assistant rewrites the final polish prompt as a phased issue-resolution process.

### Phase 1 — Triage Review Findings

Group findings into:

1. Must-fix before submission.
2. Should-fix if low risk.
3. Defer or document as known limitation.

### Phase 2 — Fix Structural Consistency

Prioritize:

- Missing required assessment sections
- Tool name consistency
- Schema/tool alignment
- ID formats
- Error shape
- Pagination
- Filters
- Sorting
- Filesystem paths
- Workflow mapping
- Seed data and testing alignment

### Phase 3 — Fix Detailed Tool Contracts

Each tool should include:

- Tool name
- Model-facing description
- When to use
- Inputs
- Output example
- Error modes
- Documentation notes
- Implementation notes
- Example call
- Example success response
- Example error response

### Phase 4 — Validate Workflow/Test/Seed Coherence

For workflows W1–W8, verify:

1. The workflow can be completed using documented tools.
2. Required IDs can be discovered through earlier calls.
3. Expected outputs are returned.
4. Error/recovery paths are realistic.

### Phase 5 — Preserve Scope Discipline

Prefer:

- Clarifying existing tools
- Adding missing fields
- Adding missing error modes
- Tightening semantics
- Documenting trade-offs

Avoid:

- New broad tools
- Auth/multitenancy
- Dashboard editing
- Real-time updates
- External integrations
- Full query language support

### Phase 6 — Final Readability Pass

Improve:

- Section ordering
- Terminology consistency
- Concision
- Rationale
- Implementation clarity
- Explicit trade-offs

---

## 17. Second-Round Final Review

After the final spec was cleaned up, the assistant performs another evaluator-style review.

### Overall Readiness

The assistant gives the spec a strong but not perfect readiness assessment:

> The document is structurally strong and reads like a buildable MCP contract rather than a brainstorm. A broad rewrite is not recommended. A targeted consistency pass is recommended.

Approximate readiness score:

```text
8.5 / 10
```

---

## 18. Highest-Impact Remaining Fixes

### 1. Clarify Filter Terminology

Problem:

The word `Filter` is overloaded across runtime filters, saved filters, and applied filters.

Recommended distinction:

```text
RuntimeFilter
  field_id
  operator
  value
  mode: narrow | replace

SavedFilterMetadata
  filter_id
  field_id
  operator
  value
  saved_mode: always | default
  is_locked
  source_scope: datasource | dashboard | view

AppliedFilter
  field_id
  field_name
  operator
  value
  source: datasource_default | dashboard_default | saved_view_filter | runtime_override
  saved_mode?: always | default
  runtime_mode?: narrow | replace
  locked
```

Why this matters:

- Filters are central to BI behavior.
- The assessment explicitly cares about filter semantics.
- Ambiguous filter terminology can confuse implementers and agents.

---

### 2. Clarify Limit Semantics

Problem:

The term `limit` is used for multiple meanings:

| Current Meaning | Better Name |
|---|---|
| Pagination page length | `page_size` |
| Inline returned rows | `inline_limit` |
| Logical top-N query result | `result_limit` or `top_n` |
| Export truncation | `max_rows` |

Recommended rule:

- `page_size` controls pagination.
- `inline_limit` controls inline MCP response length.
- `result_limit` or `top_n` controls logical query output before pagination.
- `max_rows` controls export truncation.

---

### 3. Address PNG/SVG Render Support

Problem:

The spec should clearly satisfy the requirement for rendered images.

Recommended position:

- SVG should be generated directly from chart primitives.
- PNG should be supported through a local rasterization path.
- No external rendering service should be required.
- If PNG is conditional in the test harness, document that clearly as a limitation.

---

### 4. Add Export Column/Header Rules

Problem:

Export tools return metadata but do not fully specify export column schemas.

Recommended fix:

Add a `columns[]` object to export responses.

```json
{
  "columns": [
    {
      "name": "region",
      "field_id": "fld_region",
      "label": "Region",
      "data_type": "string",
      "role": "dimension",
      "aggregation": null,
      "nullable": false
    }
  ]
}
```

Rules:

- CSV header row uses `column.name`.
- JSON row keys use `column.name`.
- Human-readable labels are available through `columns[].label`.
- Physical SQLite column names should not leak into exports.

---

### 5. Add Artifact Lifecycle Rules

Because artifact creation is synchronous, the assistant recommends not adding `get_export` or `get_render` polling tools.

Instead:

- Artifact metadata is returned by the creation call.
- Agents should use the returned file path immediately.
- `expires_at` is cleanup metadata for the harness.
- No status polling tool is required in v1.

---

## 19. Medium-Priority Review Findings

The assistant also flags several smaller improvements.

| Issue | Suggested Fix |
|---|---|
| Datasource-only tools should not report dashboard/view filter sources. | Restrict applied filter sources by tool context. |
| Datasource export-disabled errors are missing. | Add `DATASOURCE_EXPORT_DISABLED`. |
| `views.default_limit` and saved query limits are ambiguous. | Separate inline response limits from saved top-N/result limits. |
| Dashboard/view relationship validation could be stronger. | Validate dashboard and member views belong to same workbook. |
| Output schemas could be more exhaustive. | Reference shared artifact/result objects. |
| Empty filtered results need an example. | Add a zero-row successful response example. |
| Dotted tool names may not fit every MCP harness. | Add a namespace-format assumption. |

---

## 20. Recommended Final Cleanup Order

The assistant recommends this targeted order before submission:

1. Fix filter shape naming.
2. Fix limit naming and semantics.
3. Confirm PNG/SVG render support.
4. Add export column/header rules.
5. Patch datasource-only filter sources.
6. Add datasource export-disabled error.
7. Add artifact lifecycle paragraph.
8. Add a short evaluator reading guide.
9. Add zero-row success example.
10. Submit without a broad rewrite.

---

