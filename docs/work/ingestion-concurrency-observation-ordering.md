# Ingestion Concurrency And Observation Ordering

## Snapshot

- Status: complete
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-30-ingestion-concurrency-observation-ordering-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`
- Last verified: 2026-08-30 against deterministic merchant-identity,
  enrichment, existing ingestion, and CJ client suites.

## Batch Outcome

Concurrent merchant first sightings converge without orphan rows, stale media
or category observations cannot overwrite newer evidence, and malformed CJ
success payloads return bounded tagged errors before enumeration or arithmetic.

## Completion Evidence

- Merchant identity resolution now acquires one transaction-scoped advisory
  lock derived from the exact source and merchant identifier before re-reading
  the identity or creating a merchant. The in-transaction entry point fails
  fast without an outer transaction.
- A deterministic PostgreSQL lock-graph test proves same-key first sightings
  queue and converge without an unreferenced stale merchant.
- Product-media conflict updates apply source artifact, role, position, alt
  text, observation time, and update time only for equal/newer evidence.
- Category candidate arrivals continue incrementing `observation_count`, while
  stale display spellings and timestamps can no longer replace current facts.
- CJ product and feed result sets now require list results, non-negative integer
  counts, and a positive integer limit before enumeration or cursor arithmetic.
  Malformed shapes return one bounded tagged error without embedding provider
  data.
- The complete focused outcome command passed 60 tests with zero failures on
  `MIX_TEST_PARTITION=quality_ingestion`.
- `mix typecheck`, `mix format --check-formatted`, and `git diff --check`
  passed.
