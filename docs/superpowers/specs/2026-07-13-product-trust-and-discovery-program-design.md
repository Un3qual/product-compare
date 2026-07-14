# Product Trust And Discovery Program Design

## Decision

ProductCompare will move from a usable comparison demo to a trustworthy product
discovery system through six dependency-ordered subprojects. The shared rule is
that every shopper-facing assertion must identify its scope, observation time,
and supporting source. Product, offer, recommendation, review, and merchant
surfaces must fail closed when that evidence is missing or stale.

The selected program includes:

1. canonical, specification-rich product ingestion;
2. complete and fresh offer truth;
3. durable ingestion operations;
4. price watchlists and alerts;
5. shareable comparison snapshots;
6. source-backed decision recommendations;
7. specification provenance and corrections;
8. reviews and product Q&A;
9. merchant detail pages; and
10. SEO and acquisition surfaces.

## Delivery Order

The program executes in this order:

1. **Trusted catalog foundation.** Canonical identities, enriched normalized
   listings, media, typed claims, provenance, and correction workflow.
2. **Offer truth and durable ingestion.** Global current-offer reads, landed
   price components, freshness states, run reconciliation, durable jobs,
   retries, and operational health.
3. **Retention and decision support.** Watch rules, in-app alert events,
   immutable public snapshots, and deterministic evidence-backed guidance.
4. **Community and merchant trust.** Reviews, questions and answers,
   moderation controls, and merchant detail pages.
5. **Acquisition.** Crawlable product, merchant, comparison, and category
   surfaces with canonical metadata, structured data, and sitemaps.

Later stages may begin only when their required read contracts exist. SEO does
not publish thin or untrusted pages, recommendations do not consume provisional
claims, and alerts do not fire from unreconciled observations.

## Shared Product Rules

- A provider listing is not automatically a canonical product. Exact validated
  identifiers may resolve automatically; uncertain matches become reviewable
  candidates and never silently merge.
- `product_attribute_current` remains the only current specification value.
  Imported and user corrections create claims and evidence; they do not mutate
  current values in place.
- An offer is current only within an explicit freshness policy. Product and
  compare pages use a database-wide offer summary, not the currently paginated
  browser subset.
- Recommendations are deterministic, versioned, and explainable. They cite
  accepted current claims and current offer observations. An LLM may later
  rewrite prose, but it is not the scoring or truth authority.
- Price alert delivery starts in-app. Alert events and delivery attempts are
  transport-neutral so email or webhook delivery can be added without changing
  price evaluation semantics. This preserves the existing email deferral.
- Public comparison links are immutable snapshots with revocable opaque share
  tokens. They do not expose account identity, private saved-set identifiers,
  or later private edits.
- Public writing requires authentication, ownership enforcement, bounded
  inputs, reporting, moderation state, and abuse controls before launch.
- SEO indexes only canonical public pages that meet content-quality and
  freshness thresholds.

## Architecture Boundaries

The existing contexts remain authoritative:

- `Catalog` owns canonical products, identities, media, saved sets, and public
  comparison snapshots.
- `Specs` owns attributes, claims, evidence, accepted current values, and
  correction moderation.
- `Pricing` owns merchants, offers, observations, freshness classification,
  and comparable landed-price summaries.
- `Ingestion` owns provider adapters, source artifacts, durable imports,
  identity resolution inputs, reconciliation, and run health.
- A new `Alerts` context owns watch rules, evaluation cursors, alert events,
  and delivery attempts.
- A new `Recommendations` context owns versioned deterministic decision
  profiles and evidence references.
- `Discussions` remains the authority for reviews, threads, posts, reports, and
  moderation.
- Browser-facing reads and writes use GraphQL. Public crawl infrastructure may
  use ordinary Phoenix `GET` routes for `robots.txt` and XML sitemaps.

## Cross-Cutting Safety

All new mutations use viewer identity from the Phoenix cookie-backed session;
no bearer token is returned to the browser. Public opaque IDs are entropy IDs
or signed share tokens, not relational IDs. Operator-only moderation and job
controls require existing operator access. Source artifacts remain redacted:
public GraphQL exposes safe source labels, URLs where publication is allowed,
observation timestamps, confidence, and short excerpts, never credentials,
provider queries, raw payloads, or tracking parameters.

## Success Measures

- Repeated listings with the same validated GTIN resolve to one canonical
  product; ambiguous candidates remain separate and reviewable.
- Every displayed specification can show its current claim, source, evidence,
  confidence, and last verification time.
- Every displayed offer shows item price, known shipping, stock, observed time,
  freshness state, and whether landed price is complete.
- Failed imports retry durably and are visible without relying on a process log.
- Alert evaluation is idempotent and cannot notify twice for the same crossing.
- Shared comparisons remain stable after the owner's live comparison changes.
- Recommendation reasons link to the exact claims and offer summaries used.
- Review and Q&A writes are attributable, reportable, and moderation-safe.
- Product, merchant, comparison, and category pages emit unique canonical
  metadata and valid structured data only when their underlying facts qualify.

## Explicit Non-Goals

- Automatic fuzzy product merges without a review step.
- Scraping sites that have not passed source, terms, robots, and owner review.
- Cross-currency price comparison without an explicit conversion source and
  observation timestamp.
- Guaranteeing taxes when a destination-specific tax quote is unavailable.
- Email delivery in the first alert milestone.
- Free-form AI recommendations that cannot cite deterministic inputs.
- Anonymous reviews, questions, answers, or corrections.
- Indexing thin, stale, private, or moderation-pending pages.

## Subproject Specifications

- `docs/superpowers/specs/2026-07-13-canonical-catalog-and-provenance-design.md`
- `docs/superpowers/specs/2026-07-13-offer-truth-and-durable-ingestion-design.md`
- `docs/superpowers/specs/2026-07-13-watchlists-sharing-and-recommendations-design.md`
- `docs/superpowers/specs/2026-07-13-community-and-merchant-trust-design.md`
- `docs/superpowers/specs/2026-07-13-seo-and-acquisition-design.md`
