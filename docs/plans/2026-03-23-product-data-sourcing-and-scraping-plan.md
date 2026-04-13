# Product Data Sourcing & Scraping Plan (2026-03-23)

## Purpose

Define where product data should come from and how we should ingest it in phased order, balancing implementation cost, freshness, and coverage for a functioning product.

## Scope Posture For Current Phase (MVP+1 Execution)

To ship faster, data governance and privacy-hardening tasks are deferred until further notice in this plan.

- Focus current batches on connector integration, normalization, idempotent persistence, and reliability.
- Keep only minimal safety and compliance checks needed to operate.
- Re-open governance and privacy hardening after core ingestion flows are live.

This plan is intended to operationalize the deferred ingestion scope noted in:

- `docs/decisions/2026-03-05-mvp-scope-freeze.md`
- `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`

## Research Inputs

> Note: CJ Developer Portal pages are JS-rendered, so this plan references official endpoint and docs URLs and treats field-level details as implementation-time validation items.

A parallel research pass reviewed current provider docs and standards for acquisition constraints, limits, and integration mechanics. Primary references:

- Amazon Associates PA-API FAQ and request-rate policy:
  - <https://affiliate-program.amazon.com/help/node/topic/GVJ2BJP35457CLML>
  - <https://affiliate-program.amazon.com/help/node/topic/GLL6HEVVWUKMQDDQ>
- eBay Buy/Browse and limits:
  - <https://developer.ebay.com/api-docs/buy/browse/static/overview.html>
  - <https://developer.ebay.com/develop/get-started/api-call-limits>
  - <https://www.developer.ebay.com/api-docs/buy/static/buy-overview.html>
- Best Buy Products API:
  - <https://developer.bestbuy.com/apis>
  - <https://bestbuyapis.github.io/api-documentation/>
- CJ developer docs:
  - <https://developers.cj.com/docs/rest-apis/product-search>
  - <https://developers.cj.com/docs/product-feeds>
  - <https://developers.cj.com/docs/rest-apis/product-catalogs-overview/>
- Awin product-feed API docs:
  - <https://help.awin.com/apidocs/retail-advertiser-productapidocumentation>
- Crawl and markup standards relevant to direct-site extraction:
  - RFC 9309 (robots): <https://datatracker.ietf.org/doc/html/rfc9309>
  - Sitemap protocol: <https://www.sitemaps.org/protocol.html>
  - Schema.org offer and product fields: <https://schema.org/Offer>, https://schema.org/priceCurrency

## Recommended Data Acquisition Ladder

Use this order to minimize legal and operational risk while reaching useful catalog coverage quickly. This is the generic source ranking; the current execution default still favors CJ because approved account access removes an onboarding delay.

### Tier 1 (start here): Official affiliate and marketplace APIs and feeds

1. eBay Browse API (Buy API)
2. Best Buy Products API
3. Commission Junction (CJ) product catalog surfaces (Product Search / Product Feeds)
4. Awin product feeds for approved merchants
5. Amazon PA-API (after eligibility and traffic constraints are satisfied)

Why first: explicit access model, stable docs, clearer terms, and an easier reliability model than custom web scraping.

### Tier 2: Merchant-owned feeds and structured exports

1. Merchant CSV and XML feeds (if partnership allows)
2. GTIN-oriented catalog enrichment via provider and standard datasets

Why second: often high quality and low parsing cost, but onboarding is partner-by-partner.

### Tier 3 (selective): Direct web extraction from merchant pages

1. Crawl only sources that permit automated access and comply with terms and robots constraints.
2. Prioritize extraction from structured data (`schema.org` JSON-LD, `Offer`, and `Product`) and sitemap discovery over brittle DOM scraping.

Why last: highest legal, compliance, and maintenance risk; it should be a controlled fallback, not the default strategy.

## Source-By-Source Feasibility Matrix

| Source | Access path | Freshness shape | Limits/constraints | Engineering effort | Risk |
|---|---|---|---|---|---|
| eBay Browse API | OAuth + REST | near real-time listing/search | Daily call limits; some Buy APIs are limited-release in production | Medium | Low-Medium |
| Best Buy Products API | API key + REST | near real-time for many fields | key management + endpoint-specific constraints | Low-Medium | Low |
| CJ product catalog APIs/feeds | CJ account + developer access | API and/or feed-driven cadence | docs are portal-gated and JS-rendered; validate exact fields and quotas during connector spike | Medium | Low-Medium |
| Awin feeds | Bearer token upload/download flows depending on role | batch-oriented feed cadence | network/merchant approval and feed schema conformance | Medium | Medium |
| Amazon PA-API | Associates-linked API account | request-rate scales with attributed shipped revenue | strict associates and API license compliance, low initial request rate | Medium-High | Medium |
| Direct merchant scraping | crawler + parser | configurable | must obey terms, robots, anti-bot, and layout drift | High | High |

## CJ-Specific Execution Track (Because Account Access Already Exists)

### Why CJ First

- Existing approved account removes a major onboarding blocker.
- CJ provides product-catalog surfaces (Product Search and Product Feeds docs) suitable for affiliate comparison ingestion.
- Merchant breadth in CJ can also accelerate new merchant discovery while ingestion is being built.

### CJ Connector Spike Checklist (3-5 Days)

1. Confirm which CJ data path is available for this account:
   - REST Product Search docs: `developers.cj.com/docs/rest-apis/product-search`
   - Product Feeds docs: `developers.cj.com/docs/product-feeds`
   - Product Catalogs overview: `developers.cj.com/docs/rest-apis/product-catalogs-overview/`
2. Capture auth and quota behavior in a local integration note.
3. Pull a small sample by one category and one known merchant.
4. Map available identifiers to internal canonical keys (`external_source`, `external_product_id`, merchant key, listing URL).
5. Validate replay idempotency with two consecutive imports of the same CJ sample.

### CJ "Find New Merchants" Workflow

Use a repeatable weekly process to grow merchant coverage without uncontrolled scraping:

1. In CJ Account Manager, export or record candidate advertisers by target category and region.
2. Score candidates with a simple rubric:
   - Product feed or catalog availability
   - Program terms constraints (paid search, coupon, trademark rules)
   - Commission and EPC competitiveness
   - Data quality signals (identifier completeness, image and link consistency)
3. Apply in small cohorts (for example 10-20 advertisers per week) and track approval latency.
4. For approved programs, run a data-viability check before full onboarding:
   - Can we ingest representative products?
   - Are price and availability fields sufficiently complete?
   - Are links stable and trackable?
5. Promote merchants that pass viability into the ingestion schedule; keep others in a parked backlog.

## Phase Plan

## Phase 0 - Governance + Source Selection (1 Week)

### Deliverables

- Approved source shortlist (minimum: 2 Tier-1 providers).
- Minimal provider onboarding checklist for initial operation (expanded governance review deferred).
- Canonical data contract v0 for the ingestion pipeline:
  - `external_source`
  - `external_product_id`
  - `merchant_identifier`
  - price and availability payload plus observed timestamp

### Exit Criteria

- One signed-off ADR choosing initial execution mode:
  - A: sync import pilot, or
  - B: Oban-first ingestion.

## Phase 1 - Tier-1 Connector MVP (2-3 Weeks)

### Scope

- Implement one connector end-to-end, defaulting to CJ because the account is already approved and falling back to eBay Browse only if CJ scope is insufficient for the first spike.
- Build the ingestion pipeline:
  1. Fetch
  2. Normalize
  3. Upsert Catalog and Pricing
  4. Record ingestion run outcome

### Required Behaviors

- Idempotent upsert by `(source, external_product_id)` and `(merchant, canonical_url_or_listing_key)`.
- Deterministic mapping errors (reject plus reason code).
- Last-write-wins with `observed_at` guards for price staleness.

### Validation

- Fixture tests for parser and normalizer.
- Integration test replaying the same payload twice with no duplicates.
- Failure-path coverage for auth failure, rate-limit response, and malformed payload.

## Phase 2 - Reliability & Operations (1-2 Weeks)

### Phase 2 Scope

- Add job orchestration (if not already selected in Phase 0):
  - queue partition by source
  - retries with bounded backoff
  - dead-letter queue for unrecoverable records
- Add telemetry for:
  - run duration
  - fetched vs normalized vs persisted counts
  - failure categories

### SLO Targets (Initial)

- Ingestion pipeline success rate >= 99% per run for valid payloads.
- Alert if source run failure rate > 5% for 3 consecutive runs.
- Alert if no successful run lands within 2x the scheduled interval.

## Phase 3 - Expand Connectors + Controlled Scraping (Ongoing)

### Scope

- Add second and third Tier-1 or Tier-2 connectors.
- Introduce Tier-3 direct scraping only for explicit gap coverage.

### Direct Scraping Gate (Must All Pass)

1. No viable official API or feed exists for the required data.
2. Legal and compliance review approved it.
3. Terms and robots handling is implemented and documented.
4. A structured-data-first parser is available (JSON-LD plus sitemap discovery).
5. A source-specific kill switch is configured.

## Proposed Internal Architecture

### Adapter Boundary

```text
ProductCompare.Ingestion.Sources.Adapter
  fetch_batch(cursor, opts) -> {:ok, batch, next_cursor} | {:error, reason}
  normalize(record) -> {:ok, normalized_record} | {:error, mapping_error}
```

### Normalized Record Contract (Draft)

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

### Pipeline Stages

1. `FetchJob` (source auth, cursor, and rate-limit aware)
2. `NormalizeJob` (schema validation plus canonical mapping)
3. `PersistJob` (idempotent upserts)
4. `AuditJob` (metrics plus anomaly checks)

## Detailed Implementation Backlog

1. Add the ingestion context skeleton (`ProductCompare.Ingestion`) and adapter behavior.
2. Add an `ingestion_runs` persistence table and an `ingestion_errors` table.
3. Implement the first connector with fixtures.
4. Wire the write path into existing Catalog and Pricing upsert APIs.
5. Add telemetry events and dashboards.
6. Add a runbook at `docs/runbooks/ingestion-first-source.md`.
7. Add an ADR documenting the sync-vs-Oban boundary and revisit trigger.

## Risks And Mitigations

- Provider access revoked or not approved
  - Mitigation: keep at least two active Tier-1 connectors.
- Rate-limit throttling
  - Mitigation: token bucket per source and dynamic backoff.
- Data drift (fields missing or renamed)
  - Mitigation: strict validation plus schema version tracking per source.
- Legal or compliance uncertainty
  - Mitigation: provider checklist plus mandatory signoff before activation.

## Immediate Next Batch (Actionable)

1. Pick the first connector, defaulting to CJ because the account is already approved.
2. Create `docs/decisions/2026-03-23-ingestion-execution-boundary.md`.
3. Scaffold the ingestion context and adapter behavior with one fixture-based parser test.
4. Update `docs/work/product-data-scraping.md` from `drafting` to `active` once source choice is confirmed.

## Deferred Until Further Notice

- Data governance policy automation for source-level retention and redistribution controls.
- Privacy hardening and governance observability for ingestion telemetry.
- Expanded compliance workflow tooling beyond baseline startup checks.
