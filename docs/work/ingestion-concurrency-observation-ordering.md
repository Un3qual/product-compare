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

## Owned Paths

- `lib/product_compare/ingestion/merchant_identities.ex`
- `lib/product_compare/catalog/evidence.ex`
- `lib/product_compare/ingestion/listing_persistence/enrichment.ex`
- `lib/product_compare/ingestion/sources/cj/client.ex`
- `test/product_compare/ingestion/merchant_identities_concurrency_test.exs`
- `test/product_compare/ingestion/ingestion_test.exs`
- `test/product_compare/ingestion/enrichment_test.exs`
- `test/product_compare/ingestion/enrichment_concurrency_test.exs`
- `test/product_compare/ingestion/sources/cj/client_test.exs`
- `test/support/database_test_helpers.ex` only for deterministic barriers
- This lane document

## Internal Slices

1. Logical-key advisory lock and first-sighting convergence.
2. Timestamp-aware product media and category conflict updates.
3. Bounded CJ result-set and pagination validation.

## Blocker Rule

Stop if current merchant uniqueness does not identify one safe logical lock
key, if evidence counter semantics require a product decision, or if provider
compatibility requires accepting a malformed pagination shape not represented
by current fixtures or documentation.

## Completion Evidence

- Merchant identity resolution now acquires one transaction-scoped advisory
  lock derived from the exact source and merchant identifier before re-reading
  the identity or creating a merchant. The in-transaction entry point fails
  fast without an outer transaction.
- Deterministic PostgreSQL lock-graph tests prove same-key first sightings
  queue and converge without an unreferenced stale merchant, while a different
  logical key completes independently without timing sleeps.
- Product-media conflict updates apply source artifact, role, position, alt
  text, observation time, and update time only for equal/newer evidence.
- Category candidate arrivals continue incrementing `observation_count`, while
  stale display spellings and timestamps can no longer replace current facts.
- CJ product and feed result sets now require list results, non-negative integer
  counts, and a positive integer limit before enumeration or cursor arithmetic.
  Missing, null, string, fractional, and negative shapes return bounded tagged
  categories without embedding provider data.
- The complete focused outcome command passed 60 tests with zero failures on
  `MIX_TEST_PARTITION=quality_ingestion`.
- `mix typecheck`, `mix format --check-formatted`, and `git diff --check`
  passed.

## Remaining Work

None in this lane. Operator command safety and diagnostics is the next active
row.
