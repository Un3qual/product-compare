# Backend GraphQL Node ID Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-relay-contract-hardening.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-node-id-helper-implementation-plan.md`
- Objective:
  - Centralize root-node Relay ID local-value decoding in `ProductCompareWeb.GraphQL.GlobalId`.

## Verified Current State

- `ProductCompareWeb.GraphQL.GlobalId` owns global ID encoding plus integer and UUID local-value parsing.
- `ProductCompareWeb.GraphQL.GlobalId.decode_typed_local_id/3` now dispatches between integer-backed and UUID-backed allowed type groups while preserving `:invalid_id` and `:unsupported_type` outcomes.
- `ProductCompareWeb.Resolvers.NodeResolver` now delegates root-node ID parsing to `GlobalId`, keeping the resolver focused on authorization and record lookup.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found root-node local ID kind dispatch still living in `NodeResolver` after the GraphQL global ID helpers were centralized.

## Verification Commands

- `mix test test/product_compare_web/graphql/global_id_test.exs`
- `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/graphql/global_id.ex`, `lib/product_compare_web/resolvers/node_resolver.ex`, `test/product_compare_web/graphql/global_id_test.exs`, `test/product_compare_web/graphql/node_query_test.exs`, this file, and `docs/plans/2026-05-30-backend-graphql-node-id-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Root Node ID Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused `GlobalId.decode_typed_local_id/3` coverage for integer-backed, UUID-backed, unsupported-type, and malformed-ID outcomes.
  - Added `GlobalId.decode_typed_local_id/3` for root-node local ID kind dispatch.
  - Replaced `NodeResolver.decode_node_id/1` resolver-local dispatch with the shared helper.
- Verification:
  - `mix test test/product_compare_web/graphql/global_id_test.exs`
  - `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
