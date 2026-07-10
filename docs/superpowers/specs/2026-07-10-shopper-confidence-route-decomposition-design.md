# Shopper Confidence Route Decomposition Design

## Context

PR #77 (`codex/shopper-decision-confidence`) added result guidance, removable
catalog filters, offer observation dates, product-detail price observation, and
visible-offer summaries. The feature behavior is verified, but the implementation
left duplicated offer-summary policy, expanded an already broad catalog filter
module, split result-status copy across components, and placed the shared
DateTime contract behind only large route tests.

This change will ship as a stacked PR from
`codex/shopper-confidence-route-decomposition`, based on
`codex/shopper-decision-confidence`. Its diff must contain only behavior-preserving
refactoring and focused characterization coverage for the shopper-confidence
slice.

## Goals

- Give offer snapshot aggregation one route-neutral implementation.
- Keep route-specific snapshot wording and merchant decoration at the rendering
  boundary.
- Separate catalog filter parsing from filter-summary and removal policy.
- Give one pure result-status policy ownership of count and empty-state copy.
- Give GraphQL DateTime parsing a small direct unit-test contract.
- Reuse the exported DateTime context type instead of duplicating it.
- Preserve all existing route output, link shapes, filtering, sorting, and
  fallback behavior.

## Non-goals

- Do not redesign the catalog, offer-discovery, or product-detail UI.
- Do not change GraphQL selections, generated Relay artifacts, backend code, or
  public browser routes.
- Do not decompose unrelated responsibilities from the full 700-800 line route
  modules.
- Do not change result-count, mixed-currency, coupon, missing-price, or timestamp
  wording.
- Do not add dependencies or introduce memoization for small page-local arrays.

## Architecture

### Shared offer snapshot policy

Create `assets/src/routes/offer-snapshot.ts` as a pure generic aggregator. It
will accept the route's existing visible offer array plus selectors for numeric
price, currency, and coupon availability:

```ts
export type OfferSnapshotSelectors<T> = {
  currency: (offer: T) => string | null;
  hasCoupons: (offer: T) => boolean;
  numericPrice: (offer: T) => number | null;
};

export type OfferSnapshotPriceState = "none" | "comparable" | "mixed";

export type OfferSnapshotSummary<T> = {
  couponAvailabilityCount: number;
  lowestPricedOffer: T | null;
  missingPriceCount: number;
  priceState: OfferSnapshotPriceState;
  visibleOfferCount: number;
};

export function buildOfferSnapshotSummary<T>(
  offers: readonly T[],
  selectors: OfferSnapshotSelectors<T>
): OfferSnapshotSummary<T>;
```

The implementation will use one loop. A route decides which rows have a
visible price before returning `numericPrice`, so the shared module does not
know about Relay data, merchant labels, or formatted price strings.

`offers/index.tsx` and `products/detail.tsx` will import this aggregator. Each
route will keep its existing snapshot component and convert the shared summary
to its existing wording:

- offer discovery retains `Not comparable across currencies` and its existing
  price formatting;
- product detail retains `Multiple currencies` and the merchant name in the
  lowest-price label.

The duplicated local snapshot summary types, min-price scans, and count loops
will be removed.

### Catalog filter summary and removal policy

Create `assets/src/routes/catalog/filter-summary.ts`. Move filter-summary label
construction out of `filters.ts` and represent removal intent explicitly:

```ts
export type CatalogFilterRemoval =
  | { kind: "query" }
  | { kind: "sort" }
  | { kind: "type" }
  | { kind: "useCase"; taxonId: string }
  | { kind: "numeric"; attributeId: string }
  | { kind: "boolean"; attributeId: string }
  | { kind: "enum"; attributeId: string };

export type CatalogFilterSummaryItem = {
  key: string;
  label: string;
  removal: CatalogFilterRemoval;
};

export function catalogFilterSummaryItems(
  metadata: CatalogFilterMetadata,
  filters: CatalogFilters
): CatalogFilterSummaryItem[];

export function catalogFiltersWithout(
  filters: CatalogFilters,
  removal: CatalogFilterRemoval
): CatalogFilters;
```

`filters.ts` will retain filter types, parsing, normalization, and sort-label
definitions. `filter-form.tsx` will call `catalogFiltersWithout` only when
building each removal link. This avoids storing a complete copied filter object
on every presentation item and makes removal behavior directly unit-testable.

### Catalog result-status policy

Create `assets/src/routes/catalog/result-status.ts` with a pure function:

```ts
export type CatalogResultStatus = {
  emptyMessage: string | null;
  guidance: string;
};

export function catalogResultStatus(input: {
  hasActiveFilters: boolean;
  hasVisibleProducts: boolean;
  resultCount: number;
}): CatalogResultStatus;
```

The returned strings will exactly match current output. `browse.tsx` will derive
the status once and render `guidance` where result guidance currently appears
and `emptyMessage` in the existing empty-result position. This preserves DOM
ordering while removing independent copy decisions. `CatalogResultGuidance`
will be removed from `filter-form.tsx`.

### DateTime contract and type reuse

Add `graphQLDateTimeLabel(value: unknown): string | null` beside
`graphQLDateTimeContext` in `assets/src/routes/graphql-datetime.ts`. The label
function will delegate to the context parser. Label-only consumers in both
routes will use it instead of local wrappers.

`products/detail.tsx` will import `GraphQLDateTimeContext` as a type and replace
the duplicate `PriceObservation` declaration. No DateTime acceptance rules will
change.

Create `assets/test/routes/graphql-datetime.test.ts` with table-driven coverage
for canonical UTC values, offsets, fractional seconds, leap dates, impossible
dates, non-canonical strings, and non-string values.

## Data flow

1. Relay route data remains unchanged.
2. Each route normalizes its visible offer rows as it does today.
3. The shared snapshot aggregator receives route rows and pure selectors.
4. The aggregator returns counts, price-state classification, and the original
   lowest-priced row.
5. Route renderers format their existing shopper-facing strings from that
   summary.

Catalog data follows the same separation:

1. `filters.ts` parses and normalizes filter state.
2. `filter-summary.ts` derives display items and typed removal intent.
3. `filter-form.tsx` applies removal intent and builds the existing first-page
   URL.
4. `result-status.ts` supplies the existing count and empty-state strings.

## Error and fallback behavior

The refactor adds no new runtime error states. Unknown or malformed DateTime
values continue to return `null`; invalid offer URLs continue to remove rows
before snapshot aggregation; missing prices and mixed currencies continue to
use their current route-specific fallback strings. Catalog removal continues to
reset pagination and preserve page size plus compare slugs.

## Testing strategy

Implementation will proceed test-first:

1. Add failing unit tests for the new shared offer-snapshot API, including empty,
   single-currency, mixed-currency, coupon, and missing-price cases.
2. Add failing unit tests for typed catalog removal and result-status policy.
3. Add failing tests for the new `graphQLDateTimeLabel` API and its direct
   DateTime matrix.
4. Move route implementations to the new modules without changing existing
   route assertions.
5. Run the focused catalog, offers, product-detail, and new pure-module suites.
6. Run `bun run check` from `assets/` and `git diff --check` from the repository
   root.

## Stacked PR boundary

The stacked PR will target `codex/shopper-decision-confidence`, not `main`, so
reviewers see only the decomposition. After PR #77 merges, the branch will be
rebased onto `main` and the stacked PR base will be retargeted. If decomposition
expands beyond the touched shopper-confidence sections described here, that
additional work must move to a separate follow-up stack rather than widening
this PR.
