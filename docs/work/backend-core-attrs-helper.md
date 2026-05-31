# Backend Core Attrs Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-input-put-present-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-core-attrs-helper-implementation-plan.md`
- Objective:
  - Move reusable atom/string attr lookup and nil-skipping map insertion out of `ProductCompare.Accounts`.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input` owns similar helpers for GraphQL resolver input maps, but core domain code does not depend on the web layer.
- `ProductCompare.Attrs` now owns reusable atom/string attr lookup, non-map normalization, and nil-skipping map insertion for core domain contexts.
- `ProductCompare.Accounts` delegates API-token creation, rotation default merging, and status filtering attr handling through `ProductCompare.Attrs`.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch is complete:
  - Focused core attr helper and API-token coverage passes with API-token attr handling delegated to `ProductCompare.Attrs`.
  - Full frontend and backend verification passed after the helper extraction.
  - Per the latest coordinator instruction, this is the last improvement in the current review pass.

## Verification Commands

- `mix test test/product_compare/attrs_test.exs`
- `mix test test/product_compare/attrs_test.exs test/product_compare/accounts/api_token_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare/attrs.ex`, `lib/product_compare/accounts.ex`, `test/product_compare/attrs_test.exs`, `test/product_compare/accounts/api_token_test.exs`, this file, and `docs/plans/2026-05-30-backend-core-attrs-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

- Backend Core Attrs Helper:
  - Added `ProductCompare.Attrs.fetch/3`, `ensure_map/1`, and `put_present/3`.
  - Replaced Accounts-local API-token attr helpers with the shared core helper.
  - Verified `mix test test/product_compare/attrs_test.exs`, `mix test test/product_compare/attrs_test.exs test/product_compare/accounts/api_token_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.
