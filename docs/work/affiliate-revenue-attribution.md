# Affiliate Revenue & Attribution Work Doc

## Snapshot

- Status: drafting
- Priority: P2
- Source of truth: this file
- Last verified: 2026-03-23
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

1. ADR for redirect + attribution model.
2. Core schema migrations and idempotency constraints.
3. Redirect endpoint implementation with tests.
4. First conversion-ingest adapter with upsert tests.

## Verification Commands

- `sed -n '1,300p' docs/plans/2026-03-23-affiliate-link-attribution-and-revenue-tracking-plan.md`
- `sed -n '1,200p' docs/work/affiliate-revenue-attribution.md`

## Deferred note

- Data governance and privacy hardening tasks are intentionally deferred until further notice to prioritize a functioning first implementation.
