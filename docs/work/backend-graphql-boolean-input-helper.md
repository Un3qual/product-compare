# Backend GraphQL Boolean Input Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-input-helper.md`
  - `docs/work/backend-graphql-numeric-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-boolean-input-helper-implementation-plan.md`
- Objective:
  - Centralize GraphQL boolean value normalization in `ProductCompareWeb.GraphQL.Input`.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input` owns shared atom/string lookup, list defaults, numeric value parsing, Relay ID decoding, and connection argument extraction.
- `ProductCompareWeb.GraphQL.Input.normalize_boolean_value/1` now owns GraphQL boolean value normalization.
- `ProductCompareWeb.Resolvers.CatalogResolver` now delegates `include_type_descendants` normalization to the shared input helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found private GraphQL boolean-value normalization still in Catalog resolver after numeric value parsing moved into `ProductCompareWeb.GraphQL.Input`.

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
- Owned paths: `lib/product_compare_web/graphql/input.ex`, `lib/product_compare_web/resolvers/catalog_resolver.ex`, `test/product_compare_web/graphql/input_test.exs`, `test/product_compare_web/graphql/catalog_queries_test.exs`, this file, and `docs/plans/2026-05-30-backend-graphql-boolean-input-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Boolean Input Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused `Input.normalize_boolean_value/1` coverage for `true`, `false`, and non-boolean fallback behavior.
  - Added `Input.normalize_boolean_value/1` with the existing Catalog filter boolean normalization behavior.
  - Replaced Catalog resolver-local boolean normalization with the shared input helper.
- Verification:
  - `mix test test/product_compare_web/graphql/input_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
