# GraphQL Relay Contract Hardening Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after GraphQL global ID encode helper cleanup
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- Definition of done:
  - The GraphQL schema exposes a root `node(id: ID!)` lookup for the supported global-ID-backed catalog, pricing, owner-scoped, and authenticated affiliate entities in this slice.
  - Invalid or unsupported node IDs fail deterministically.
  - Owner-scoped nodes do not leak records across users.
  - Focused GraphQL coverage exists for supported node lookups and auth/null behavior.
  - The backend lane lands without touching `assets/**` or reopening the active frontend work doc.

## Verified Current State

- `lib/product_compare_web/schema.ex` now exposes a root `node(id: ID!)` field backed by the `:node` interface for public `Product`, `Brand`, `Merchant`, `MerchantProduct`, and `PricePoint` nodes plus owner-scoped `SavedComparisonSet` and `ApiToken` nodes.
- `lib/product_compare_web/graphql/global_id.ex` now centralizes integer local-ID encoding plus integer and UUID local-ID parsing through `encode/2`, `decode_integer/2`, and `decode_uuid/2`.
- `lib/product_compare_web/resolvers/node_resolver.ex` now dispatches between public integer-backed IDs and owner-scoped entropy IDs, returning `nil` for anonymous or cross-user lookups of private nodes while still rejecting malformed or unsupported IDs deterministically.
- Authenticated affiliate node lookup now supports `AffiliateNetwork`, `AffiliateProgram`, `AffiliateLink`, and `Coupon` records that already expose Relay global IDs, while anonymous lookups return `nil` without leaking whether the record exists.
- `lib/product_compare/pricing.ex` now exposes `get_price_point/1` so root node lookup can resolve price point IDs that are already emitted by `latestPrice` and `priceHistory`.
- `lib/product_compare/affiliate.ex` now exposes small read helpers for those affiliate node lookups without changing existing write or active-coupon flows.
- `lib/product_compare/catalog.ex` now exposes `get_saved_comparison_set_for_user/2` with the existing ownership boundary and `items: [:product]` preload expected by the saved-comparisons GraphQL surface.
- `lib/product_compare/accounts.ex` now exposes `get_api_token_for_user/2` for ownership-checked node lookups without changing the existing token lifecycle flows.
- `test/product_compare_web/graphql/node_query_test.exs` now covers public `PricePoint` node lookup, owner success plus anonymous/cross-user null behavior for `SavedComparisonSet` and `ApiToken`, authenticated affiliate node success, anonymous affiliate null behavior, and the focused GraphQL regression set passes.
- Request-level GraphQL tests now use the ConnCase `relay_id/2` helper, so test global ID construction goes through `ProductCompareWeb.GraphQL.GlobalId` instead of duplicated local Base64 helpers.
- Resolver input normalization now delegates integer and UUID global-ID parsing to `ProductCompareWeb.GraphQL.GlobalId` while preserving resolver-specific error payload shapes.
- GraphQL schema, commerce attribution, and ConnCase callers now pass integer local IDs directly to `GlobalId.encode/2` instead of performing caller-side string conversion.
- `docs/work/frontend-relay-route-data.md` remains active in the frontend lane, and this backend slice still lands without touching `assets/**`.

## 2026-07-31 Reconciliation

- The Relay-native schema now exposes 22 supported Node object types, including
  `SourceArtifact`, community UUID nodes, CJ programs, alerts, comparison
  snapshots, specification corrections, and the earlier catalog, pricing,
  owner, and affiliate types.
- `NodeResolver` consumes Relay's already-decoded local ID directly and keeps
  integer/UUID validation, visibility, operator/owner/self scopes, missing-node
  behavior, and request batching for authorized nodes.
- The checked-in SDL has 17 macro-owned forward connections. Connection cursor,
  query, list, and slice mechanics delegate to `Absinthe.Relay.Connection`.

## Next Batch

- Status: none queued
- Batch: none
- Why this batch:
  - The authenticated affiliate node follow-up and public `PricePoint` node follow-up from `docs/plans/INDEX.md` are complete.
  - No next backend Relay-contract batch is queued in this work doc; any broader node-surface expansion is a future prioritization decision.
  - Product data ingestion remains the only listed active lane and is blocked pending live-provider evidence.

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare/**`, `lib/product_compare_web/**`, `test/support/**`, `test/product_compare_web/graphql/**`, this file, and `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`
- Stop and record a blocker here if this batch requires `assets/**`, frontend route files, or another lane's owned paths.

## Planned Follow-Up

- No node-surface follow-up remains from this historical slice. Current work is
  dispatched only through `docs/work/index.md`.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/graphql-relay-contract-hardening.md`
- `sed -n '1,260p' docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- `sed -n '1,240p' lib/product_compare_web/schema.ex`
- `sed -n '1,220p' lib/product_compare_web/graphql/global_id.ex`
- `rg -n 'field :node|node\\(|GlobalId.decode' lib/product_compare_web lib/product_compare test/product_compare_web/graphql`
- `mix test test/product_compare_web/graphql/node_query_test.exs`
- `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs`
- `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/api_token_auth_test.exs && mix typecheck`
