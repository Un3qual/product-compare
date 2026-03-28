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
2. Keep `commerce_conversions` network-neutral (the `source_network` discriminator identifies the origin, but all networks share the same schema) with source-specific raw payload snapshots.
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

**Schema conventions note:** All tables below follow existing schema conventions: each table uses an integer surrogate primary key named `id` (of type `:id`), and foreign key columns are named `<table>_id` (also of type `:id`). Nullable foreign keys are denoted with `?` (e.g., `click_session_id?`, `program_id?`, `product_id?`) and are `:id` columns that allow null. Special public identifiers (e.g., `click_id` as a public UUID in `commerce_click_sessions`) are additional UUID columns and are not the table primary key or foreign key. When a downstream table needs both the internal relationship and the public click reference, keep them separate (for example `click_session_id?` plus `public_click_id?`). This applies to all tables: `commerce_links`, `commerce_link_variants`, `commerce_click_sessions`, `commerce_click_events`, `commerce_conversions`, `purchase_price_facts`, and `commerce_revenue_daily`.

**Unique constraints (idempotency keys):**

| Table | Unique constraint | Purpose |
|---|---|---|
| `commerce_click_sessions` | `click_id` (UUID) | Prevents duplicate click session creation; used as the public-facing idempotency key |
| `commerce_conversions` | `(source_network, network_conversion_ref)` | Ensures each network-reported conversion is ingested exactly once; composite key prevents cross-network collisions on external reference values |
| `purchase_price_facts` | `conversion_id` | One price-fact row per conversion |
| `commerce_link_variants` | `(commerce_link_id, variant_key)` | One variant per key per canonical link |
| `commerce_revenue_daily` | `(date, COALESCE(merchant_id, 0), COALESCE(product_id, 0), channel, network)` | One aggregate row per dimension combination per day; uses `COALESCE` sentinel values in a unique index to ensure NULL-safe uniqueness (PostgreSQL treats each NULL as distinct in standard unique constraints) |

## 1) Link inventory and routing

- `commerce_links`
  - canonical outbound destination + merchant/program metadata
  - fields: `merchant_id`, `program_id?`, `destination_url`, `link_type` (`affiliate` | `non_affiliate`), `network` (same enum as `commerce_conversions.source_network`), `campaign_params`, `is_active`

- `commerce_link_variants`
  - network-specific variants for the same canonical destination
  - fields: `commerce_link_id`, `variant_key`, `tracking_template`, `priority`, `effective_from`, `effective_to`

## 2) Click/session attribution

- `commerce_click_sessions`
  - one row per outbound click event
  - fields: `click_id` (public UUID), `commerce_link_id` (FK to `commerce_links`), `user_id?`, `anonymous_id`, `source_surface` (web, api, extension), `referrer`, `user_agent_hash`, `ip_hash`, `created_at`

- `commerce_click_events`
  - detailed event stream (optional if we keep single-table in phase 1)
  - fields: `click_session_id`, `event_type` (`redirected`, `landed`, `postback_received`, etc.), `payload`, `occurred_at`

## 3) Conversions/purchases

- `commerce_conversions`
  - one row per confirmed purchase/action
  - fields:
    - `id` (internal surrogate PK, per schema conventions)
    - `source_network` (e.g., `impact`, `awin`, `rakuten`, `cj`, `amazon_associates`) — identifies the originating affiliate network
    - `network_conversion_ref` (external reference; unique per `source_network` — see composite unique constraint above)
    - `click_session_id?` (nullable FK to `commerce_click_sessions` for unattributed/late conversions)
    - `public_click_id?` (nullable public UUID or network-subid reference captured before internal click-session resolution)
    - `merchant_id`, `program_id?`, `product_id?`, `merchant_product_id?`
    - `status` (`pending`, `approved`, `reversed`, `paid`)
    - `currency`, `order_amount`, `commission_amount`, `commission_rate?`
    - `attribution_confidence` (`high` | `low` | `unmatched`) — reflects match quality; weak matches (merchant + time window + amount) are flagged `low`, unresolved conversions are `unmatched`
    - `data_freshness_at` (timestamp of the most recent network/report update for this conversion)
    - `purchased_at`, `reported_at`

## 4) Price-paid facts

- `purchase_price_facts`
  - normalized price snapshot at purchase time, enriched with the nearest internal price observation
  - fields:
    - `conversion_id` (FK to `commerce_conversions`)
    - `listed_price_at_click?`, `reported_paid_price`, `shipping_amount?`, `tax_amount?`, `discount_amount?`, `currency`
    - `price_observation_id?` (FK to internal price observation used for enrichment)
    - `observed_at?` (timestamp of the matched price observation)
    - `observed_price?` (internal price at `observed_at`)
    - `price_delta?` (difference between `reported_paid_price` and `observed_price`)

## 5) Revenue aggregates/materializations

- `commerce_revenue_daily`
  - dimensions: `date`, `merchant_id?`, `product_id?`, `channel`, `network` (same enum as `source_network`)
  - metrics: clicks, conversions, conversion_rate, gross_order_value, commission_revenue, avg_paid_price

## Migration and Coexistence Strategy: `commerce_*` vs Existing `affiliate_*` Tables

### Canonical source decision

The new `commerce_*` domain (comprising `commerce_links`, `commerce_link_variants`, `commerce_click_sessions`, `commerce_click_events`, `commerce_conversions`, `purchase_price_facts`, and `commerce_revenue_daily`) will become the **canonical source of truth** for all outbound link tracking, click attribution, conversion recording, and revenue aggregation going forward.

The existing `affiliate_links`, `affiliate_programs`, and `affiliate_networks` tables will be **deprecated** after a migration and dual-write period, and eventually dropped once all references are migrated.

### Data mapping document: field mappings between `affiliate_*` and `commerce_*`

| Legacy (`affiliate_*`) field | New (`commerce_*`) field | Mapping notes |
|---|---|---|
| `affiliate_links.id` | `commerce_links.id` | Surrogate keys do not map directly; correlation via business key (destination URL + program) |
| `affiliate_links.original_url` | `commerce_links.destination_url` | Direct mapping (also note `affiliate_links.affiliate_url` for tracked URL) |
| `affiliate_links.merchant_product_id` | `commerce_links.merchant_id` | Maps merchant_product relationship to merchant dimension |
| `affiliate_links.affiliate_network_id` | `commerce_links.network` | Foreign key becomes enum; network ID maps to network enum values that align with `commerce_conversions.source_network` |
| `affiliate_links.affiliate_url` | `commerce_links.campaign_params` | Tracked URL parameters extracted into structured campaign_params JSON |
| `affiliate_programs.*` | (unified `programs` table) | Program metadata will be consolidated into a shared `programs` table or equivalent that supports both affiliate and non-affiliate programs |
| `affiliate_networks.*` | `commerce_links.network` enum + config | Network metadata moves to application config or a lightweight `commerce_network_configs` reference table; `commerce_links.network` and `commerce_conversions.source_network` use the same enum |

### Migration/backfill plan: idempotent scripts to populate `commerce_*` from `affiliate_*` (and vice-versa if needed)

**Phase 0 (Baseline):** Create `commerce_*` schema and deploy empty tables.

**Phase 1 (Backfill):** Run idempotent migration script that:

1. Inserts rows into `commerce_links` from `affiliate_links` using `(destination_url, program_id, merchant_id)` as the business key.
2. Uses `ON CONFLICT (destination_url, program_id, merchant_id) DO UPDATE` (or equivalent upsert with a composite unique constraint on all three business key columns) to ensure repeated runs are safe and prevent merging distinct merchant rows.
3. Marks backfilled rows with `backfilled_from_affiliate_links = true` metadata flag for audit tracking.
4. Does **not** attempt reverse-sync (no write-back to `affiliate_*` after initial backfill).

**Phase 2 (Dual-write):** Application code writes new link inventory and click sessions to **both** `affiliate_*` and `commerce_*` tables for a transition period (detailed below).

**Phase 3 (Cutover):** Application switches to `commerce_*` as the read source; `affiliate_*` tables become write-only for rollback safety.

**Phase 4 (Deprecation):** After validation, stop dual-write and mark `affiliate_*` tables as deprecated; schedule drop after retention window.

### Dual-write/feature-flag rollout approach

**Dual-write implementation:**

- **Links:** When creating or updating outbound links, write to both `affiliate_links` (legacy) and `commerce_links` (new) using the same transaction.
- **Click sessions:** When recording a click, write to both `affiliate_clicks` (if exists) and `commerce_click_sessions` using the same `click_id` UUID as the correlation key.
- **Conversions:** When ingesting a network conversion, write to both legacy conversion tracking (if exists) and `commerce_conversions`.
- **Consistency guarantee:** Use database transactions to ensure both writes succeed or both roll back. If dual-write fails, do NOT fall back to legacy-only write; instead, trigger a fail-and-retry mechanism or enqueue the write for later processing. Dual-write failures must trigger degraded-mode alerting and escalation. Automated retries or queued writes must continue until both writes succeed, with monitoring and alerting visible to operators. Run a parity-check reconciliation job (described below) to verify consistency until the migration completes.

**Feature flag strategy:**

- `commerce_attribution_write_enabled` (default: `true` after Phase 1 backfill) — controls whether new writes go to `commerce_*` tables.
- `commerce_attribution_read_enabled` (default: `false` initially, `true` after Phase 2 validation) — controls whether application reads from `commerce_*` or legacy `affiliate_*`.
- `affiliate_legacy_write_enabled` (default: `true` during dual-write, `false` after cutover) — controls whether writes still go to `affiliate_*`.

**Reconciliation jobs:**

- **Click reconciliation:** Nightly job compares `affiliate_clicks` and `commerce_click_sessions` using `click_id` (the shared public UUID) as the join key; alerts on mismatches (count, timestamp drift, missing rows).
- **Conversion reconciliation:** Nightly job compares legacy conversion records and `commerce_conversions` using `(source_network, network_conversion_ref)` as the composite unique key; alerts on status divergence or missing conversions.
- **Idempotency enforcement:** Both tables enforce their own unique constraints (`click_id` for click sessions, `(source_network, network_conversion_ref)` for conversions) so duplicate ingestion is prevented at the database level.

### Deprecation timeline for `affiliate_*` to prevent long-term drift and conflicting truth sources

| Milestone | Target date (relative to Phase 0) | Actions |
|---|---|---|
| Phase 0: Schema deployed | Week 0 | `commerce_*` tables exist but unused |
| Phase 1: Backfill complete | Week 1 | Historical `affiliate_links` data copied into `commerce_links` |
| Phase 2: Dual-write active | Weeks 2–4 | All new writes go to both systems; reconciliation jobs run nightly |
| Phase 3: Read cutover | Week 5 | Application switches primary reads to `commerce_*`; `affiliate_*` becomes write-only for rollback safety |
| Phase 4: Write cutover | Week 6 | Stop writing to `affiliate_*`; mark tables as deprecated in schema comments |
| Phase 5: Retention window | Weeks 7–10 | Retain `affiliate_*` tables for emergency rollback and audit; no active writes or reads |
| Phase 6: Drop legacy tables | Week 11+ | After stakeholder signoff, drop `affiliate_links`, `affiliate_programs`, `affiliate_networks`, and any related legacy tables |

**Success criteria before deprecation:**

- Reconciliation job reports < 0.1% row-count mismatch between `affiliate_*` and `commerce_*` for 7 consecutive days.
- Zero critical incidents attributed to `commerce_*` read path in production.
- All downstream analytics, reporting, and payout workflows migrated to `commerce_*` queries.

**Rollback safety:**

- During Phases 2–5, keep both systems operational so we can revert the read flag if `commerce_*` queries fail or produce incorrect results.
- After Phase 6 (drop), rollback is no longer possible; this gate requires explicit eng + product signoff.

## Tracking Flows

### Flow A — Outbound link redirect (owned hop)

1. User clicks offer CTA.
2. App routes through owned redirect endpoint (`/r/:click_id`).
3. Backend records click session and resolves best link variant.
4. User redirected to merchant/network URL.

Benefits:
- stable first-party click ID,
- uniform tracking for affiliate + non-affiliate links,
- easier extension parity later.

### Flow B — Network postback / conversion ingest

1. Network sends webhook/postback or report export row.
2. Ingestion normalizes payload into `commerce_conversions`.
3. Match against public `click_id`/subid/reference where available, then hydrate `click_session_id` when resolution succeeds.
4. Upsert conversion status transitions (pending -> approved -> paid / reversed).

### Flow C — Price-paid enrichment

1. On conversion ingest, parse paid amount and currency.
2. Join nearest internal price observation around the conversion's `purchased_at` timestamp (preferred) or `reported_at` (fallback when `purchased_at` is absent). Use a maximum staleness window of 24 hours before and after the reference timestamp; select the observation closest in time within that window.
3. If no price observation exists within the staleness window, write the `purchase_price_facts` row with `price_observation_id`, `observed_at`, `observed_price`, and `price_delta` set to null. The row is still created so that `reported_paid_price` and cost fields are available for aggregate reporting.
4. Write `purchase_price_facts` for analytics and public transparency views.

## Attribution Strategy (Phase 1)

- Primary: last-click deterministic attribution using `click_id`/subid.
- Fallback: weak matching (merchant + time window + amount) flagged as `attribution_confidence=low`.
- Unmatched conversions preserved for aggregate revenue but excluded from "price paid by click" analyses.

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

### Phase 0 — Schema + contracts (1–2 weeks)

- Create core tables (`commerce_links`, `commerce_click_sessions`, `commerce_conversions`, `purchase_price_facts`).
- Expose base context APIs for create click, ingest conversion, and aggregation reads.
- Enforce idempotency constraints: composite `(source_network, network_conversion_ref)` on conversions, `click_id` UUID on click sessions (see unique constraints table above).

### Phase 1 — First network integration (2 weeks)

- Implement one affiliate network conversion ingest path.
- Wire outbound redirect endpoint for selected offer links.
- Validate click->conversion match rate and status lifecycle.

### Phase 2 — Revenue + price-paid reporting (1–2 weeks)

- Build daily aggregate jobs/materialized views.
- Wire internal dashboard and GraphQL read models.
- Expose public-safe summary endpoint/query (initial, minimal controls).

### Phase 3 — Extension-ready hardening (ongoing)

- Introduce channel dimension + token model for extension clients.
- Publish OSS extension API contract and auth model.
- Layer in anti-abuse controls and rate limits.

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
5. Build first conversion ingest adapter and idempotent upsert tests.
6. Wire merchant/product daily aggregate query and baseline dashboard JSON contract.

## Deferred Until Further Notice

- Data governance policy automation and retention enforcement workflows.
- Advanced privacy hardening and anonymization tuning for public analytics surfaces.
- Expanded transparency UX and governance audit tooling.