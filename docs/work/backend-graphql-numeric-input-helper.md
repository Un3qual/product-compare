# Backend GraphQL Numeric Input Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-input-helper.md`
  - `docs/work/backend-graphql-catalog-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-numeric-input-helper-implementation-plan.md`
- Objective:
  - Centralize GraphQL numeric filter value normalization in `ProductCompareWeb.GraphQL.Input`.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input` owns shared atom/string lookup, list defaults, Relay ID decoding, and connection argument extraction.
- `ProductCompareWeb.GraphQL.Input.normalize_decimal_value/1` now owns GraphQL numeric filter value parsing.
- `ProductCompareWeb.Resolvers.CatalogResolver` now delegates numeric attribute filter `min`/`max` parsing to the shared input helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found private GraphQL numeric-value parsing still in Catalog resolver after the broader input-helper cleanup.

## Verification Commands

- `mix test test/product_compare_web/graphql/input_test.exs`
- `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/graphql/input.ex`, `lib/product_compare_web/resolvers/catalog_resolver.ex`, `test/product_compare_web/graphql/input_test.exs`, `test/product_compare_web/graphql/catalog_queries_test.exs`, this file, and `docs/plans/2026-05-30-backend-graphql-numeric-input-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Numeric Input Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused `Input.normalize_decimal_value/1` coverage for nil, Decimal, integer, float, string, and invalid values.
  - Added `Input.normalize_decimal_value/1` with the existing Catalog numeric filter parsing behavior.
  - Replaced Catalog resolver-local decimal parsing with the shared input helper.
- Verification:
  - `mix test test/product_compare_web/graphql/input_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
