# Backend GraphQL Global ID Encode Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-relay-contract-hardening.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-global-id-encode-helper-implementation-plan.md`
- Objective:
  - Let `ProductCompareWeb.GraphQL.GlobalId` encode integer local IDs directly so schema, resolver, and test callers stop repeating caller-side string conversion.

## Verified Current State

- `ProductCompareWeb.GraphQL.GlobalId.encode/2` now accepts integer local IDs and delegates to the existing binary ID encoding path.
- GraphQL schema ID field helpers pass integer IDs directly to `GlobalId.encode/2`.
- Commerce attribution filter ID echoing and ConnCase `relay_id/2` no longer perform caller-side integer string conversion.
- Request-level GraphQL commerce revenue summary tests use the shared ConnCase `relay_id/2` helper for global ID values.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active backend queue has no unblocked implementation batch.
  - Review found encode-side caller conversion duplication after the decode helper cleanup.
  - The integer-friendly encode cleanup is complete and no broader GraphQL ID refactor is queued from this pass.

## Verification Commands

- `mix test test/product_compare_web/graphql/global_id_test.exs`
- `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/conn_case_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `mix format --check-formatted`
- `mix test`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `cd assets && bun run check`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/graphql/**`, `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/**`, `test/support/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-global-id-encode-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Integer-Friendly Global ID Encoding

- Completed: 2026-05-30
- Outcome:
  - Added focused `GlobalId.encode/2` coverage for integer local IDs.
  - Added integer local-ID support to `GlobalId.encode/2`.
  - Removed caller-side global ID integer string conversions from schema, commerce attribution, ConnCase, and the commerce revenue summary tests.
- Verification:
  - `mix test test/product_compare_web/graphql/global_id_test.exs`
  - `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/conn_case_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/node_query_test.exs`
  - `mix format --check-formatted`
  - `mix test`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `cd assets && bun run check`
  - `git diff --check`
