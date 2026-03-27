# Product Data Sourcing & Scraping Plan (2026-03-23)

## Purpose

Define **where** product data should come from and **how** we should ingest it in phased order, balancing implementation cost, freshness, and coverage for a functioning product.

## Scope posture for current phase (MVP+1 execution)

To ship faster, **data governance/privacy hardening tasks are deferred until further notice** in this plan.

- Focus current batches on connector integration, normalization, idempotent persistence, and reliability.
- Keep only minimal safety/compliance checks needed to operate.
- Re-open governance/privacy hardening after core ingestion flows are live.

This plan is intended to operationalize the deferred ingestion scope noted in:

- `docs/decisions/2026-03-05-mvp-scope-freeze.md`
- `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`

## Research Inputs (Subagent Research Pass)

> Note: CJ Developer Portal pages are JS-rendered, so this plan references official endpoint/docs URLs and treats field-level details as implementation-time validation items.

A parallel research pass reviewed current provider docs and standards for acquisition constraints, limits, and integration mechanics. Primary references:

- Amazon Associates PA-API FAQ and request-rate policy:
  - https://affiliate-program.amazon.com/help/node/topic/GVJ2BJP35457CLML
  - https://affiliate-program.amazon.com/help/node/topic/GLL6HEVVWUKMQDDQ
- eBay Buy/Browse and limits:
  - https://developer.ebay.com/api-docs/buy/browse/static/overview.html
  - https://developer.ebay.com/develop/get-started/api-call-limits
  - https://www.developer.ebay.com/api-docs/buy/static/buy-overview.html
- Best Buy Products API:
  - https://developer.bestbuy.com/apis
  - https://bestbuyapis.github.io/api-documentation/
- CJ developer docs:
  - https://developers.cj.com/docs/rest-apis/product-search
  - https://developers.cj.com/docs/product-feeds
  - https://developers.cj.com/docs/rest-apis/product-catalogs-overview/
- Awin product-feed API docs:
  - https://help.awin.com/apidocs/retail-advertiser-productapidocumentation
- Crawl/markup standards relevant to direct-site extraction:
  - RFC 9309 (robots): https://datatracker.ietf.org/doc/html/rfc9309
  - Sitemap protocol: https://www.sitemaps.org/protocol.html
  - Schema.org offer/product fields: https://schema.org/Offer, https://schema.org/priceCurrency

## Recommended Data Acquisition Ladder

Use this order to minimize legal/operational risk while reaching useful catalog coverage quickly.

### Tier 1 (start here): Official affiliate/marketplace APIs and feeds

1. eBay Browse API (Buy API)
2. Best Buy Products API
3. Commission Junction (CJ) product catalog surfaces (Product Search / Product Feeds)
4. Awin product feeds for approved merchants
5. Amazon PA-API (after eligibility and traffic constraints are satisfied)

**Why first:** explicit access model, stable docs, clearer terms, easier reliability model than custom web scraping.

### Tier 2: Merchant-owned feeds and structured exports

1. Merchant CSV/XML feeds (if partnership allows)
2. GTIN-oriented catalog enrichment via provider/standard datasets

**Why second:** often high-quality and low parsing cost, but onboarding is partner-by-partner.

### Tier 3 (selective): Direct web extraction from merchant pages

1. Crawl only sources that permit automated access and comply with terms/robots constraints.
2. Prioritize extraction from structured data (`schema.org` JSON-LD, `Offer`/`Product`) and sitemap discovery over brittle DOM scraping.

**Why last:** highest legal/compliance and maintenance risk; should be a controlled fallback, not default strategy.

## Source-by-Source Feasibility Matrix

| Source | Access path | Freshness shape | Limits/constraints | Engineering effort | Risk |
|---|---|---|---|---|---|
| eBay Browse API | OAuth + REST | near real-time listing/search | Daily call limits; some Buy APIs are limited-release in production | Medium | Low-Medium |
| Best Buy Products API | API key + REST | near real-time for many fields | key management + endpoint-specific constraints | Low-Medium | Low |
| CJ product catalog APIs/feeds | CJ account + developer access | API and/or feed-driven cadence | docs are portal-gated/JS; validate exact fields + quotas during connector spike | Medium | Low-Medium |
| Awin feeds | Bearer token upload/download flows depending role | batch-oriented feed cadence | network/merchant approval and feed schema conformance | Medium | Medium |
| Amazon PA-API | Associates-linked API account | request-rate scales with attributed shipped revenue | strict associates and API license compliance, low initial request rate | Medium-High | Medium |
| Direct merchant scraping | crawler + parser | configurable | must obey terms/robots + anti-bot + layout drift | High | High |


## CJ Approved-Account Track (fallback source path)

### Why CJ remains useful as a fallback

- Existing approved account removes a major onboarding blocker when eBay coverage or quota is insufficient.
- CJ provides product-catalog surfaces (Product Search and Product Feeds docs) suitable for fallback ingestion and validation.
- Merchant breadth in CJ can also accelerate **new merchant discovery** while the primary eBay path is being built.

### CJ fallback connector spike checklist (3–5 days)

1. Confirm which CJ data path is available for this account:
   - REST Product Search docs: `developers.cj.com/docs/rest-apis/product-search`
   - Product Feeds docs: `developers.cj.com/docs/product-feeds`
   - Product Catalogs overview: `developers.cj.com/docs/rest-apis/product-catalogs-overview/`
2. Capture auth + quota behavior in a local integration note.
3. Pull a small sample by one category and one known merchant.
4. Map available identifiers to internal canonical keys (`external_source`, `external_product_id`, merchant key, listing URL).
5. Validate replay idempotency with two consecutive imports of the same CJ sample.

### CJ “find new merchants” workflow

Use a repeatable weekly process to grow merchant coverage without uncontrolled scraping:

1. In CJ Account Manager, export/record candidate advertisers by target category and region.
2. Score candidates with a simple rubric:
   - Product feed/catalog availability
   - Program terms constraints (paid search, coupon, trademark rules)
   - Commission and EPC competitiveness
   - Data quality signals (identifier completeness, image/link consistency)
3. Apply in small cohorts (e.g., 10–20 advertisers/week) and track approval latency.
4. For approved programs, run a “data viability check” before full onboarding:
   - Can we ingest representative products?
   - Are price and availability fields sufficiently complete?
   - Are links stable and trackable?
5. Promote merchants that pass viability into ingestion schedule; keep others in a parked backlog.

## Phase Plan

## Phase 0 — Governance + Source Selection (1 week)

### Deliverables

- Approved source shortlist (minimum: 2 Tier-1 providers).
- Minimal provider onboarding checklist for initial operation (expanded governance review deferred).
- Canonical data contract v0 for ingestion pipeline:
  - `external_source`
  - `external_product_id`
  - `merchant_identifier`
  - price/availability payload and observed timestamp

### Exit criteria

- One signed-off ADR choosing initial execution mode:
  - **A:** sync import pilot, or
  - **B:** Oban-first ingestion.

## Phase 1 — Tier-1 Connector MVP (2–3 weeks)

### Scope

- Implement **one** connector end-to-end (recommended: eBay Browse API).
- Build ingestion pipeline:
  1. Fetch
  2. Normalize
  3. Upsert Catalog/Pricing
  4. Record ingestion run outcome

### Required behaviors

- Idempotent upsert by `(source, external_product_id)` and `(merchant, canonical_url_or_listing_key)`.
- Deterministic mapping errors (reject + reason code).
- Last-write-wins with `observed_at` guards for price staleness.

### Validation

- Fixture tests for parser/normalizer.
- Integration test replaying same payload twice with no duplicates.
- Failure-path test coverage for auth failure, rate-limit response, malformed payload.

## Phase 2 — Reliability & Operations (1–2 weeks)

### Scope

- Add job orchestration (if not already selected in Phase 0):
  - queue partition by source
  - retries with bounded backoff
  - dead-letter queue for unrecoverable records
- Telemetry:
  - run duration
  - fetched vs normalized vs persisted counts
  - failure categories

### SLO targets (initial)

- Ingestion pipeline success rate >= 99% per run for valid payloads.
- Alert if source run failure rate > 5% for 3 consecutive runs.
- Alert if no successful run in 2x scheduled interval.

## Phase 3 — Expand Connectors + Controlled Scraping (ongoing)

### Scope

- Add second and third Tier-1/2 connectors.
- Only introduce Tier-3 direct scraping for explicit gap coverage.

### Direct scraping gate (must all pass)

1. No viable official API/feed for required data.
2. Legal/compliance review approved.
3. robots/terms handling implemented and documented.
4. Structured-data-first parser available (JSON-LD + sitemap discovery).
5. Source-specific kill switch configured.

## Proposed Internal Architecture

### Adapter boundary

```text
ProductCompare.Ingestion.Sources.Adapter
  fetch_batch(cursor, opts) -> {:ok, batch, next_cursor} | {:error, reason}
  normalize(record) -> {:ok, normalized_record} | {:error, mapping_error}
```

### Normalized record contract (draft)

```text
%NormalizedListing{
  source: atom(),
  external_product_id: String.t(),
  product_title: String.t(),
  brand_name: String.t() | nil,
  gtin: String.t() | nil,
  merchant_name: String.t(),
  listing_url: String.t(),
  currency: String.t(),
  amount: Decimal.t(),
  availability: atom(),
  observed_at: DateTime.t(),
  raw_payload: map()
}
```

### Pipeline stages

1. `FetchJob` (source auth/cursor/rate-limit aware)
2. `NormalizeJob` (schema validation + canonical mapping)
3. `PersistJob` (idempotent upserts)
4. `AuditJob` (metrics + anomaly checks)

## Detailed Implementation Backlog

1. Add ingestion context skeleton (`ProductCompare.Ingestion`) and adapter behavior.
2. Add ingestion-run persistence table (`ingestion_runs`) and record-level error table (`ingestion_errors`).
3. Implement first connector with fixtures.
4. Wire write path into existing Catalog/Pricing upsert APIs.
5. Add telemetry events and dashboards.
6. Add runbook (`docs/runbooks/ingestion-first-source.md`).
7. Add ADR documenting sync-vs-Oban boundary and revisit trigger.

## Risks and Mitigations

- **Provider access revoked / not approved**
  - Mitigation: keep at least two active Tier-1 connectors.
- **Rate-limit throttling**
  - Mitigation: token bucket per source and dynamic backoff.
- **Data drift (fields missing/renamed)**
  - Mitigation: strict validation + schema version tracking per source.
- **Legal/compliance uncertainty**
  - Mitigation: provider checklist + mandatory legal signoff before activation.

## Immediate Next Batch (actionable)

1. Pick first connector (**recommended default: eBay Browse API**; use CJ only if eBay quota/coverage unavailable).
2. Create ADR: `docs/decisions/2026-03-23-ingestion-execution-boundary.md`.
3. Scaffold ingestion context and adapter behavior with one fixture-based parser test.
4. Update `docs/work/product-data-scraping.md` status from `drafting` to `active` once source is chosen.


## Deferred Until Further Notice

- Data governance policy automation for source-level retention/redistribution controls.
- Privacy hardening and governance observability for ingestion telemetry.
- Expanded compliance workflow tooling beyond baseline startup checks.
