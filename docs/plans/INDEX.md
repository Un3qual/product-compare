# Plan Index

Start at `docs/work/index.md` for the active execution state. Use this file only when no current batch is queued or the active work doc instructs you to create the next plan.

## Active Architecture Source

- `ARCHITECTURE.md`
- `docs/plans/2026-03-05-frontend-fullstack-design.md`
- `docs/plans/2026-03-16-graphql-auth-migration-design.md`
- `docs/plans/2026-03-19-frontend-relay-route-data-design.md`

## Active Queue

1. Product data ingestion lane: `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`
   - Status: blocked
   - Source context: `docs/plans/2026-03-23-product-data-sourcing-and-scraping-plan.md`
   - Completed: CJ fixture-backed source selection, ingestion execution ADR, source-agnostic ingestion boundary, merchant source identity persistence, and fixture-backed normalized listing persistence into catalog/pricing/spec targets.
   - Next scope: no unblocked local ingestion batch remains before live provider validation.
   - Deferred: live CJ credential validation, quota behavior, account-scoped sample payloads, source onboarding compliance signoff, and any Tier-3 scraping activation.

## Next Candidate After Active Queue

1. Additional demo-parity frontend candidates
   - Depends on a new product/backend priority decision.
   - Intended scope: choose the next frontend demo-parity target after the completed product-detail price history lane.

## Recently Completed

- Frontend auth state hardening lane: `docs/plans/2026-06-01-frontend-auth-state-hardening-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-auth-migration.md`, and the completed frontend logout route baseline lane.
  - Scope: root `viewer` route preload, guest/authenticated auth links in the root shell, success-gated Relay root `viewer` updates after login/register/logout mutations, browser logout e2e coverage, backend session-auth contract hardening, and final auth-state verification.
  - Result: browser auth state now follows the GraphQL `viewer` session state without adding REST auth endpoints or token-bearing browser auth.
  - Verification passed with `cd assets && bun run relay`, focused root/router/auth Vitest suites, `cd assets && bun x playwright test tests/e2e/auth.spec.ts`, `mix test test/product_compare_web/graphql/session_auth_test.exs`, `cd assets && bun run typecheck`, `cd assets && bun run check`, and `git diff --check`.

- Frontend logout route baseline lane: `docs/plans/2026-06-01-frontend-logout-route-baseline-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`, `docs/work/graphql-auth-migration.md`, and the existing GraphQL `logout` mutation contract.
  - Scope: Relay-backed `/auth/logout` route, logout mutation artifact, route registration, navigation link, and auth-slice verification.
  - Result: browser logout is now reachable from the frontend and clears the Phoenix session through GraphQL without adding REST endpoints.
  - Verification passed with `cd assets && bun run relay`, focused auth/root/router Vitest suites, `cd assets && bun run typecheck`, `mix test test/product_compare_web/graphql/session_auth_test.exs`, `cd assets && bun run check`, and `git diff --check`.

- Backend source artifact node lookup lane: `docs/plans/2026-06-01-backend-source-artifact-node-lookup-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`, `docs/work/backend-source-artifact-public-contract.md`, and GraphQL node contract tests.
  - Scope: generic `node(id:)` support for the safe `SourceArtifact` GraphQL object, positive source-artifact node coverage, non-existent node behavior, and final backend verification.
  - Result: source artifacts are addressable through generic `node(id:)` without exposing `contentHash`, `rawJson`, or `rawText`.
  - Verification passed with focused source-artifact/node/source-artifact changeset tests, `mix test test/product_compare_web/graphql`, `mix typecheck`, and `git diff --check`.

- Frontend product-detail price history demo parity lane: `docs/plans/2026-06-01-frontend-product-detail-price-history-demo-parity-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md` and `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - Scope: Relay-backed product-detail offers query refresh for `MerchantProduct.priceHistory`, active-offer price-history rendering, coupon free-shipping and valid-through display, and final demo-slice verification.
  - Result: `/products/:slug` now renders bounded price-history rows, empty history state, and has-more state inside Active offers.
  - Verification passed with `cd assets && bun run relay`, product-detail route Vitest, `cd assets && bun run typecheck`, `mix test test/product_compare_web/graphql/pricing_queries_test.exs`, `cd assets && bun run check`, and `git diff --check`.

- Backend source artifact public contract lane: `docs/plans/2026-06-01-backend-source-artifact-public-contract-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`, `ProductCompareSchemas.Specs.SourceArtifact`, and GraphQL node contract tests.
  - Scope: safe `sourceArtifact(id:)` GraphQL object/query contract, raw-payload field exclusion, and final backend verification while keeping generic node lookup out of scope.
  - Result: source artifacts have a public-safe GraphQL contract; `SourceArtifact` generic `node(id:)` support is complete in the follow-up node lookup lane.
  - Verification passed with focused source-artifact/node/source-artifact changeset tests, `mix test test/product_compare_web/graphql`, `mix typecheck`, and `git diff --check`.

- Frontend product-detail coupon demo parity lane: `docs/plans/2026-06-01-frontend-product-detail-coupon-demo-parity-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md` and `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - Scope: public display-scoped product-offer coupon GraphQL, product detail Relay query refresh, active coupon rendering under Active offers, and final demo-slice verification.
  - Result: `/products/:slug` now renders active coupon code, description, amount/percent discount details, terms, and no-coupon rows through the product offers query without exposing authenticated affiliate-management fields.
  - Verification passed with `mix test test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `cd assets && bun run typecheck`, `cd assets && bun run check`, and `git diff --check`.

- Frontend affiliate setup demo parity lane: `docs/plans/2026-06-01-frontend-affiliate-setup-demo-parity-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`
  - Scope: Relay-backed `/affiliate/setup` route loading, merchant choice rendering, authenticated affiliate network/program/link/coupon mutation forms, typed payload errors, navigation links, and final backend contract verification.
  - Result: the existing authenticated affiliate setup GraphQL mutations are demoable from the browser UI without adding REST endpoints or role/admin semantics beyond the current session-auth contract.
  - Verification passed with `cd assets && bun run relay`, focused affiliate/root/router Vitest suites, `cd assets && bun run typecheck`, `mix test test/product_compare_web/graphql/affiliate_workflows_test.exs`, `cd assets && bun run check`, and `git diff --check`.

- Frontend merchant discovery demo parity lane: `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`
  - Scope: Relay-backed `/merchants` route loading, merchant list rendering, cursor next-page navigation, empty/error states, navigation links, and final verification.
  - Result: the existing public `merchants(first:, after:)` GraphQL contract is demoable from the browser UI without adding REST endpoints.
  - Verification passed with `cd assets && bun run relay`, focused merchant/root/router Vitest suites, `cd assets && bun run typecheck`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run check`, and `git diff --check`.

- Frontend revenue reporting demo parity lane: `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`
  - Scope: Relay-backed `/commerce/revenue` route loading, aggregate filter controls, suppressed and unsuppressed metric rendering, navigation links, and final verification.
  - Result: the existing public-safe `revenueSummary(input:)` GraphQL contract is demoable from the browser UI without adding REST endpoints.
  - Verification passed with `cd assets && bun run relay`, focused revenue/root/router Vitest suites, `cd assets && bun run typecheck`, `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `cd assets && bun run check`, and `git diff --check`.

- Frontend API token management demo parity lane: `docs/plans/2026-05-31-frontend-api-token-management-demo-parity-implementation-plan.md`
  - Status: completed on 2026-06-01
  - Source context: `ARCHITECTURE.md`
  - Scope: Relay-backed `/account/api-tokens` route loading, token list rendering, create/revoke/rotate mutation flows, one-time token display, navigation links, and final verification.
  - Result: API token lifecycle management is demoable from the browser UI through GraphQL and Phoenix session cookies, without adding REST endpoints or token-bearing browser auth.
  - Verification passed with `cd assets && bun run relay`, focused API-token/root Vitest suites, `cd assets && bun run typecheck`, `cd assets && bun run check`, `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare/accounts/api_token_test.exs`, and `git diff --check`.

- Product comparison demo parity lane: `docs/plans/2026-05-31-frontend-product-comparison-demo-parity-implementation-plan.md`
  - Status: completed on 2026-05-31
  - Source context: `ARCHITECTURE.md`
  - Scope: GraphQL `Product.currentAttributes`, product-detail specifications and compare entry, browse compare entry links, `/compare` product picker links, and compare-card attributes.
  - Result: product comparison is demoable from browse/detail into `/compare` without manual URL editing, and selected products display current attributes on detail and compare surfaces.
  - Verification passed with `mix test test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run relay`, focused browse/detail/compare Vitest suites, `cd assets && bun run typecheck`, `cd assets && bun run check`, and `git diff --check`.

- Review readability cleanups: `docs/work/review-readability-cleanups.md`
  - Status: completed on 2026-05-31
  - Source context: `ARCHITECTURE.md`, frontend Relay route data, GraphQL resolver helpers, and core backend contexts.
  - Scope: consolidated frontend route helpers, backend GraphQL helpers, context-local attr cleanup, and saved-comparisons Relay delete migration cleanup.
  - Result: repeated route/resolver plumbing now delegates to shared helpers where it pays off, core context attr handling stays local, and `/compare/saved` is on Relay query/mutation APIs.

- Commerce attribution lane: `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`
  - Status: completed on 2026-05-23
  - Final implementation plan: `docs/plans/2026-05-22-commerce-revenue-summary-graphql-implementation-plan.md`
  - Scope: first-party redirect/click plumbing, conversion and purchase-price facts, the revenue summary read model, and read-only GraphQL `revenueSummary` exposure are complete. CJ/Awin source-field mapping remains deferred pending account docs or sample payloads.

## Historical Reference

- `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
  - Completed on 2026-05-21.
- `docs/plans/2026-03-22-graphql-relay-contract-hardening-implementation-plan.md`
  - Completed on 2026-04-30.
- `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - Completed on 2026-03-19.
- Earlier dated plans in `docs/plans/` remain historical context unless `docs/work/index.md` promotes one into active execution.
