# Affiliate Revenue & Attribution Work Doc

## Snapshot

- Status: active
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-21 after commerce attribution Task 1 focused tests passed
- Detailed plan:
  - `docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`
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
- Start integration detail validation with Impact, CJ, and Awin payload samples because their ingestion modes differ (postback/API/report/feed).
- Use deterministic last-click attribution in phase 1.
- Keep public dashboards aggregate-only with suppression thresholds.

## Next Batch

- Status: ready
- Batch: Task 2
  1. Add the `commerce_revenue_daily` aggregate storage/read model or equivalent query-backed projection.
  2. Add merchant/product/network revenue summary context functions over approved/paid conversions.
  3. Define the baseline dashboard JSON contract for clicks, conversions, gross order value, commission revenue, and average paid price.
  4. Cover empty, aggregate, and suppression-ready result shapes with focused tests.

## Completed

- Task 1 completed on 2026-05-21:
  - Added `docs/decisions/2026-05-21-commerce-attribution-redirect-model.md`.
  - Added core migrations and schemas for `commerce_links`, `commerce_click_sessions`, `commerce_conversions`, and `purchase_price_facts`.
  - Added `ProductCompare.CommerceAttribution` APIs for idempotent link upserts, click sessions, redirect resolution, conversion ingest, and purchase-price facts.
  - Added `/r/:click_id` redirect handling and the first Impact conversion-ingest adapter.
  - Verified with `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`.

## Blockers / Deferred

- CJ and Awin source-field mapping requires account-specific docs or sample payloads. Keep that spike deferred until credentials/samples are available; do not block the local aggregate/read-model slice on it.

## Verification Commands

- `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`
- `mix typecheck`
- `git diff --check`

## Deferred note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.
