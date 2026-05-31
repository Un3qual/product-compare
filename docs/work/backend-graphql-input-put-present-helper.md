# Backend GraphQL Input Put-Present Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-input-helper.md`
  - `docs/work/backend-graphql-numeric-input-helper.md`
  - `docs/work/backend-graphql-boolean-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-input-put-present-helper-implementation-plan.md`
- Objective:
  - Centralize nil-skipping GraphQL input map insertion in `ProductCompareWeb.GraphQL.Input`.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input` owns shared atom/string lookup, list defaults, optional attr projection, nil-skipping map insertion, Relay ID decoding, connection argument extraction, and primitive value normalization.
- `ProductCompareWeb.GraphQL.Input.put_present/3` now owns nil-skipping GraphQL input map insertion.
- `ProductCompareWeb.Resolvers.CatalogResolver` now delegates optional normalized filter insertion for `primary_type_taxon_id` and numeric filter `min`/`max` to the shared input helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found nil-skipping GraphQL input map insertion still local to Catalog resolver after adjacent input normalization moved into `ProductCompareWeb.GraphQL.Input`.

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
- Owned paths: `lib/product_compare_web/graphql/input.ex`, `lib/product_compare_web/resolvers/catalog_resolver.ex`, `test/product_compare_web/graphql/input_test.exs`, `test/product_compare_web/graphql/catalog_queries_test.exs`, this file, and `docs/plans/2026-05-30-backend-graphql-input-put-present-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Input Put-Present Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused `Input.put_present/3` coverage for non-nil insertion and nil skipping.
  - Added `Input.put_present/3` with the existing Catalog resolver-local `maybe_put/3` behavior.
  - Replaced Catalog resolver-local optional normalized filter insertion with the shared input helper.
- Verification:
  - `mix test test/product_compare_web/graphql/input_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/catalog_queries_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
