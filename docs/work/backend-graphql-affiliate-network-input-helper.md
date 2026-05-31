# Backend GraphQL Affiliate Network Input Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-affiliate-input-helper.md`
  - `docs/work/backend-graphql-affiliate-at-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-affiliate-network-input-helper-implementation-plan.md`
- Objective:
  - Route affiliate-network mutation attribute extraction through shared GraphQL input semantics.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input` owns atom/string GraphQL input lookup and optional attribute extraction.
- `AffiliateResolver.upsert_affiliate_network/3` still uses resolver-local `Map.take(input, [:name, :homepage_url])`.
- The GraphQL schema only exposes `name` for `UpsertAffiliateNetworkInput`; `homepage_url` is not part of the current network schema or GraphQL contract.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found one remaining Affiliate resolver-local attribute extraction path immediately adjacent to the completed GraphQL input helper batches.

## Verification Commands

- `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/resolvers/affiliate_resolver.ex`, `test/product_compare_web/graphql/affiliate_workflows_test.exs`, this file, and `docs/plans/2026-05-30-backend-graphql-affiliate-network-input-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Affiliate Network Mutation Input Helper

- Completed: 2026-05-30
- Outcome:
  - Added resolver-level coverage for string-key affiliate-network `name` input.
  - Replaced `Map.take(input, [:name, :homepage_url])` with `Input.take_present(input, [:name])`.
  - Removed stale unsupported `homepage_url` selection from the resolver path.
- Verification:
  - `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
