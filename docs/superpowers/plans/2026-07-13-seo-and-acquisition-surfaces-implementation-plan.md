# SEO And Acquisition Surfaces Implementation Plan

**Goal:** Make trustworthy Product Compare knowledge discoverable without
indexing thin, stale, duplicate, personalized, or implicitly private pages.

**Design:**
`docs/superpowers/specs/2026-07-13-seo-and-acquisition-design.md`

## Safety Contract

- Server-rendered route metadata is data-driven and emits a unique title,
  description, absolute canonical URL, robots policy, social fields, and typed
  JSON-LD from the same public facts shown on the page.
- Product pages qualify only with useful accepted specification content and
  public offer evidence. Offer and rating structured data is omitted unless its
  complete public facts qualify independently.
- Merchant pages qualify only with current active inventory and offer evidence.
  Organization data contains factual public identity fields only.
- Public comparison snapshots remain `noindex` unless an authenticated owner
  explicitly opts that immutable version into search discovery at publication;
  revocation removes the public read and sitemap entry.
- Category pages use curated type-taxonomy metadata and real qualifying product
  inventory. Thin or empty categories remain `noindex` and out of sitemaps.
- Phoenix robots and sitemap responses are deterministic, bounded, cacheable,
  and include canonical qualified URLs only. Search/filter/cursor/account,
  ingestion, and operator permutations are excluded.

## Owned Paths

- taxonomy and comparison-snapshot SEO migrations, schemas, contexts, and tests
- public GraphQL SEO/category fields, resolvers, schema snapshot, and tests
- product, merchant, category, and shared-comparison route metadata and tests
- snapshot publish controls and generated Relay artifacts
- Phoenix robots/sitemap controllers, router, configuration, and tests
- `docs/work/product-trust-and-discovery.md` and `docs/work/index.md`

## Verification

- RED/GREEN tests for qualification, explicit snapshot indexing, revocation,
  category inventory, robots, deterministic sitemap ordering, and URL escaping.
- SSR and client route tests for canonical/noindex decisions, social metadata,
  JSON-LD escaping, and factual offer/rating omission.
- Relay, TypeScript, production client/SSR builds, bundle contract, backend
  schema/global-ID regressions, type/format gates, queue validation, full CI,
  and diff hygiene.
