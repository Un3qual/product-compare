# Affiliate Revenue & Attribution Work Doc

## Snapshot

- Status: ready (revenue summary presentation extraction)
- Priority: P2
- Source of truth: this file
- Last verified: 2026-07-10 after authenticated revenue-preview positioning
  passed focused route and TypeScript verification
- Detailed plan:
  - `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`
  - `docs/plans/2026-05-22-commerce-revenue-summary-graphql-implementation-plan.md`
- Objective:
  - Design a trustworthy attribution pipeline covering outbound links, purchases, paid prices, and aggregated revenue metrics per product/merchant/channel.

## Why This Work Exists

- Product direction includes transparent public revenue reporting.
- We need reliable price-paid tracking to compare listed vs actual paid outcomes.
- A future open-source browser extension needs a shared, ethical attribution backend.

## Scope (Draft)

- Link routing + click session capture.
- Conversion/purchase ingestion and status lifecycle.
- Price-paid fact recording and aggregation.
- Public-safe revenue/statistics exposure with privacy guardrails.
- Network/merchant data-availability matrix (how to get data + detail level).

## Current Recommendation

- Build a first-party redirect/click contract first, then layer network conversion ingestion.
- Keep live Impact, CJ, and Awin conversion ingestion outside the current
  feature-complete milestone; reconsider it only through a later explicit
  product decision with representative provider evidence.
- Use deterministic last-click attribution in phase 1.
- Keep public dashboards aggregate-only with suppression thresholds.

## Revenue Preview Positioning Evidence

- Status: done
- Plan: `docs/plans/2026-07-10-revenue-preview-positioning-implementation-plan.md`
- RED: the named preview test failed because the route still used the `Revenue
  reporting` heading and had no recorded-data or provider-status disclosure.
- GREEN: the focused revenue route suite passed 15 tests, `cd assets && bun run
  typecheck` exited 0, and `git diff --check` exited 0.
- The authenticated route now says `Revenue reporting preview`, describes its
  metrics as recorded attribution data, and states that no live conversion
  provider is connected for this milestone.
- Existing loader, Relay query, filter, suppression, and error behavior remain
  unchanged.

## Ready Next Batch

- Status: ready
- Plan: `docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md`
- Next action: Extract filter, date-preset, active-filter, and metric presentation while preserving route-owned loader, Relay, suspense, and error orchestration.
- Owned paths:
  - `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
  - `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
  - `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
  - `docs/work/affiliate-revenue-attribution.md`
- Prerequisites: Existing revenue-summary route suite remains the characterization contract.
- Verification:
  - `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: Revenue presentation is isolated while query, filter, suppression, date-preset, and error behavior remain green.

## Completed

- Commerce Offer Interaction Batch completed on 2026-07-08:
  - Added a first-party `trackCommerceClick(input:)` GraphQL mutation that
    accepts only `merchantProductId` and returns a relative `/r/:click_id`
    redirect path.
  - Resolved outbound destinations server-side from an existing affiliate link
    when present, otherwise from `merchant_products.url`; raw browser-provided
    destinations are rejected at GraphQL input validation.
  - Reused the existing `commerce_links`, `commerce_click_sessions`, and
    `/r/:click_id` redirect structures. Link/session writes happen together so
    invalid stored destinations do not create click sessions.
  - Guardrails: eBay Browse fallback, ingestion dashboard/operator surfaces,
    live provider credentials/application work, Tier-3 scraping, and CSV export
    remain deferred and out of scope.
  - RED evidence:
    `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare_web/graphql/commerce_click_test.exs` -
    failed for missing `track_outbound_click/1` and absent
    `trackCommerceClick` schema/input.
  - GREEN evidence:
    `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs test/product_compare_web/graphql/commerce_click_test.exs` -
    35 tests, 0 failures.

- Task 3 completed on 2026-05-23:
  - Added a read-only `revenueSummary` GraphQL query backed by the Task 2 dashboard summary contract.
  - Normalized merchant/product filters through Relay global IDs while keeping network, currency, and date filters explicit.
  - Returned GraphQL-safe filters, currency-scoped metric strings/counts, and server-enforced suppression metadata without broadening invalid filters.
  - Covered empty, aggregate, low-volume suppression, invalid global ID, and invalid scalar-filter shapes with focused GraphQL tests.
  - Verified with `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `mix typecheck`, and `git diff --check`.

- Task 2 completed on 2026-05-22:
  - Added a query-backed revenue projection over commerce click sessions, approved/paid conversions, and purchase-price facts.
  - Added merchant, product, and network revenue summary context functions plus a JSON-ready dashboard summary contract with filters, currency-scoped metrics, and suppression metadata.
  - Hardened the context contract after review by rejecting ambiguous mixed-currency money aggregation, validating dimension filters before query construction, deriving supported network filters from the schema source, counting network clicks from conversion source-network fallbacks, keeping click attribution independent from conversion revenue status, and normalizing date filters against UTC datetime boundaries.
  - Covered empty, aggregate, and low-volume suppression result shapes with focused commerce attribution tests.
  - Verified with `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`, `mix typecheck`, and `git diff --check`.

- Task 1 completed on 2026-05-21:
  - Added `docs/decisions/2026-05-21-commerce-attribution-redirect-model.md`.
  - Added core migrations and schemas for `commerce_links`, `commerce_click_sessions`, `commerce_conversions`, and `purchase_price_facts`.
  - Added `ProductCompare.CommerceAttribution` APIs for idempotent link upserts, click sessions, redirect resolution, conversion ingest, and purchase-price facts.
  - Added `/r/:click_id` redirect handling and the first Impact conversion-ingest adapter.
  - Verified with `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`.

## Blockers / Deferred

- CJ and Awin source-field mapping requires account-specific docs or sample payloads. Keep that spike deferred until credentials/samples are available; do not block the local aggregate/read-model slice on it.

## Verification Commands

- `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- `mix typecheck`
- `git diff --check`

## Deferred note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.
