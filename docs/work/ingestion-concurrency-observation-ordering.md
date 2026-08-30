# Ingestion Concurrency And Observation Ordering

## Snapshot

- Status: ready
- Priority: P0
- Plan: `docs/superpowers/plans/2026-08-30-ingestion-concurrency-observation-ordering-implementation-plan.md`
- Design: `docs/superpowers/specs/2026-08-30-whole-project-quality-and-complexity-remediation-design.md`

## Target Outcome

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

Pending implementation. Record deterministic lock evidence, stale-observation
RED/GREEN coverage, CJ response cases, and the milestone commit here.
