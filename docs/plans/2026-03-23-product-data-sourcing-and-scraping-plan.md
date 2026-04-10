# Product Data Sourcing & Scraping Plan (2026-03-23)

Execution status and next steps live in `docs/work/product-data-scraping.md` (product-data-scraping work document) and `docs/work/index.md` (work index). This dated plan doc is historical context only.

## Purpose

Define **where** product data should come from and **how** we should ingest it in phased order, balancing implementation cost, freshness, and coverage for a functioning product.

## Scope posture for current phase (MVP+1 execution)

To ship faster, **data governance/privacy hardening tasks are deferred for the MVP+1 connector rollout only** in this plan.

- Focus current batches on connector integration, normalization, idempotent persistence, and reliability.
- Keep only minimal safety/compliance checks needed to operate.
- Re-open governance/privacy hardening at Phase 2 exit or by `2026-06-30`, whichever comes first.
- Owner: Ryan (backend/ingestion lead), tracked in `docs/work/product-data-scraping.md`.
- Acceptance criteria for re-entry: one Tier-1 connector is live end-to-end, ingestion success/error telemetry and alerting are running, and the source-agnostic Tier-1 onboarding/compliance checklist is approved.

This plan is intended to operationalize the deferred ingestion scope noted in:

- `docs/decisions/2026-03-05-mvp-scope-freeze.md`
- `docs/decisions/2026-03-05-graphql-contract-posture-and-async-boundaries.md`

## Research Inputs (Subagent Research Pass)

> Note: CJ Developer Portal pages are JS-rendered, so this plan references official endpoint/docs URLs and treats field-level details as implementation-time validation items.

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
- Crawl/markup standards relevant to direct-site extraction:
  - RFC 9309 (robots): <https://datatracker.ietf.org/doc/html/rfc9309>
  - Sitemap protocol: <https://www.sitemaps.org/protocol.html>
  - Schema.org offer/product fields: <https://schema.org/Offer>, <https://schema.org/priceCurrency>

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
| Awin feeds | Bearer token upload/download flows depending on role | batch-oriented feed cadence | network/merchant approval and feed schema conformance | Medium | Medium |
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

### Phase 0 — Governance + Source Selection (1 week)

#### Deliverables

- Approved source shortlist (minimum: 2 Tier-1 providers).
- Minimal provider onboarding checklist for initial operation (expanded governance review deferred).
- Canonical data contract v0 for ingestion pipeline:
  - `external_source`
  - `external_product_id`
  - `merchant_identifier`
  - `merchant_domain?`
  - price/availability payload and observed timestamp

#### Exit criteria

- One signed-off ADR choosing initial execution mode:
  - **A:** sync import pilot, or
  - **B:** Oban-first ingestion.

### Phase 1 — Tier-1 Connector MVP (2–3 weeks)

#### Phase 1 scope

- Implement **one** connector end-to-end (recommended: eBay Browse API).
- Build ingestion pipeline:
  1. Fetch
  2. Normalize
  3. Upsert Catalog/Pricing
  4. Record ingestion run outcome

#### Required behaviors

- Idempotent upsert by `(source, external_product_id)`, `(source, merchant_identifier)`, and `(merchant, canonical_url_or_listing_key)`.
- Deterministic mapping errors (reject + reason code).
- Last-write-wins with `observed_at` guards for price staleness.

#### Validation

- Fixture tests for parser/normalizer.
- Integration test replaying same payload twice with no duplicates.
- Failure-path test coverage for auth failure, rate-limit response, malformed payload.

### Phase 2 — Reliability & Operations (1–2 weeks)

#### Phase 2 scope

- Add job orchestration (if not already selected in Phase 0):
  - queue partition by source
  - retries with bounded backoff
  - dead-letter queue for unrecoverable records
- Telemetry:
  - run duration
  - fetched vs normalized vs persisted counts
  - failure categories

#### SLO targets (initial)

- Ingestion pipeline success rate >= 99% per run for valid payloads.
- Alert if source run failure rate > 5% for 3 consecutive runs.
- Alert if no successful run in 2x scheduled interval.

### Phase 3 — Expand Connectors + Controlled Scraping (ongoing)

#### Phase 3 scope

- Add second and third Tier-1/2 connectors.
- Only introduce Tier-3 direct scraping for explicit gap coverage.

#### Direct scraping gate (must all pass)

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
  merchant_identifier: String.t(),
  product_title: String.t(),
  brand_name: String.t() | nil,
  gtin: String.t() | nil,
  merchant_name: String.t(),
  merchant_domain: String.t() | nil,
  listing_url: String.t(),
  currency: String.t(),
  amount: Decimal.t(),
  availability: atom(),
  observed_at: DateTime.t(),
  raw_payload: map()
}
```

### Normalized field mapping

Use `NormalizeJob` to project each normalized field into the current persistence model:

| `NormalizedListing` field | Current destination | Notes |
|---|---|---|
| `source` | `ExternalProduct.source_id` via `Sources.Source` | Resolve or create the source row before persistence. |
| `external_product_id` | `ExternalProduct.external_id` | `external_products` owns the source-scoped identifier. Only use `merchant_products.external_sku` for an actual merchant-facing SKU when one exists; do not overload it with the provider's external product ID. |
| `merchant_identifier` | `MerchantSourceIdentity.merchant_identifier` in a new source-scoped lookup table | Persist the source merchant key so `NormalizeJob` can resolve the same merchant across repeated imports even when `merchant_name` or `merchant_domain` drift. Keep `Merchant` as the canonical merchant record and make the lookup table the idempotency anchor. |
| `product_title` | `Product.name` and the resolved `Product.id` referenced by `ExternalProduct.product_id` / `MerchantProduct.product_id` | Create or update the catalog product name from the normalized title, then link the product row into the source and merchant records. |
| `brand_name` | `Product.brand_id` when a matching brand exists or can be created | No first-class brand-name field exists on the normalized record path itself. |
| `gtin` | `Product.model_number` only if the GTIN is the canonical model identifier; otherwise no first-class destination yet | Keep the fallback explicit rather than inventing a new schema field. |
| `merchant_name` | `Merchant.name` | Seed or update the canonical merchant name after resolving `merchant_identifier` through the source identity table. |
| `merchant_domain` | `Merchant.domain` | Store the canonical merchant domain alongside the merchant record, and use it as a secondary bootstrap hint when creating a new source identity. |
| `listing_url` | `MerchantProduct.url` and `ExternalProduct.canonical_url` | Use the merchant-product URL as the canonical commerce listing URL for the source-scoped listing. |
| `currency` | `MerchantProduct.currency` and `PricePoint.price` currency context | Merchant products store the listing currency; price points continue to carry numeric price only. |
| `amount` | `PricePoint.price` | Persist the observed listing price as the price point. |
| `availability` | `PricePoint.in_stock` | This is the current first-class availability signal; richer availability states are not modeled yet. |
| `observed_at` | `PricePoint.observed_at`, `ExternalProduct.last_seen_at`, and `MerchantProduct.last_seen_at` | Use the timestamp for the latest source sighting and the price observation. |
| `raw_payload` | `SourceArtifact.raw_json` / `SourceArtifact.raw_text` | Store the full source payload on the artifact record; no separate raw-payload field exists on product/merchant rows. |

### Merchant identity persistence

Add a dedicated `merchant_source_identities` lookup table to keep source-scoped merchant resolution deterministic without bloating `Merchant` with provider-specific columns. The table should carry at least:

- `source_id`
- `merchant_identifier`
- `merchant_id`
- `merchant_name`
- `merchant_domain`
- `last_seen_at`

Schema constraints:

- FK `source_id -> sources.id` (`NOT NULL`)
- FK `merchant_id -> merchants.id` (`NOT NULL`)
- Unique `(source_id, merchant_identifier)`
- Index `(source_id)` for source-scoped lookups and replay idempotency checks
- Index `(merchant_id)` for reverse lookups, merges, and downstream joins

Use a unique constraint on `(source_id, merchant_identifier)` so replayed imports resolve the same merchant row instead of creating duplicates when names or domains drift. `NormalizeJob` should resolve or create the `merchant_source_identities` row first, use its stable `merchant_id` foreign key as the canonical merchant anchor, and only then upsert `Merchant`, `MerchantProduct`, and `ExternalProduct` through that resolved link.

### Pipeline stages

1. `FetchJob` (source auth/cursor/rate-limit aware)
2. `NormalizeJob` (schema validation + canonical mapping)
3. `PersistJob` (idempotent upserts)
4. `AuditJob` (metrics + anomaly checks)

## Detailed Implementation Backlog

1. Scaffold ingestion context skeleton (`ProductCompare.Ingestion`) and adapter behavior.
2. Create ingestion-run persistence tables (`ingestion_runs`, `ingestion_errors`) and source-merchant identity lookup table (`merchant_source_identities`).
3. Implement first connector with fixtures.
4. Wire write path into existing Catalog/Pricing upsert APIs.
5. Instrument telemetry events and dashboards.
6. Write runbook (`docs/runbooks/ingestion-first-source.md`).
7. Draft ADR documenting sync-vs-Oban boundary and revisit trigger.

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
3. Scaffold ingestion context, merchant identity persistence, and adapter behavior with one fixture-based parser test.
4. Update `docs/work/product-data-scraping.md` status from `drafting` to `active` once source is chosen.

## Deferred Beyond The MVP+1 Re-entry Gate

- Data governance policy automation for source-level retention/redistribution controls.
- Privacy hardening and governance observability for ingestion telemetry.
- Expanded compliance workflow tooling beyond baseline startup checks.
