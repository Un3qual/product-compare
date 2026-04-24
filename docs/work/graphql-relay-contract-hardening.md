# GraphQL Relay Contract Hardening Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-04-13 after full lane verification and typecheck
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- Definition of done:
  - The GraphQL schema exposes a root `node(id: ID!)` lookup for the supported global-ID-backed catalog, pricing, and owner-scoped entities in this slice.
  - Invalid or unsupported node IDs fail deterministically.
  - Owner-scoped nodes do not leak records across users.
  - Focused GraphQL coverage exists for supported node lookups and auth/null behavior.
  - The backend lane lands without touching `assets/**` or reopening the active frontend work doc.

## Verified Current State

- `lib/product_compare_web/schema.ex` now exposes a root `node(id: ID!)` field backed by a `:node_result` union for public `Product`, `Brand`, `Merchant`, and `MerchantProduct` nodes plus owner-scoped `SavedComparisonSet` and `ApiToken` nodes.
- `lib/product_compare_web/resolvers/node_resolver.ex` now dispatches between public integer-backed IDs and owner-scoped entropy IDs, returning `nil` for anonymous or cross-user lookups of private nodes while still rejecting malformed or unsupported IDs deterministically.
- `lib/product_compare/catalog.ex` now exposes `get_saved_comparison_set_for_user/2` with the existing ownership boundary and `items: [:product]` preload expected by the saved-comparisons GraphQL surface.
- `lib/product_compare/accounts.ex` now exposes `get_api_token_for_user/2` for ownership-checked node lookups without changing the existing token lifecycle flows.
- `test/product_compare_web/graphql/node_query_test.exs` now covers owner success plus anonymous/cross-user null behavior for `SavedComparisonSet` and `ApiToken`, and the focused owner-scoped GraphQL regression set passes.
- `docs/work/frontend-relay-route-data.md` remains active in the frontend lane, and this backend slice still lands without touching `assets/**`.

## Next Batch

- Status: none queued
- Batch: none
- Why this batch:
  - Task 3's full backend verification passed, so the planned Relay-contract hardening scope for this lane is complete.
  - No next backend Relay-contract batch is queued in this work doc; any broader node-surface expansion is a future prioritization decision.
  - The active queue can keep frontend Relay route-data adoption as the remaining current lane work without inventing a backend follow-on batch here.

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare/**`, `lib/product_compare_web/**`, `test/product_compare_web/graphql/**`, this file, and `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`
- Stop and record a blocker here if this batch requires `assets/**`, frontend route files, or another lane's owned paths.

## Planned Follow-Up

- Decide separately whether a future backend slice should extend generic node support to the remaining auth/affiliate entities or leave the current allowlist as the intentionally supported set.
- No immediate backend follow-up is required for the current frontend Relay migration.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/graphql-relay-contract-hardening.md`
- `sed -n '1,260p' docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
- `sed -n '1,240p' lib/product_compare_web/schema.ex`
- `sed -n '1,220p' lib/product_compare_web/graphql/global_id.ex`
- `rg -n 'field :node|node\\(|GlobalId.decode' lib/product_compare_web lib/product_compare test/product_compare_web/graphql`
- `mix test test/product_compare_web/graphql/node_query_test.exs`
- `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/node_query_test.exs`
- `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/api_token_auth_test.exs && mix typecheck`
