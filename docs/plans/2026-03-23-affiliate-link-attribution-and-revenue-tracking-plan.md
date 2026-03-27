# Affiliate / Commerce Attribution, Revenue, and Price-Paid Tracking Plan (2026-03-23)

Execution status and next steps live in `docs/work/affiliate-revenue-attribution.md` and `docs/work/index.md`; dated `docs/plans/*` docs are historical context unless linked from the work index.

## Purpose

Define how to track:

1. affiliate and non-affiliate outbound links,
2. resulting purchases/conversions,
3. price paid at conversion time,
4. revenue and commission metrics by product/merchant/channel,

while preserving user trust, privacy, and future extensibility (including a public, open-source browser extension).

## Product Goals

- Publicly display transparent revenue metrics (aggregated, privacy-safe).
- Understand what users are actually paying vs listed prices.
- Measure merchant/program performance over time.
- Build attribution foundations reusable by web app + future extension clients.

## Non-Goals (Phase 1)

- Full fraud-detection ML.
- Multi-touch attribution modeling.
- Real-time personalized bidding or coupon automation.
- Browser extension build itself (tracked as a follow-on product plan).

## Scope posture for current phase (MVP+1 execution)

To prioritize a functioning product, **data governance and privacy-hardening tasks are deferred until further notice**.

- Keep only minimal implementation requirements needed for baseline operation and legal compliance.
- Defer advanced privacy controls (retention automation, anonymization policy tuning, public transparency policy UX, governance dashboards).
- Track deferred items explicitly and do not block schema/API scaffolding on them.
- Phase 0 baseline controls required before production traffic:
  - retain raw click/conversion payload snapshots for at least 30 days for reconciliation, then automatically delete or anonymize them by day 90 unless legal or finance retention requires longer,
  - publish explicit consent/legal-basis notes for attribution storage and provide an opt-out flow for non-essential telemetry,
  - apply role-based access control and least-privilege defaults to ingest and admin surfaces,
  - record audit logs with tamper-evident records for attribution-data access and changes,
  - require encryption in transit for redirect/ingest flows and encryption at rest for persisted raw payloads,
  - handle DSAR/deletion requests within a 30-day SLA,
  - Owner: Ryan (acting compliance lead).

## External Data Availability Research (Networks + Merchants)

### Affiliate network tracking-data matrix (research-backed)

| Network | How to get data | What detail is available | Freshness / latency | Integration notes |
|---|---|---|---|---|
| impact.com | Publisher REST APIs (`Actions`, `ActionUpdates`, `Items`) + postbacks | Action lifecycle and item-level endpoints are explicitly documented in the publisher API reference; field-level payload mapping must be captured during implementation in authenticated docs/tests | Postbacks + report export workflows are both documented | Strong option for granular conversion lifecycle tracking once schema mapping is validated |
| Awin | Transaction Notifications callback + API credentials + proof-of-purchase transaction API (enablement required) | Callback macros include `clickRef`, transaction ID, commission, merchant ID; optional product-level data and click-source data; proof-of-purchase allows pending transaction submission | Near real-time callback flow for tracked transactions | Strong for both click-based and proof-of-purchase / cookie-light scenarios |
| Rakuten Advertising | Reporting API URLs + Advanced Reports API via Developer Portal tokens | Payment history/detail reports, advertiser payment history, plus reporting interface APIs (including custom reports) | Report-pull model; limits documented (e.g., Advanced Reports API call caps) | Best for reporting ingestion and payout reconciliation; less postback-oriented |
| CJ (Commission Junction) | Developer Portal docs (Product Search, Product Feeds, Product Catalogs), plus SFTP/report infrastructure | Product/catalog surfaces are documented; conversion/report payload detail must be validated in authenticated portal during connector spike | API/feed + report cadence (to be confirmed in account) | Because docs are JS-gated, field dictionary must be captured during implementation spike |
| Amazon Associates | Associates reports (Ordered Items/Bounties/Earnings) + link/order reports | Clicks, ordered items, shipped items, conversion rates, order report details, earnings (with report timing caveats) | Ordered items and bounties update hourly; earnings report trails by one day | Good for aggregate revenue visibility; less flexible than raw webhook-style conversion feeds |

### Merchant/program data research (catalog vs conversion detail)

| Merchant/program | Catalog / offer data we can pull | Conversion / revenue data we can pull | Detail level assessment |
|---|---|---|---|
| Walmart Affiliate Program | Affiliate member center provides links and data feeds | Runs on impact.com with daily reporting for impressions, click-throughs, orders, sales, commissions | Good conversion metric detail; exact field richness follows impact integration path |
| eBay | Browse API `ItemSummary` + shipping fields; Buy Feed APIs for item feeds | Conversion attribution not provided by Browse itself; pair with affiliate-network reporting | Excellent listing-level price/shipping detail, but conversion lives in partner tracking |
| Best Buy | Products API covers pricing, availability, specs, images; `show` can return field subsets (e.g., `sku,name,salePrice`) | Product API alone does not provide affiliate conversion events | Excellent product metadata feed; must join to affiliate network data for revenue attribution |
| Amazon retail via Associates | Product/order-oriented reports plus program-level earnings data | Order and earnings reporting with known update windows | Useful reporting detail, but integration model is report-first vs event-postback-first |

### Practical implications for our tracking architecture

1. Support **three ingestion modes**:
   - push callbacks/postbacks (impact, Awin)
   - API/report pulls (Rakuten, Amazon)
   - feed/SFTP imports (CJ and merchant feeds)
2. Keep `commerce_conversions` source-agnostic with source-specific raw payload snapshots.
3. Add `attribution_confidence` and `data_freshness_at` to reflect delayed report arrivals.
4. Model product catalog ingestion and conversion ingestion as independent pipelines joined on merchant/program/product keys.

### Research references (official docs)

- impact.com publisher APIs:
  - https://integrations.impact.com/impact-publisher/reference/the-action-object
  - https://integrations.impact.com/impact-publisher/reference/the-action-updates-object
  - https://integrations.impact.com/impact-publisher/reference/the-items-object
- Awin:
  - https://help.awin.com/docs/transaction-notifications
  - https://help.awin.com/apidocs/proof-of-purchase-publisher-transaction-api
  - https://help.awin.com/apidocs/api-authentication
- Rakuten Advertising:
  - https://pubhelp.rakutenadvertising.com/hc/en-us/articles/5949824361485-Advanced-Reports-API
  - https://pubhelp.rakutenadvertising.com/hc/en-us/articles/360061521052-Run-Reports-Via-API
- CJ:
  - https://developers.cj.com/docs/rest-apis/product-search
  - https://developers.cj.com/docs/product-feeds
  - https://developers.cj.com/downloads/SFTP-Connection-Support-Guide-v0.1.pdf
- Walmart Affiliate Program:
  - https://affiliates.walmart.com/page/faqs
- eBay Browse API:
  - https://developer.ebay.com/api-docs/buy/browse/types/gct%3AItemSummary
  - https://developer.ebay.com/api-docs/buy/browse/types/gct%3AShippingOptionSummary
- Best Buy APIs:
  - https://developer.bestbuy.com/apis
  - https://bestbuyapis.github.io/api-documentation/
- Amazon Associates reporting help:
  - https://affiliate-program.amazon.com/help/node/topic/GMWAK55DQX8JEK7C
  - https://affiliate-program.amazon.com/help/node/topic/GPTZ495QPL6TEZLJ

## Domain Model Additions (Proposed)

**Schema conventions note:** All tables below follow existing schema conventions: each table uses an integer surrogate primary key named `id` (of type `:id`), and foreign key columns are named `<table>_id` (also of type `:id`). Nullable foreign keys are denoted with `?` (e.g., `click_id?`, `program_id?`, `product_id?`) and are `:id` columns that allow null. Special public identifiers (e.g., `click_id` as a public UUID in `commerce_click_sessions`) are additional UUID columns and are not the table primary key. This applies to all tables: `commerce_links`, `commerce_link_variants`, `commerce_click_sessions`, `commerce_click_events`, `commerce_conversions`, `purchase_price_facts`, and `commerce_revenue_daily`.

## 1) Link inventory and routing

- `commerce_links`
  - canonical outbound destination + merchant/program metadata
  - fields: `merchant_id`, `program_id?`, `destination_url`, `link_type` (`affiliate` | `non_affiliate`), `network`, `campaign_params`, `is_active`

- `commerce_link_variants`
  - network-specific variants for the same canonical destination
  - fields: `commerce_link_id`, `variant_key`, `tracking_template`, `priority`, `effective_from`, `effective_to`

## 2) Click/session attribution

- `commerce_click_sessions`
  - one row per outbound click event
  - fields: `click_id` (public UUID), `user_id?`, `anonymous_id`, `source_surface` (web, api, extension), `referrer`, `user_agent_hash`, `ip_hash`, `created_at`

- `commerce_click_events`
  - detailed event stream (optional if we keep single-table in phase 1)
  - fields: `click_session_id`, `event_type` (`redirected`, `landed`, `postback_received`, etc.), `payload`, `occurred_at`

## 3) Conversions/purchases

- `commerce_conversions`
  - one row per confirmed purchase/action
  - fields:
    - `conversion_id` (internal)
    - `network_conversion_ref` (external unique)
    - `click_id?` (nullable for unattributed/late conversions)
    - `merchant_id`, `program_id?`, `product_id?`, `merchant_product_id?`
    - `status` (`pending`, `approved`, `reversed`, `paid`)
    - `currency`, `order_amount`, `commission_amount`, `commission_rate?`
    - `purchased_at`, `reported_at`

## 4) Price-paid facts

- `purchase_price_facts`
  - normalized price snapshot at purchase time
  - fields: `conversion_id`, `listed_price_at_click?`, `reported_paid_price`, `shipping_amount?`, `tax_amount?`, `discount_amount?`, `currency`

## 5) Revenue aggregates/materializations

- `commerce_revenue_daily`
  - dimensions: `date`, `merchant_id?`, `product_id?`, `channel`, `network`
  - metrics: clicks, conversions, conversion_rate, gross_order_value, commission_revenue, avg_paid_price

## Tracking Flows

## Flow A — Outbound link redirect (owned hop)

1. User clicks offer CTA.
2. App routes through owned redirect endpoint (`/r/:click_id`).
3. Backend records click session and resolves best link variant.
4. User redirected to merchant/network URL.

Benefits:
- stable first-party click ID,
- uniform tracking for affiliate + non-affiliate links,
- easier extension parity later.

## Flow B — Network postback / conversion ingest

1. Network sends webhook/postback or report export row.
2. Ingestion normalizes payload into `commerce_conversions`.
3. Match against `click_id`/subid/reference where available.
4. Upsert conversion status transitions (pending -> approved -> paid / reversed).

## Flow C — Price-paid enrichment

1. On conversion ingest, parse paid amount and currency.
2. Join nearest internal price observation around click/purchase timestamp.
3. Write `purchase_price_facts` for analytics and public transparency views.

## Attribution Strategy (Phase 1)

- Primary: last-click deterministic attribution using `click_id`/subid.
- Fallback: weak matching (merchant + time window + amount) flagged as `confidence=low`.
- Unmatched conversions preserved for aggregate revenue but excluded from “price paid by click” analyses.

## API / GraphQL Surface (Proposed)

- Mutations:
  - `createOutboundClick(input)` -> returns redirect token/url
  - `ingestConversion(input)` (internal/service-auth only)

- Queries:
  - `revenueSummary(input)` (date range, merchant/product filters)
  - `productRevenueStats(productId, range)`
  - `merchantRevenueStats(merchantId, range)`
  - `pricePaidStats(productId, range)`

- Public-safe view model:
  - expose aggregated stats only (k-anonymity threshold + suppression for low-volume buckets).

## Privacy, Legal, and Trust Guardrails (Deferred for now)

- **Deferred until further notice:** privacy-governance hardening tasks are not in the current execution batch.
- Baseline minimums remain in force before production traffic:
  - retain raw click/conversion payload snapshots for at least 30 days for reconciliation, then automatically delete or anonymize them by day 90 unless legal or finance retention requires longer,
  - publish explicit consent/legal-basis notes for attribution storage and provide an opt-out flow for non-essential telemetry,
  - apply role-based access control and least-privilege defaults to ingest and admin surfaces,
  - record audit logs with tamper-evident records for attribution-data access and changes,
  - require encryption in transit for redirect/ingest flows and encryption at rest for persisted raw payloads,
  - handle DSAR/deletion requests within a 30-day SLA,
  - Owner: Ryan (acting compliance lead).
- Re-activate the full privacy/governance checklist in a follow-up work item once core attribution + conversion plumbing is functional.

## “Ethical Honey” Extension Readiness (Future-facing)

Prepare backend contracts so an open-source extension can:

1. request eligible offers for current merchant/product context,
2. create click sessions through the same redirect contract,
3. report optional client-side telemetry with explicit user consent,
4. avoid dark patterns (forced redirects, opaque overrides).

Recommended extension principles:
- open-source by default,
- explicit user opt-in for data collection,
- explain why/when links are affiliate monetized,
- no hidden substitution of user-entered coupon codes,
- easy global off switch.

## Rollout Plan

## Phase 0 — Schema + contracts (1–2 weeks)

- Add core tables (`commerce_links`, `commerce_click_sessions`, `commerce_conversions`, `purchase_price_facts`).
- Add base context APIs for create click + ingest conversion + aggregation reads.
- Add idempotency constraints (`network_conversion_ref`, `click_id`).

## Phase 1 — First network integration (2 weeks)

- Implement one affiliate network conversion ingest path.
- Wire outbound redirect endpoint for selected offer links.
- Validate click->conversion match rate and status lifecycle.

## Phase 2 — Revenue + price-paid reporting (1–2 weeks)

- Build daily aggregate jobs/materialized views.
- Add internal dashboard and GraphQL read models.
- Add public-safe summary endpoint/query (initial, minimal controls).

## Phase 3 — Extension-ready hardening (ongoing)

- Add channel dimension + token model for extension clients.
- Publish OSS extension API contract and auth model.
- Add anti-abuse controls and rate limits.

## Success Metrics

- Click capture rate for outbound offers >= 99% (owned surfaces).
- Conversion ingest idempotency errors < 0.5%.
- Matched conversion rate improves week-over-week after integration.
- Revenue reporting lag < 24h for daily aggregates.
- Public stats suppression prevents low-sample deanonymization.

## Immediate Next Batch

1. Draft ADR: attribution model + redirect contract.
2. Create migrations for core commerce attribution tables.
3. Implement click redirect endpoint + tests.
4. Run source-field mapping spike (Impact + CJ + Awin) and produce normalized conversion field dictionary (captured from authenticated docs + sample payloads).
5. Add first conversion ingest adapter and idempotent upsert tests.
6. Add merchant/product daily aggregate query and baseline dashboard JSON contract.


## Deferred Until Further Notice

- Data governance policy automation and retention enforcement workflows.
- Advanced privacy hardening and anonymization tuning for public analytics surfaces.
- Expanded transparency UX and governance audit tooling.
