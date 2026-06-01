# Active Work Index

Start here before opening dated plans or checkpoint logs.

## How To Use This Folder

- Read this file first.
- In single-agent mode, open only the highest-priority unblocked active lane.
- In parallel mode, assign one worker to the highest-priority unblocked frontend lane and one worker to the highest-priority unblocked backend lane.
- Each worker stays inside its lane's `Owned paths`; shared planning docs stay coordinator-owned.
- Verify the selected batch against the codebase before editing.
- Workers update only their lane work doc as they go.
- Coordinators update this file plus `docs/plans/NOW.md` and `docs/plans/INDEX.md` whenever lane status, priority, or blockers change.

## Suggested Executor Prompts

```text
Coordinator prompt:
Start at docs/work/index.md.

Run in parallel-lane mode.
Assign one worker to the highest-priority unblocked frontend lane and one worker to the highest-priority unblocked backend lane.
Keep `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md` coordinator-owned.
Do not let workers edit the same files.
If a worker reports a blocker outside its owned paths, update the lane docs instead of having it cross lanes.
Integrate shared-doc updates only after reviewing both lane results.
Open or update a PR only when the coordinated slice is ready.
```

```text
Lane worker prompt:
Start at docs/work/index.md and open only the active {frontend|backend} lane assigned to you.

Execute the `Next batch` from that lane's work doc.
Before coding, verify the selected batch against the codebase and correct any drift in that lane doc.
Edit only the lane's `Owned paths` and that lane's work doc.
Do not edit `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, or `ARCHITECTURE.md` unless your prompt explicitly says you are the coordinator.
If the work requires another lane's files or a coordinator-owned doc, record a blocker in your lane doc and stop.
Commit only lane-local milestone changes.
```

## Active Work Lanes

- Frontend affiliate setup demo parity lane
  - Work doc: `docs/work/frontend-affiliate-setup-demo-parity.md`
  - Status: in progress
  - Priority: P1
  - Next batch: Task 4, wire navigation, verify the backend contract, and close the lane.
  - Owned paths: `assets/src/routes/affiliate/setup/**`, `assets/schema.graphql`, `assets/src/__generated__/**`, `assets/src/router.tsx`, `assets/src/routes/root.tsx`, `assets/src/routes/__tests__/root.route.test.tsx`, `assets/src/__tests__/router.test.tsx`, `docs/work/frontend-affiliate-setup-demo-parity.md`, `docs/plans/2026-06-01-frontend-affiliate-setup-demo-parity-implementation-plan.md`

- Frontend merchant discovery demo parity lane
  - Work doc: `docs/work/frontend-merchant-discovery-demo-parity.md`
  - Status: completed
  - Priority: P1
  - Next batch: no unblocked merchant discovery demo parity batch remains in this lane; coordinator follow-up can choose the next demo-parity candidate from `docs/plans/INDEX.md` if priorities continue toward affiliate setup.
  - Owned paths: `assets/src/routes/merchants/**`, `assets/schema.graphql`, `assets/src/__generated__/**`, `assets/src/router.tsx`, `assets/src/routes/root.tsx`, `assets/src/routes/__tests__/root.route.test.tsx`, `assets/src/__tests__/router.test.tsx`, `docs/work/frontend-merchant-discovery-demo-parity.md`, `docs/plans/2026-06-01-frontend-merchant-discovery-demo-parity-implementation-plan.md`

- Product comparison demo parity lane
  - Work doc: `docs/work/frontend-product-comparison-demo-parity.md`
  - Status: completed
  - Priority: P1
  - Next batch: no unblocked product-comparison demo parity batch remains in this lane; coordinator follow-up can choose a future demo-parity candidate if priorities change.
  - Owned paths: `lib/product_compare/specs.ex`, `lib/product_compare_web/resolvers/catalog_resolver.ex`, `lib/product_compare_web/schema.ex`, `test/product_compare_web/graphql/catalog_queries_test.exs`, `assets/**`, `docs/work/frontend-product-comparison-demo-parity.md`, `docs/plans/2026-05-31-frontend-product-comparison-demo-parity-implementation-plan.md`

- Frontend lane
  - Work doc: `docs/work/review-readability-cleanups.md`
  - Status: completed
  - Priority: P2
  - Next batch: no unblocked frontend batch is queued from this worktree; coordinator follow-up can choose a future frontend lane if priorities change.
  - Owned paths: `assets/**`, `docs/work/review-readability-cleanups.md`

- Backend lane
  - Work doc: `docs/work/review-readability-cleanups.md`
  - Status: completed
  - Priority: P2
  - Next batch: no unblocked backend batch is queued from this worktree; coordinator follow-up can choose another review-driven backend slice if priorities change.
  - Owned paths: `lib/product_compare/**`, `lib/product_compare_web/**`, `test/product_compare/**`, `test/product_compare_web/graphql/**`, `test/support/conn_case.ex`, `docs/work/review-readability-cleanups.md`

- Commerce attribution lane
  - Work doc: `docs/work/affiliate-revenue-attribution.md`
  - Status: completed
  - Priority: P2
  - Next batch: no unblocked commerce attribution batch remains in this worktree; CJ/Awin source-field mapping is deferred pending account docs or sample payloads.
  - Owned paths: `lib/product_compare/**`, `lib/product_compare_web/**`, `priv/repo/migrations/**`, `test/product_compare/**`, `docs/work/affiliate-revenue-attribution.md`, `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`, `docs/plans/2026-05-22-commerce-revenue-summary-graphql-implementation-plan.md`

- Product data ingestion lane
  - Work doc: `docs/work/product-data-scraping.md`
  - Status: blocked
  - Priority: P2
  - Next batch: no unblocked local ingestion batch is queued from this worktree; live CJ validation and source onboarding compliance signoff must unblock before live provider polling or Tier-3 scraping work begins.
  - Owned paths: `lib/product_compare/ingestion/**`, `lib/product_compare/ingestion.ex`, `lib/product_compare_schemas/ingestion/**`, `lib/product_compare_schemas/specs/**`, `lib/product_compare_schemas/pricing/**`, `priv/repo/migrations/**`, `test/product_compare/ingestion/**`, `test/support/fixtures/cj/**`, `docs/work/product-data-scraping.md`, `docs/plans/2026-05-23-product-data-ingestion-foundation-implementation-plan.md`, `docs/decisions/2026-05-23-ingestion-execution-boundary.md`

## Blocked / Needs Decision

- Live product-provider validation
  - Status: blocked
  - Priority: P2
  - Reason: live CJ credential path, quota behavior, and account-scoped sample payloads are not yet recorded.
  - Next batch after unblock: validate the live CJ product catalog scope; fall back to eBay Browse only if CJ scope is insufficient.

## Recently Completed

### Frontend Merchant Discovery Demo Parity

- Status: completed on 2026-06-01
- Source of truth: `docs/work/frontend-merchant-discovery-demo-parity.md`
- Outcome:
  - Added a Relay-backed `/merchants` route that preloads the existing public `merchants(first:, after:)` query.
  - Rendered merchant names/domains, empty state, cursor next-page links, and loader/query unavailable fallback.
  - Added `Merchants` links to primary navigation and home actions, and registered `/merchants` with `merchantDirectoryLoader`.
  - Verification passed with `cd assets && bun run relay`, focused merchant/root/router Vitest suites, `cd assets && bun run typecheck`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run check`, and `git diff --check`.

### Frontend Revenue Reporting Demo Parity

- Status: completed on 2026-06-01
- Source of truth: `docs/work/frontend-revenue-reporting-demo-parity.md`
- Outcome:
  - Added a Relay-backed `/commerce/revenue` route that preloads the existing `revenueSummary(input:)` query.
  - Rendered aggregate revenue filters, active normalized filters, suppressed and unsuppressed metric states, and a loader/query fallback.
  - Added `Revenue` links to primary navigation and home actions, and registered `/commerce/revenue` with `revenueSummaryLoader`.
  - Verification passed with `cd assets && bun run relay`, focused revenue/root/router Vitest suites, `cd assets && bun run typecheck`, `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `cd assets && bun run check`, and `git diff --check`.

### Frontend API Token Management Demo Parity

- Status: completed on 2026-06-01
- Source of truth: `docs/work/frontend-api-token-management-demo-parity.md`
- Outcome:
  - Added a Relay-backed `/account/api-tokens` route that lists API tokens, renders active/revoked status, and supports create, revoke, and rotate flows through GraphQL.
  - Added one-time token display for create/rotate flows and row-scoped pending/error states for lifecycle actions.
  - Added `API tokens` links to primary navigation and home actions.
  - Verification passed with `cd assets && bun run relay`, focused API-token/root Vitest suites, `cd assets && bun run typecheck`, `cd assets && bun run check`, `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare/accounts/api_token_test.exs`, and `git diff --check`.

### Product Comparison Demo Parity

- Status: completed on 2026-05-31
- Source of truth: `docs/work/frontend-product-comparison-demo-parity.md`
- Outcome:
  - Added GraphQL `Product.currentAttributes` for selected current product claims in display-ready form.
  - Product detail pages render current specifications and link the selected product into `/compare`.
  - Browse product cards include direct compare entry links.
  - `/compare` now has in-page product picker links for empty comparisons and ready comparisons with fewer than three products.
  - Ready `/compare` product cards render current attributes for selected products.
  - Verification passed with `mix test test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run relay`, focused browse/detail/compare Vitest suites, `cd assets && bun run typecheck`, `cd assets && bun run check`, and `git diff --check`.

### Review Readability Cleanups

- Status: completed on 2026-05-31
- Source of truth: `docs/work/review-readability-cleanups.md`
- Outcome:
  - Completed the saved-comparisons Relay delete migration and consolidated frontend route helpers for loader, mutation, auth, payload, and GraphQL error handling.
  - Centralized backend GraphQL input, global ID, connection, mutation error, and unauthenticated-error helpers across Auth, Catalog, Pricing, Affiliate, Commerce Attribution, Node, and schema resolver paths.
  - Kept core attr handling local to Accounts, Affiliate, and Commerce Attribution instead of carrying a cross-context helper module.
  - Verification passed with `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.

### Product Data Ingestion Persistence Task 2

- Status: completed on 2026-05-24
- Source of truth: `docs/work/product-data-scraping.md`
- Outcome:
  - Added `ProductCompare.Ingestion.persist_normalized_listing/2` to persist fixture-backed normalized listings into `SourceArtifact`, `ExternalProduct`, generated catalog product shells, `MerchantProduct`, and `PricePoint`.
  - Reused source-scoped merchant identities for merchant resolution and added replay idempotency for exact normalized listing replays.
  - Added stale-observation guards so older listing observations do not overwrite current merchant product state or add older price points.
  - Added database uniqueness indexes for replay-safe source artifact and price point writes.
  - Verification passed with `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs` and `mix typecheck`.

### Product Data Ingestion Foundation Task 1

- Status: completed on 2026-05-23
- Source of truth: `docs/work/product-data-scraping.md`
- Outcome:
  - Selected CJ as the first fixture-backed source and recorded the synchronous pilot boundary in `docs/decisions/2026-05-23-ingestion-execution-boundary.md`.
  - Added `merchant_source_identities` plus the ingestion schema/context boundary for deterministic source-scoped merchant resolution.
  - Added the normalized listing contract, adapter behavior, CJ fixture parser, and focused ingestion/parser tests.
  - Verification passed with `mix test test/product_compare/ingestion/ingestion_test.exs test/product_compare/ingestion/sources/cj/product_parser_test.exs`, `mix test test/product_compare/specs/source_artifact_changeset_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix typecheck`.

### Commerce Attribution Task 3

- Status: completed on 2026-05-23
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Outcome:
  - Added a read-only GraphQL `revenueSummary` query over the Task 2 dashboard summary contract.
  - Added Relay global ID normalization for merchant/product filters plus explicit network, currency, and date inputs.
  - Returned GraphQL-safe filter, metric, and server-enforced suppression objects while rejecting invalid filters.
  - Verification passed with `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `mix typecheck`, and `git diff --check`.

### Commerce Attribution Task 2

- Status: completed on 2026-05-22
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Outcome:
  - Added a query-backed revenue projection over click sessions, approved/paid conversions, and purchase-price facts.
  - Added merchant, product, network, and dashboard revenue summary context functions with JSON-ready metric and suppression shapes.
  - Verification passed with `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`, `mix typecheck`, and `git diff --check`.

### Commerce Attribution Task 1

- Status: completed on 2026-05-21
- Source of truth: `docs/work/affiliate-revenue-attribution.md`
- Outcome:
  - Added the redirect/attribution ADR plus core `commerce_links`, `commerce_click_sessions`, `commerce_conversions`, and `purchase_price_facts` persistence.
  - Added redirect resolution, idempotent conversion ingest, an Impact adapter, and focused redirect/context tests.
  - Verification passed with `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`.

### Frontend Relay Route-Data Adoption

- Status: completed on 2026-05-21
- Source of truth: `docs/work/frontend-relay-route-data.md`
- Outcome:
  - Relay SSR hydration, route preloading, `/products`, `/products/:slug`, `/compare`, and browser auth Relay migrations are complete.
  - `fetchGraphQL` is now a thin GraphQL HTTP transport helper, with route-loader top-level GraphQL error rejection kept in the Relay environment.
  - The later saved-comparisons Relay migration moved `/compare/saved` onto Relay query/mutation APIs and closed the explicit helper cleanup.

### Frontend Compare And Saved Routes Hardening

- Status: completed on 2026-05-21
- Source of truth: `docs/work/frontend-compare-saved-hardening.md`
- Outcome:
  - Shared compare shell, route-local status semantics, and compare-scoped route error boundaries are already in place.
  - The prior queue-rebaseline blocker is closed because Relay route-data Task 6 is complete.

### Frontend Relay Auth Mutation Migration

- Status: completed on 2026-05-02
- Source of truth: `docs/work/frontend-relay-route-data.md`
- Outcome:
  - Login, register, forgot-password, reset-password, and verify-email routes now commit the existing GraphQL auth contract through Relay mutation artifacts.
  - Removed the route-local `assets/src/routes/auth/actions.ts` helper and moved shared payload/error normalization to `assets/src/routes/auth/errors.ts`.
  - Verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`, and `cd assets && bun run typecheck`.

### GraphQL Relay Contract Hardening

- Status: completed on 2026-04-30
- Source of truth: `docs/work/graphql-relay-contract-hardening.md`
- Outcome:
  - Root `node(id: ID!)` support covers public catalog/pricing nodes plus owner-scoped saved comparison sets and API tokens.
  - Verification passed with `mix test test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/api_token_auth_test.exs && mix typecheck`.

### Frontend Saved Comparisons UI

- Status: completed on 2026-03-19
- Source of truth: `docs/work/frontend-saved-comparisons-ui.md`
- Outcome:
  - `/compare` now saves ready-state selections through `createSavedComparisonSet`.
  - `/compare/saved` now lists private saved sets, reopens them back into `/compare` with repeated `slug` params, and deletes them from the UI.
  - Frontend verification passed with `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx` and `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`.

### Saved Comparisons Backend

- Status: completed on 2026-03-18
- Source of truth: `docs/work/saved-comparisons-backend.md`
- Outcome:
  - Added owner-scoped `saved_comparison_sets` and `saved_comparison_items` persistence with ordered product items.
  - Added catalog APIs and GraphQL query/mutation support for listing, creating, and deleting private saved comparison sets.
  - Verification passed with `mix test test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs` and `mix typecheck`.

### GraphQL Dataloader Adoption

- Status: completed on 2026-03-18
- Source of truth: `docs/work/graphql-dataloader-adoption.md`
- Outcome:
  - Added a request-level GraphQL batching regression test at `test/product_compare_web/graphql/dataloader_batching_test.exs`.
  - Locked the relevant SQL envelope for one request spanning aliased `product` selections plus `merchantProducts`: three `products` selects and one each for `brands`, `merchant_products`, `merchants`, and `price_points`.
  - Verification passed with `mix test test/product_compare_web/graphql/dataloader_batching_test.exs`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs`, and `mix test test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`.

### Frontend Radix Primitives

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-radix-primitives.md`
- Outcome:
  - Added a shared frontend Radix wrapper layer at `assets/src/ui/primitives/` for `Button`, `Label`, `Separator`, and `Slot`.
  - Migrated the app shell, root navigation/actions, and shared auth form shell onto that wrapper layer while keeping existing route behavior and link semantics intact.
  - Verification passed with `cd assets && bun x vitest run src/ui/__tests__/primitives.test.tsx src/ui/__tests__/app-providers.test.tsx src/ui/__tests__/app-shell.test.tsx src/routes/__tests__/root.route.test.tsx src/routes/auth/__tests__/form-shell.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx` and `cd assets && bun run check`.

### Frontend Compare Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-compare-baseline.md`
- Outcome:
  - `/compare` now SSR-renders up to three product cards from repeated `slug` query params using the existing GraphQL product-detail path.
  - The route now distinguishes empty, over-limit, ready, missing-product, and unavailable states with focused compare-route coverage.
  - Frontend verification passed with `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

### Frontend Product Offers Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-product-offers.md`
- Outcome:
  - `/products/:slug` now renders an `Active offers` section from the existing GraphQL pricing surface.
  - The detail route now distinguishes offer-ready, offer-empty, and offer-unavailable states without regressing product-ready, not-found, or unavailable handling.
  - Verification passed with `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `mix test test/product_compare_web/graphql/pricing_queries_test.exs`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

### Frontend Product Detail Baseline

- Status: completed on 2026-03-18
- Source of truth: `docs/work/frontend-product-detail.md`
- Outcome:
  - `/products/:slug` now SSR-renders basic product details from GraphQL.
  - The route now distinguishes product-ready, not-found, and unavailable states with focused route regression coverage.
  - Browse product names now navigate into the detail route from `/products`.

### GraphQL Auth Migration Follow-up

- Status: completed on 2026-03-17
- Source of truth: `docs/work/graphql-auth-migration.md`
- Outcome:
  - Added `docs/decisions/2026-03-17-auth-token-delivery-deferral.md` to make the remaining transport gap explicit.
  - Closed the auth migration follow-up doc without reopening browser-auth implementation scope.

### Frontend Auth Browser Coverage

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-auth-browser-coverage.md`
- Outcome:
  - Added Playwright coverage for the existing frontend session, recovery, and verification routes.

### Frontend Catalog Browse

- Status: completed on 2026-03-17
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Outcome:
  - `/products` now SSR-renders the first catalog page from GraphQL.
  - The route now handles empty and unavailable catalog states with focused route regression coverage.
  - Frontend verification passed with `cd assets && bun run typecheck` and `cd assets && bun run test:unit`.

## Historical Plan Notes

### Frontend Fullstack Plan

- Status: rebaselined on 2026-03-17
- Source: `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
- Reason:
  - The older umbrella plan remains historical context only.
  - Its browse, product-detail, product-offers, and compare follow-ons are complete.

## Historical / Reference Only

- `docs/implementation-checklist.md` is a checkpoint log, not the active work queue.
- Dated files in `docs/plans/` are design and implementation baselines unless this index links them as active work.
