# Backend GraphQL Global ID Decode Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-relay-contract-hardening.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-global-id-decode-helper-implementation-plan.md`
- Objective:
  - Centralize GraphQL global ID integer and UUID decoding so resolvers stop duplicating type checks, integer parsing, UUID casting, and database ID bounds.

## Verified Current State

- `ProductCompareWeb.GraphQL.GlobalId` now exposes `decode_integer/2` and `decode_uuid/2` in addition to raw `decode/1`.
- `decode_integer/2` validates the expected GraphQL type, positive integer local IDs, and the PostgreSQL bigint upper bound.
- `decode_uuid/2` validates the expected GraphQL type and casts UUID local IDs through `Ecto.UUID`.
- Auth, catalog, pricing, affiliate, commerce attribution, and node resolvers now delegate global-ID local parsing to the shared helpers while preserving their own error payload formats.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active backend queue has no unblocked implementation batch.
  - Review found repeated resolver-local GraphQL global-ID parsing after the test helper cleanup.
  - The shared decode helper cleanup is complete and no broader resolver refactor is queued from this pass.

## Verification Commands

- `mix test test/product_compare_web/graphql/global_id_test.exs`
- `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `mix format --check-formatted`
- `mix test`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `cd assets && bun run check`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/graphql/**`, `lib/product_compare_web/resolvers/**`, `test/product_compare_web/graphql/**`, this file, and `docs/plans/2026-05-30-backend-graphql-global-id-decode-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Shared Global ID Decode Helpers

- Completed: 2026-05-30
- Outcome:
  - Added focused `GlobalId` tests for integer-backed and UUID-backed GraphQL IDs, including wrong-type and invalid-local-ID cases.
  - Added `GlobalId.decode_integer/2` and `GlobalId.decode_uuid/2`.
  - Replaced resolver-local integer and UUID global-ID parsing across auth, catalog, pricing, affiliate, commerce attribution, and node resolvers.
- Verification:
  - `mix test test/product_compare_web/graphql/global_id_test.exs`
  - `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs`
  - `mix format --check-formatted`
  - `mix test`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `cd assets && bun run check`
  - `git diff --check`
