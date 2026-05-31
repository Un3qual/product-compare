# Backend GraphQL Input Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-relay-contract-hardening.md`
  - `docs/work/backend-graphql-global-id-decode-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-input-helper-implementation-plan.md`
- Objective:
  - Centralize GraphQL resolver input helpers for atom/string key lookup and required/optional Relay integer ID decoding.

## Verified Current State

- `ProductCompareWeb.GraphQL.GlobalId` owns integer global ID decoding.
- `ProductCompareWeb.GraphQL.Input` owns atom/string key lookup, list-value lookup, required and optional integer global ID decoding, integer ID list decoding, and required UUID-backed global ID decoding.
- Pricing and commerce attribution resolvers delegate common input lookup and integer global ID decoding to the shared helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found duplicated GraphQL resolver input normalization helpers after global ID decode centralization.
  - A shared input helper keeps resolver input handling consistent while preserving resolver-specific error messages and payload behavior.

## Verification Commands

- `mix test test/product_compare_web/graphql/input_test.exs`
- `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-input-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, GraphQL Input Helper

- Completed: 2026-05-30
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Input` for atom/string key lookup and required/optional integer global ID decoding.
  - Replaced pricing and commerce attribution resolver-local input lookup and integer global ID decode wrappers with calls to the shared helper.
  - Added focused helper coverage for lookup precedence, default fallback, expected-type decoding, wrong-type rejection, non-string rejection, and optional nil handling.
- Verification:
  - `mix test test/product_compare_web/graphql/input_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
