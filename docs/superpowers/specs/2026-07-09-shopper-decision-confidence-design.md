# Shopper Decision Confidence Design

## Goal

Restore the live dispatch slate with four source-backed shopper-facing tasks
that make catalog and offer decisions easier to understand without reopening
deferred ingestion, eBay, operator, credential, application, scraping, or CSV
export work.

## Product Decision

The next batch optimizes shopper decision confidence using data the current app
already exposes. It favors clear result context, exact observation dates,
coupon validity, and explicitly page-local offer summaries over new provider
integrations or speculative ranking rules.

Two alternatives were considered and rejected for this batch:

- Global price ranking would require a product decision for mixed-currency
  ordering and a wider backend pagination contract.
- Navigation-only polish would be low risk, but recent batches already added
  search, sorting, facets, compare selection, selected-product context, merchant
  quick filters, and tracked outbound actions.

## Verified Current State

- `/products` already receives `productFilterMetadata.resultCount`, but does not
  show the count and only offers one all-or-nothing `Clear filters` action.
- `/offers` already queries `latestPrice.observedAt` and coupon `validTo`, but
  does not render those dates.
- The backend `MerchantProduct` GraphQL type already exposes nullable
  `lastSeenAt`; the checked-in frontend schema snapshot does not yet include it.
- `/offers` renders price, coupon, merchant, and price-history data but has no
  compact visible-page decision summary.
- `/products/:slug` renders latest prices but its offer query does not select
  `latestPrice.observedAt`.
- `/compare` already exposes best current price, offer count, coupon signal,
  price recency, and offer-review links, so it does not need another row in this
  batch.

## Queue Design

### 1. Catalog Result Guidance And Removable Filters

Show the metadata-backed matching-product count and turn every active filter
summary item into a removal link. Removing one item preserves the remaining
filters, page size, and selected comparison slugs while dropping any stale
pagination cursor.

Removal behavior is explicit:

- search removal clears only `q`;
- sort removal restores the default catalog order;
- product-type removal also clears the descendant flag;
- one use-case removal leaves other use cases selected;
- numeric removal clears both bounds for that attribute;
- boolean and enum removal clear only their matching attribute.

The result count describes the complete filtered result set from
`productFilterMetadata.resultCount`, not merely the currently loaded page.

Owned product paths:

- `assets/src/routes/catalog/filters.ts`
- `assets/src/routes/catalog/paths.ts`
- `assets/src/routes/catalog/filter-form.tsx`
- `assets/src/routes/catalog/browse.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `docs/work/frontend-catalog-browse.md`

### 2. Offer Observation And Coupon Validity Context

Refresh the frontend schema snapshot for the existing
`MerchantProduct.lastSeenAt` field, select it in the offer-discovery query, and
render trustworthy date context for each visible offer:

- `Offer checked` from `lastSeenAt` when present;
- `Price observed` from `latestPrice.observedAt` when present;
- `Valid through` from coupon `validTo` when present.

Dates use semantic `<time dateTime="...">` markup and the repository's existing
calendar-date formatting. Missing or malformed timestamps do not produce a
freshness claim. The UI does not introduce arbitrary fresh/stale thresholds.

Owned product paths:

- `assets/schema.graphql`
- `assets/src/routes/offers/queries/OfferDiscoveryRouteQuery.ts`
- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `assets/src/__generated__/OfferDiscoveryRouteQuery.graphql.ts`
- `docs/work/frontend-offer-discovery-demo-parity.md`

### 3. Product-Detail Price Observation Context

Select `latestPrice.observedAt` in the product-offers query and render the
observation date beside each visible latest price. Offers without a usable
timestamp continue to render their price without an unsupported date claim.
This row does not depend on the `MerchantProduct.lastSeenAt` snapshot refresh.

Owned product paths:

- `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`
- `docs/work/frontend-product-detail.md`

### 4. Visible Offer Snapshot

Add an explicitly page-local summary to `/offers` using only renderable offer
rows already loaded by the route:

- visible offer count;
- lowest visible comparable price;
- visible offers with coupon availability;
- visible offers missing a latest price.

The lowest-price value is shown only when visible priced offers use one
currency. Mixed-currency pages state that prices are not comparable instead of
selecting a misleading winner. Unsafe offer URLs remain excluded by the
existing renderability gate, so the summary matches the rows the shopper can
actually use.

Owned product paths:

- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `docs/work/frontend-offer-discovery-demo-parity.md`

## Dispatch And Ordering

All four rows are independently useful and may be promoted as `ready` together.
Catalog result guidance, product-detail observation context, and one `/offers`
row can execute in parallel because their owned product paths and lane docs do
not overlap. The two `/offers` rows both own the offer route and its work doc,
so they must execute serially; the lower-ranked one remains `ready` while the
higher-ranked one is active and conflicting.

Recommended queue order:

1. catalog result guidance and removable filters;
2. offer observation and coupon validity context;
3. product-detail price observation context;
4. visible offer snapshot.

## Data Flow And Boundaries

- Catalog result guidance stays frontend-only and derives links from normalized
  route filter state plus existing metadata.
- Offer freshness uses the existing backend GraphQL field and current price and
  coupon fields; no new resolver, database query, or ingestion behavior is
  required.
- Product-detail observation context extends only its existing Relay selection.
- The visible offer snapshot is computed after the current safe-URL gate and
  before rendering, with no extra request or persisted state.
- Phoenix GraphQL and Relay remain the browser data contract.

## Failure And Fallback Behavior

- Missing dates omit date-specific claims while retaining the underlying offer,
  price, or coupon content.
- Invalid date strings do not render misleading formatted values.
- Mixed currencies suppress the lowest-price claim while retaining counts.
- Removing a catalog filter never preserves a stale `after` cursor.
- Compare selections survive catalog filter removal.
- Existing route loading, error, empty, and query-unavailable fallbacks remain
  intact.

## Verification Strategy

Each row follows a focused red-green route-test loop and ends with the checks
appropriate to its paths:

- catalog browse Vitest coverage for result-count wording, every removal shape,
  preserved page size and comparison slugs, and cursor removal;
- offer-discovery Vitest coverage for present, missing, and malformed dates,
  coupon validity, page-local counts, missing prices, and mixed currencies;
- product-detail Vitest coverage for observed and missing price timestamps;
- Relay generation for both query-selection rows;
- frontend TypeScript verification;
- `git diff --check`.

## Non-Goals

- Do not add global offer price sorting or call page-local ordering global.
- Do not compare numeric prices across currencies.
- Do not invent freshness thresholds or labels such as fresh, aging, or stale.
- Do not add provider, ingestion, eBay, operator, credential, application,
  scraping, or CSV export behavior.
- Do not change commerce-click tracking or accept raw merchant destinations
  from the browser.
- Do not reopen completed compare or saved-comparison work solely to increase
  queue depth.
