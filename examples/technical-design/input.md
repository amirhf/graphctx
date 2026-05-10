# Placeholder Technical Design Conversation

This is a synthetic placeholder. Replace it with a real technical design conversation before evaluating Phase 1 quality.

## Notes

The team is designing a background job system for a SaaS product. The system needs to process user uploads, extract metadata, call an LLM for classification, and write results back to Postgres.

The current decision is to start with a simple queue backed by Redis because the team already uses Redis and wants fast local development. A durable workflow engine may be added later if retries, observability, and long-running orchestration become painful.

Assumptions:

- Upload volume will be low during beta.
- Jobs can be retried safely if processing is idempotent.
- The LLM classification step is the slowest and most failure-prone dependency.

Risks:

- Duplicate processing could create inconsistent metadata.
- Provider rate limits could slow down the queue.
- Poor retry logic could hide repeated failures.

Open questions:

- Should job payloads contain full data or references to stored records?
- How much retry state should be visible to admins?
- Do failed jobs need a manual replay button?

Tasks:

- Define the job payload schema.
- Add idempotency keys.
- Implement retry and dead-letter behavior.
- Add logs and metrics around processing latency.
