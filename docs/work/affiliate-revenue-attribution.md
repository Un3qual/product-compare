# Affiliate Revenue & Attribution Work Doc

## Snapshot

- Status: active
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-22 after commerce attribution Task 2 review hardening focused tests, typecheck, and diff check passed
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
- Start integration detail validation with Impact, CJ, and Awin payload samples because their ingestion modes differ (postback/API/report/feed).
- Use deterministic last-click attribution in phase 1.
- Keep public dashboards aggregate-only with suppression thresholds.

## Next Batch

- Status: ready
- Batch: Task 3
  1. Add a read-only `revenueSummary` GraphQL query backed by the Task 2 dashboard summary contract.
  2. Normalize merchant/product filters through Relay global IDs and keep network/currency/date/suppression filters explicit.
  3. Return JSON-safe filters, currency-scoped metrics, and suppression metadata without broadening invalid filters.
  4. Cover empty, aggregate, suppression, and invalid-filter shapes with focused GraphQL tests.

## Completed

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

- `mix test test/product_compare/commerce_attribution/commerce_attribution_test.exs test/product_compare_web/controllers/commerce_redirect_controller_test.exs`
- `mix typecheck`
- `git diff --check`

## Deferred note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.
