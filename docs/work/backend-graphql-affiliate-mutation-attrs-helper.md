# Backend GraphQL Affiliate Mutation Attrs Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-affiliate-input-helper.md`
  - `docs/work/backend-graphql-affiliate-network-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-affiliate-mutation-attrs-helper-implementation-plan.md`
- Objective:
  - Normalize Affiliate mutation attrs through shared GraphQL input semantics after Relay ID decoding.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input` owns atom/string GraphQL input lookup and optional attribute extraction.
- `AffiliateResolver.normalize_ids/2` decodes optional Relay ID fields and normalizes those ID fields to atom keys.
- `upsertAffiliateProgram`, `upsertAffiliateLink`, and `createCoupon` pass the full post-ID map into Ecto changesets, which can leave non-ID attrs as string keys in direct resolver calls and makes the attr shape harder to reason about.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found one remaining Affiliate resolver attr-normalization path adjacent to the completed GraphQL input helper batches.

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
- Owned paths: `lib/product_compare_web/resolvers/affiliate_resolver.ex`, `test/product_compare_web/graphql/affiliate_workflows_test.exs`, this file, and `docs/plans/2026-05-30-backend-graphql-affiliate-mutation-attrs-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Affiliate Mutation Attrs Helper

- Completed: 2026-05-30
- Outcome:
  - Added resolver-level coverage for string-key `upsertAffiliateProgram` attrs after Relay ID normalization.
  - Added resolver-local attr projection after ID decoding and before Ecto changeset calls.
  - Routed program, link, and coupon mutation attrs through the normalized attr projection helper.
- Verification:
  - `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
