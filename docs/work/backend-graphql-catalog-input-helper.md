# Backend GraphQL Catalog Input Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-input-helper.md`
  - `docs/work/graphql-relay-contract-hardening.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-catalog-input-helper-implementation-plan.md`
- Objective:
  - Extend shared GraphQL input helper coverage to Catalog resolver list and UUID input normalization.

## Verified Current State

- Pricing and commerce attribution resolvers already delegate common input helper behavior to `ProductCompareWeb.GraphQL.Input`.
- `ProductCompareWeb.GraphQL.Input` owns atom/string key lookup, list-value lookup, required and optional integer global ID decoding, integer ID list decoding, and required UUID-backed global ID decoding.
- `ProductCompareWeb.Resolvers.CatalogResolver` delegates catalog query filter and saved-comparison mutation input normalization to the shared GraphQL input helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found remaining GraphQL input helper duplication in Catalog resolver after the first input-helper cleanup.
  - Moving list and UUID ID decoding into the shared helper keeps catalog filters and saved-comparison mutation inputs aligned with the rest of the GraphQL layer.

## Verification Commands

- `mix test test/product_compare_web/graphql/input_test.exs`
- `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-catalog-input-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Catalog GraphQL Input Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Extended `ProductCompareWeb.GraphQL.Input` with list-value lookup, integer ID list decoding, and required UUID-backed global ID decoding.
  - Replaced Catalog resolver-local input lookup, list lookup, integer ID list, required/optional integer ID, and UUID ID helper duplication with shared helper calls.
  - Added focused helper coverage for list fallback semantics, ordered ID-list decoding, non-list custom errors, and UUID-backed ID decoding.
- Verification:
  - `mix test test/product_compare_web/graphql/input_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
