# Shopper Confidence Route Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicated shopper-confidence route policy with focused, directly tested shared modules without changing existing UI output or browser behavior.

**Architecture:** Add pure route-neutral modules for offer snapshot aggregation, catalog filter summary/removal, and catalog result-status policy. Keep Relay adaptation and route-specific copy at the route boundary, and expose a shared DateTime label helper plus its existing context type.

**Tech Stack:** TypeScript, React 19, React Router, Relay, Vitest, Testing Library, Bun.

## Global Constraints

- Base the stacked work on `codex/shopper-decision-confidence`; do not include unrelated `main` changes.
- Preserve all existing route output, link shapes, filtering, sorting, and fallback behavior.
- Do not change GraphQL selections, generated Relay artifacts, backend code, public browser routes, or dependencies.
- Do not decompose unrelated responsibilities from the complete catalog, offer-discovery, or product-detail routes.
- Keep offer aggregation single-pass and route-neutral; keep route-specific wording at the rendering boundary.
- Keep tests under `assets/test/**`.
- Use no browser tooling.

---

### Task 1: Shared Offer Snapshot Aggregation

**Files:**
- Create: `assets/src/routes/offer-snapshot.ts`
- Create: `assets/test/routes/offer-snapshot.test.ts`
- Modify: `assets/src/routes/offers/index.tsx:39-59,147-289`
- Modify: `assets/src/routes/products/detail.tsx:361-459`
- Modify: `docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md`

**Interfaces:**
- Consumes: route-owned visible offer arrays and selector callbacks for currency, coupon availability, and numeric price.
- Produces: `OfferSnapshotSelectors<T>`, `OfferSnapshotPriceState`, `OfferSnapshotSummary<T>`, and `buildOfferSnapshotSummary<T>()` from `assets/src/routes/offer-snapshot.ts`.

- [x] **Step 1: Write the failing shared-aggregator tests**

Create `assets/test/routes/offer-snapshot.test.ts`:

```ts
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors
} from "../../src/routes/offer-snapshot";

type TestOffer = {
  currency: string | null;
  hasCoupons: boolean;
  id: string;
  price: number | null;
};

const selectors: OfferSnapshotSelectors<TestOffer> = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.hasCoupons,
  numericPrice: (offer) => offer.price
};

test("summarizes an empty offer page", () => {
  expect(buildOfferSnapshotSummary([], selectors)).toEqual({
    couponAvailabilityCount: 0,
    lowestPricedOffer: null,
    missingPriceCount: 0,
    priceState: "none",
    visibleOfferCount: 0
  });
});

test("summarizes comparable offers in one pass", () => {
  const expensive = { id: "expensive", currency: "USD", price: 20, hasCoupons: true };
  const budget = { id: "budget", currency: "USD", price: 10, hasCoupons: false };
  const missing = { id: "missing", currency: null, price: null, hasCoupons: true };

  expect(buildOfferSnapshotSummary([expensive, budget, missing], selectors)).toEqual({
    couponAvailabilityCount: 2,
    lowestPricedOffer: budget,
    missingPriceCount: 1,
    priceState: "comparable",
    visibleOfferCount: 3
  });
});

test("refuses comparison across visible currencies", () => {
  const usd = { id: "usd", currency: "USD", price: 20, hasCoupons: false };
  const eur = { id: "eur", currency: "EUR", price: 10, hasCoupons: false };

  expect(buildOfferSnapshotSummary([usd, eur], selectors)).toMatchObject({
    lowestPricedOffer: eur,
    priceState: "mixed"
  });
});
```

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
cd assets
bun run test -- test/routes/offer-snapshot.test.ts
```

Expected: FAIL because `../../src/routes/offer-snapshot` does not exist.

- [x] **Step 3: Implement the pure aggregator**

Create `assets/src/routes/offer-snapshot.ts`:

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
): OfferSnapshotSummary<T> {
  let couponAvailabilityCount = 0;
  let lowestPrice: number | null = null;
  let lowestPricedOffer: T | null = null;
  let missingPriceCount = 0;
  const currencies = new Set<string | null>();

  for (const offer of offers) {
    if (selectors.hasCoupons(offer)) {
      couponAvailabilityCount += 1;
    }

    const numericPrice = selectors.numericPrice(offer);

    if (numericPrice === null) {
      missingPriceCount += 1;
      continue;
    }

    currencies.add(selectors.currency(offer));

    if (lowestPrice === null || numericPrice < lowestPrice) {
      lowestPrice = numericPrice;
      lowestPricedOffer = offer;
    }
  }

  return {
    couponAvailabilityCount,
    lowestPricedOffer,
    missingPriceCount,
    priceState:
      lowestPricedOffer === null ? "none" : currencies.size > 1 ? "mixed" : "comparable",
    visibleOfferCount: offers.length
  };
}
```

- [x] **Step 4: Run the pure test to verify GREEN**

Run:

```bash
cd assets
bun run test -- test/routes/offer-snapshot.test.ts
```

Expected: PASS with 3 tests.

- [x] **Step 5: Migrate offer discovery to the shared summary**

In `assets/src/routes/offers/index.tsx`, import the shared API:

```ts
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors,
  type OfferSnapshotSummary
} from "../offer-snapshot";
```

Define selectors beside `RenderableOffer`:

```ts
const OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<RenderableOffer> = {
  currency: (offer) => offer.latestPriceCurrency,
  hasCoupons: hasVisibleCoupons,
  numericPrice: (offer) => offer.latestPriceValue
};
```

Change `OfferDiscoveryList` to call:

```tsx
<VisibleOfferSnapshot
  summary={buildOfferSnapshotSummary(offers, OFFER_SNAPSHOT_SELECTORS)}
/>
```

Type the component and keep its existing copy:

```ts
function VisibleOfferSnapshot({
  summary
}: {
  summary: OfferSnapshotSummary<RenderableOffer>;
}) {
  return (
    <section aria-label="Visible offer snapshot">
      <h2>Visible offer snapshot</h2>
      <dl>
        <div>
          <dt>Visible offers on this page</dt>
          <dd>{summary.visibleOfferCount}</dd>
        </div>
        <div>
          <dt>Lowest visible price</dt>
          <dd>{visibleLowestPriceLabel(summary)}</dd>
        </div>
        <div>
          <dt>Visible coupon availability</dt>
          <dd>{formatCouponAvailabilityCount(summary.couponAvailabilityCount)}</dd>
        </div>
        <div>
          <dt>Missing latest price</dt>
          <dd>{formatOfferCount(summary.missingPriceCount)}</dd>
        </div>
      </dl>
    </section>
  );
}

function visibleLowestPriceLabel(summary: OfferSnapshotSummary<RenderableOffer>) {
  if (summary.priceState === "mixed") {
    return "Not comparable across currencies";
  }

  const lowestPricedOffer = summary.lowestPricedOffer;

  return lowestPricedOffer
    ? priceLabel(
        lowestPricedOffer.offer.latestPrice?.price,
        lowestPricedOffer.offer.currency
      )
    : "No visible prices";
}
```

Delete `VisibleOfferSnapshotSummary`, `PricedRenderableOffer`,
`buildVisibleOfferSnapshot`, `hasLatestPrice`, `lowerPricedOffer`, and
`comparableLowestPriceText`. Keep `hasVisibleCoupons` because the selector uses
it.

- [x] **Step 6: Migrate product detail to the shared summary**

In `assets/src/routes/products/detail.tsx`, import the shared API:

```ts
import {
  buildOfferSnapshotSummary,
  type OfferSnapshotSelectors,
  type OfferSnapshotSummary
} from "../offer-snapshot";
```

Define selectors after `VisibleProductOffer`:

```ts
const PRODUCT_OFFER_SNAPSHOT_SELECTORS: OfferSnapshotSelectors<VisibleProductOffer> = {
  currency: (offer) => offer.currency,
  hasCoupons: (offer) => offer.coupons.length > 0 || offer.couponsHasMore,
  numericPrice: (offer) => (hasVisiblePrice(offer) ? offer.numericPrice : null)
};
```

Replace the local builder call:

```tsx
<OfferSnapshot
  summary={buildOfferSnapshotSummary(offers, PRODUCT_OFFER_SNAPSHOT_SELECTORS)}
/>
```

Type and render the shared summary:

```ts
function OfferSnapshot({
  summary
}: {
  summary: OfferSnapshotSummary<VisibleProductOffer>;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId}>Offer snapshot</h3>
      <dl>
        <div>
          <dt>Visible active offers</dt>
          <dd>{summary.visibleOfferCount}</dd>
        </div>
        <div>
          <dt>Lowest visible price</dt>
          <dd>{lowestVisiblePriceText(summary) ?? "No visible prices"}</dd>
        </div>
        <div>
          <dt>Coupon availability</dt>
          <dd>{formatCouponAvailabilityCount(summary.couponAvailabilityCount)}</dd>
        </div>
        <div>
          <dt>Missing latest price</dt>
          <dd>{formatOfferCount(summary.missingPriceCount)}</dd>
        </div>
      </dl>
    </section>
  );
}

function lowestVisiblePriceText(summary: OfferSnapshotSummary<VisibleProductOffer>) {
  if (summary.priceState === "mixed") {
    return "Multiple currencies";
  }

  const lowestPricedOffer = summary.lowestPricedOffer;

  return lowestPricedOffer?.priceText
    ? `${lowestPricedOffer.priceText} at ${lowestPricedOffer.merchantName}`
    : null;
}
```

Delete `OfferSnapshotSummary`, `buildOfferSnapshotSummary`, and the old
two-argument `lowestVisiblePriceText`. Keep `hasVisiblePrice`; the selector uses
it. Delete `canComparePrices` because the shared aggregator replaces both of
its current callers.

- [x] **Step 7: Verify both route integrations**

Run:

```bash
cd assets
bun run test -- test/routes/offer-snapshot.test.ts test/routes/offers/offer-discovery.route.test.tsx test/routes/products/detail.route.test.tsx
bun run typecheck
```

Expected: PASS with the pure suite plus all offer-discovery and product-detail
route tests; TypeScript exits 0.

- [x] **Step 8: Mark Task 1 complete and commit**

Check Task 1 boxes in this plan, then run:

```bash
git add assets/src/routes/offer-snapshot.ts assets/src/routes/offers/index.tsx assets/src/routes/products/detail.tsx assets/test/routes/offer-snapshot.test.ts docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md
git commit -m "refactor: share offer snapshot policy"
```

Expected: one behavior-preserving shared-offer-policy commit.

---

### Task 2: Catalog Filter Summary and Removal Module

**Files:**
- Create: `assets/src/routes/catalog/filter-summary.ts`
- Create: `assets/test/routes/catalog/filter-summary.test.ts`
- Modify: `assets/src/routes/catalog/filters.ts:39-68,390-577`
- Modify: `assets/src/routes/catalog/filter-form.tsx:1-15,402-443`
- Modify: `docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md`

**Interfaces:**
- Consumes: `CatalogFilters`, `CatalogFilterMetadata`, and `catalogProductSortLabel` from `filters.ts`.
- Produces: `CatalogFilterRemoval`, `CatalogFilterSummaryItem`, `catalogFilterSummaryItems()`, and `catalogFiltersWithout()` from `filter-summary.ts`.

- [x] **Step 1: Write failing summary/removal tests**

Create `assets/test/routes/catalog/filter-summary.test.ts`:

```ts
import {
  catalogFiltersWithout,
  catalogFilterSummaryItems,
  type CatalogFilterRemoval
} from "../../../src/routes/catalog/filter-summary";
import type {
  CatalogFilterMetadata,
  CatalogFilters
} from "../../../src/routes/catalog/filters";

const filters: CatalogFilters = {
  query: "monitor",
  sort: "NEWEST",
  typeTaxonId: "type-1",
  includeTypeDescendants: true,
  useCaseTaxonIds: ["use-1", "use-2"],
  numeric: [{ attributeId: "refresh", min: "120" }],
  booleans: [{ attributeId: "hdr", value: true }],
  enums: [{ attributeId: "panel", enumOptionId: "oled" }]
};

const metadata: CatalogFilterMetadata = {
  typeOptions: [{ id: "type-1", label: "Monitors", selected: true }],
  useCaseOptions: [
    { id: "use-1", label: "Gaming", selected: true },
    { id: "use-2", label: "Work", selected: true }
  ],
  numericFilters: [
    {
      attributeId: "refresh",
      displayName: "Refresh rate",
      selectedMin: "120",
      selectedMax: null,
      unitSymbol: "Hz"
    }
  ],
  booleanFilters: [
    { attributeId: "hdr", displayName: "HDR", selectedValue: true }
  ],
  enumFilters: [
    {
      attributeId: "panel",
      displayName: "Panel",
      options: [{ id: "oled", label: "OLED", selected: true }]
    }
  ]
};

test("builds labels with typed removal intent", () => {
  expect(catalogFilterSummaryItems(metadata, filters)).toEqual(
    expect.arrayContaining([
      { key: "query", label: 'Search: "monitor"', removal: { kind: "query" } },
      { key: "sort", label: "Sort: Newest", removal: { kind: "sort" } },
      {
        key: "type",
        label: "Type: Monitors and descendants",
        removal: { kind: "type" } as const
      },
      {
        key: "use-case:use-1",
        label: "Use case: Gaming",
        removal: { kind: "useCase", taxonId: "use-1" }
      },
      {
        key: "numeric:refresh",
        label: "Refresh rate: at least 120 Hz",
        removal: { kind: "numeric", attributeId: "refresh" }
      }
    ])
  );
});

test.each<[CatalogFilterRemoval, Partial<CatalogFilters>]>([
  [{ kind: "query" }, { query: undefined }],
  [{ kind: "sort" }, { sort: undefined }],
  [{ kind: "type" }, { typeTaxonId: undefined, includeTypeDescendants: undefined }],
  [{ kind: "useCase", taxonId: "use-1" }, { useCaseTaxonIds: ["use-2"] }],
  [{ kind: "numeric", attributeId: "refresh" }, { numeric: [] }],
  [{ kind: "boolean", attributeId: "hdr" }, { booleans: [] }],
  [{ kind: "enum", attributeId: "panel" }, { enums: [] }]
])("applies removal intent %#", (removal, expected) => {
  expect(catalogFiltersWithout(filters, removal)).toMatchObject(expected);
});
```

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
cd assets
bun run test -- test/routes/catalog/filter-summary.test.ts
```

Expected: FAIL because `catalog/filter-summary.ts` does not exist.

- [x] **Step 3: Implement typed removal policy**

Create `assets/src/routes/catalog/filter-summary.ts` using the complete exports,
removal implementation, and label helpers below:

```ts
import {
  catalogProductSortLabel,
  type CatalogFilterMetadata,
  type CatalogFilters
} from "./filters";

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

export function catalogFiltersWithout(
  filters: CatalogFilters,
  removal: CatalogFilterRemoval
): CatalogFilters {
  const copied = copyCatalogFilters(filters);

  switch (removal.kind) {
    case "query":
      return { ...copied, query: undefined };
    case "sort":
      return { ...copied, sort: undefined };
    case "type":
      return {
        ...copied,
        typeTaxonId: undefined,
        includeTypeDescendants: undefined
      };
    case "useCase":
      return {
        ...copied,
        useCaseTaxonIds: copied.useCaseTaxonIds.filter(
          (taxonId) => taxonId !== removal.taxonId
        )
      };
    case "numeric":
      return {
        ...copied,
        numeric: copied.numeric.filter(
          (filter) => filter.attributeId !== removal.attributeId
        )
      };
    case "boolean":
      return {
        ...copied,
        booleans: copied.booleans.filter(
          (filter) => filter.attributeId !== removal.attributeId
        )
      };
    case "enum":
      return {
        ...copied,
        enums: copied.enums.filter(
          (filter) => filter.attributeId !== removal.attributeId
        )
      };
  }
}

function copyCatalogFilters(filters: CatalogFilters): CatalogFilters {
  return {
    ...filters,
    useCaseTaxonIds: [...filters.useCaseTaxonIds],
    numeric: [...filters.numeric],
    booleans: [...filters.booleans],
    enums: [...filters.enums]
  };
}
```

Implement `catalogFilterSummaryItems()` by preserving every existing label and
replacing `remainingFilters` with these exact removal values:

```ts
export function catalogFilterSummaryItems(
  metadata: CatalogFilterMetadata,
  filters: CatalogFilters
): CatalogFilterSummaryItem[] {
  return [
    ...(filters.query
      ? [{ key: "query", label: `Search: "${filters.query}"`, removal: { kind: "query" } as const }]
      : []),
    ...(filters.sort
      ? [{
          key: "sort",
          label: `Sort: ${catalogProductSortLabel(filters.sort)}`,
          removal: { kind: "sort" } as const
        }]
      : []),
    ...typeFilterSummaryItems(metadata, filters),
    ...selectedUseCaseSummaryItems(metadata),
    ...numericFilterSummaryItems(metadata),
    ...booleanFilterSummaryItems(metadata),
    ...enumFilterSummaryItems(metadata)
  ];
}

function typeFilterSummaryItems(
  metadata: CatalogFilterMetadata,
  filters: CatalogFilters
): CatalogFilterSummaryItem[] {
  const selectedType = metadata.typeOptions.find((option) => option.selected);

  return selectedType
    ? [{
        key: "type",
        label: filters.includeTypeDescendants
          ? `Type: ${selectedType.label} and descendants`
          : `Type: ${selectedType.label}`,
        removal: { kind: "type" }
      }]
    : [];
}

function selectedUseCaseSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.useCaseOptions
    .filter((option) => option.selected)
    .map((option) => ({
      key: `use-case:${option.id}`,
      label: `Use case: ${option.label}`,
      removal: { kind: "useCase", taxonId: option.id } as const
    }));
}

function numericFilterSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.numericFilters.flatMap((filter) => {
    const summary = numericFilterSummary(filter);

    return summary
      ? [{
          key: `numeric:${filter.attributeId}`,
          label: `${filter.displayName}: ${summary}`,
          removal: { kind: "numeric", attributeId: filter.attributeId } as const
        }]
      : [];
  });
}

function booleanFilterSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.booleanFilters.flatMap((filter) =>
    typeof filter.selectedValue === "boolean"
      ? [{
          key: `boolean:${filter.attributeId}`,
          label: `${filter.displayName}: ${filter.selectedValue ? "Yes" : "No"}`,
          removal: { kind: "boolean", attributeId: filter.attributeId } as const
        }]
      : []
  );
}

function enumFilterSummaryItems(
  metadata: CatalogFilterMetadata
): CatalogFilterSummaryItem[] {
  return metadata.enumFilters.flatMap((filter) =>
    filter.options
      .filter((option) => option.selected)
      .map((option) => ({
        key: `enum:${filter.attributeId}:${option.id}`,
        label: `${filter.displayName}: ${option.label}`,
        removal: { kind: "enum", attributeId: filter.attributeId } as const
      }))
  );
}

function numericFilterSummary(
  filter: CatalogFilterMetadata["numericFilters"][number]
) {
  const min = formatNumericValue(filter.selectedMin, filter.unitSymbol);
  const max = formatNumericValue(filter.selectedMax, filter.unitSymbol);

  if (min && max) return `${min} to ${max}`;
  if (min) return `at least ${min}`;
  if (max) return `up to ${max}`;
  return null;
}

function formatNumericValue(
  value: string | null | undefined,
  unitSymbol: string | null | undefined
) {
  if (!value) return null;
  return unitSymbol ? `${value} ${unitSymbol}` : value;
}
```

- [x] **Step 4: Verify the pure catalog test is GREEN**

Run:

```bash
cd assets
bun run test -- test/routes/catalog/filter-summary.test.ts
```

Expected: PASS with 8 tests.

- [x] **Step 5: Migrate the catalog filter component**

In `assets/src/routes/catalog/filter-form.tsx`, import from the new module:

```ts
import {
  catalogFiltersWithout,
  catalogFilterSummaryItems
} from "./filter-summary";
```

Build each link with typed removal intent:

```tsx
<ul aria-label="Active filters">
  {summaryItems.map((item) => (
    <li key={item.key}>
      <Link
        to={catalogBrowseFirstPagePath(
          catalogFiltersWithout(filters, item.removal),
          pageSize,
          compareSlugs
        )}
      >
        Remove {item.label}
      </Link>
    </li>
  ))}
</ul>
```

Keep the early return for zero summary items and remove the now-redundant
`summaryItems.length > 0` JSX conditional. Delete the summary item type and all
summary/removal helper implementations from `filters.ts`.

- [x] **Step 6: Verify catalog integration**

Run:

```bash
cd assets
bun run test -- test/routes/catalog/filter-summary.test.ts test/routes/catalog/browse.route.test.tsx
bun run typecheck
```

Expected: PASS with the pure summary suite plus the complete catalog route
suite; TypeScript exits 0.

- [x] **Step 7: Mark Task 2 complete and commit**

Check Task 2 boxes in this plan, then run:

```bash
git add assets/src/routes/catalog/filter-summary.ts assets/src/routes/catalog/filters.ts assets/src/routes/catalog/filter-form.tsx assets/test/routes/catalog/filter-summary.test.ts docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md
git commit -m "refactor: separate catalog filter summaries"
```

Expected: one catalog summary/removal boundary commit.

---

### Task 3: Catalog Result-Status Policy

**Files:**
- Create: `assets/src/routes/catalog/result-status.ts`
- Create: `assets/test/routes/catalog/result-status.test.ts`
- Modify: `assets/src/routes/catalog/browse.tsx:20-30,107-206`
- Modify: `assets/src/routes/catalog/filter-form.tsx:445-451`
- Modify: `docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md`

**Interfaces:**
- Consumes: result count, active-filter state, and whether any product rows are visible.
- Produces: `CatalogResultStatus` and `catalogResultStatus()` from `result-status.ts`.

- [x] **Step 1: Write the failing result-status tests**

Create `assets/test/routes/catalog/result-status.test.ts`:

```ts
import { catalogResultStatus } from "../../../src/routes/catalog/result-status";

test.each([
  {
    input: { hasActiveFilters: false, hasVisibleProducts: false, resultCount: 0 },
    expected: { guidance: "No matching products", emptyMessage: "No products available yet." }
  },
  {
    input: { hasActiveFilters: true, hasVisibleProducts: false, resultCount: 0 },
    expected: {
      guidance: "No matching products",
      emptyMessage: "No products match these filters."
    }
  },
  {
    input: { hasActiveFilters: true, hasVisibleProducts: false, resultCount: 3 },
    expected: {
      guidance: "3 matching products",
      emptyMessage: "No products available yet."
    }
  },
  {
    input: { hasActiveFilters: true, hasVisibleProducts: true, resultCount: 1 },
    expected: { guidance: "1 matching product", emptyMessage: null }
  },
  {
    input: { hasActiveFilters: false, hasVisibleProducts: true, resultCount: 3 },
    expected: { guidance: "3 matching products", emptyMessage: null }
  }
])("derives catalog result status for %#", ({ input, expected }) => {
  expect(catalogResultStatus(input)).toEqual(expected);
});
```

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
cd assets
bun run test -- test/routes/catalog/result-status.test.ts
```

Expected: FAIL because `catalog/result-status.ts` does not exist.

- [x] **Step 3: Implement the result-status policy**

Create `assets/src/routes/catalog/result-status.ts`:

```ts
export type CatalogResultStatus = {
  emptyMessage: string | null;
  guidance: string;
};

export function catalogResultStatus({
  hasActiveFilters,
  hasVisibleProducts,
  resultCount
}: {
  hasActiveFilters: boolean;
  hasVisibleProducts: boolean;
  resultCount: number;
}): CatalogResultStatus {
  return {
    emptyMessage: catalogEmptyMessage(
      hasActiveFilters,
      hasVisibleProducts,
      resultCount
    ),
    guidance: catalogResultGuidance(resultCount)
  };
}

function catalogResultGuidance(resultCount: number) {
  if (resultCount <= 0) {
    return "No matching products";
  }

  return resultCount === 1 ? "1 matching product" : `${resultCount} matching products`;
}

function catalogEmptyMessage(
  hasActiveFilters: boolean,
  hasVisibleProducts: boolean,
  resultCount: number
) {
  if (hasVisibleProducts) {
    return null;
  }

  return hasActiveFilters && resultCount <= 0
    ? "No products match these filters."
    : "No products available yet.";
}
```

- [x] **Step 4: Verify the pure result-status test is GREEN**

Run:

```bash
cd assets
bun run test -- test/routes/catalog/result-status.test.ts
```

Expected: PASS with 5 cases.

- [x] **Step 5: Migrate browse rendering without changing DOM order**

In `assets/src/routes/catalog/browse.tsx`, import `catalogResultStatus`, remove
`CatalogResultGuidance`, and derive the status once:

```ts
const resultStatus = catalogResultStatus({
  hasActiveFilters,
  hasVisibleProducts: products.length > 0,
  resultCount: filterMetadata.resultCount
});
```

Render existing positions from the shared policy:

```tsx
const filterControls = (
  <>
    <p>{resultStatus.guidance}</p>
    <CatalogFilterForm
      compareSlugs={selectedCompareSlugs}
      key={filterFormKey}
      filters={activeFilters}
      metadata={filterMetadata}
      pageSize={currentPageSize}
    />
    <CatalogActiveFilterSummary
      compareSlugs={selectedCompareSlugs}
      filters={activeFilters}
      metadata={filterMetadata}
      pageSize={currentPageSize}
    />
  </>
);

if (products.length === 0) {
  return (
    <section>
      {selectionTray}
      {filterControls}
      {resultStatus.emptyMessage ? <p>{resultStatus.emptyMessage}</p> : null}
      {paginationLinks}
    </section>
  );
}
```

Delete `CatalogResultGuidance` from `filter-form.tsx` and remove
`hasFilteredEmptyState` from `browse.tsx`.

- [x] **Step 6: Verify catalog status integration**

Run:

```bash
cd assets
bun run test -- test/routes/catalog/result-status.test.ts test/routes/catalog/browse.route.test.tsx
bun run typecheck
```

Expected: PASS with existing result-count and empty-state wording unchanged;
TypeScript exits 0.

- [x] **Step 7: Mark Task 3 complete and commit**

Check Task 3 boxes in this plan, then run:

```bash
git add assets/src/routes/catalog/result-status.ts assets/src/routes/catalog/browse.tsx assets/src/routes/catalog/filter-form.tsx assets/test/routes/catalog/result-status.test.ts docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md
git commit -m "refactor: centralize catalog result status"
```

Expected: one result-status policy commit.

---

### Task 4: Direct DateTime Contract and Type Reuse

**Files:**
- Create: `assets/test/routes/graphql-datetime.test.ts`
- Modify: `assets/src/routes/graphql-datetime.ts:1-113`
- Modify: `assets/src/routes/offers/index.tsx:9-15,805-833`
- Modify: `assets/src/routes/products/detail.tsx:20-27,375-378,600-690`
- Modify: `docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md`

**Interfaces:**
- Consumes: existing `graphQLDateTimeContext()` and `GraphQLDateTimeContext`.
- Produces: `graphQLDateTimeLabel()` for label-only consumers and a direct table-driven parser contract.

- [x] **Step 1: Write the failing direct DateTime tests**

Create `assets/test/routes/graphql-datetime.test.ts`:

```ts
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel
} from "../../src/routes/graphql-datetime";

test.each([
  ["2026-06-01T00:00:00Z", "2026-06-01"],
  ["2026-06-01T00:30:00+02:00", "2026-06-01"],
  ["2026-06-01T00:00:00.123456Z", "2026-06-01"],
  ["2024-02-29T12:00:00Z", "2024-02-29"]
])("accepts canonical GraphQL DateTime %s", (value, label) => {
  expect(graphQLDateTimeContext(value)).toEqual({ dateTime: value, label });
  expect(graphQLDateTimeLabel(value)).toBe(label);
});

test.each([
  null,
  1_717_326_000_000,
  "not-a-date",
  "June 1 2026",
  "2026-02-30T00:00:00Z",
  "2025-02-29T12:00:00Z",
  "2026-06-01 00:00:00Z"
])("rejects unsupported DateTime value %s", (value) => {
  expect(graphQLDateTimeContext(value)).toBeNull();
  expect(graphQLDateTimeLabel(value)).toBeNull();
});
```

- [x] **Step 2: Run the test to verify RED**

Run:

```bash
cd assets
bun run test -- test/routes/graphql-datetime.test.ts
```

Expected: FAIL because `graphQLDateTimeLabel` is not exported.

- [x] **Step 3: Add the label-only API**

In `assets/src/routes/graphql-datetime.ts`, add:

```ts
export function graphQLDateTimeLabel(value: unknown) {
  return graphQLDateTimeContext(value)?.label ?? null;
}
```

- [x] **Step 4: Verify the direct DateTime test is GREEN**

Run:

```bash
cd assets
bun run test -- test/routes/graphql-datetime.test.ts
```

Expected: PASS with 11 cases.

- [x] **Step 5: Remove route-local DateTime wrappers and duplicate type**

In `assets/src/routes/offers/index.tsx`, import both helpers:

```ts
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel
} from "../graphql-datetime";
```

Replace `dateLabel(pricePoint.observedAt)` with
`graphQLDateTimeLabel(pricePoint.observedAt)` and delete the local `dateLabel`
function.

In `assets/src/routes/products/detail.tsx`, import the shared type and helpers:

```ts
import {
  graphQLDateTimeContext,
  graphQLDateTimeLabel,
  type GraphQLDateTimeContext
} from "../graphql-datetime";
```

Delete the local `PriceObservation` and `formatObservedDate` declarations.
Replace their uses with `GraphQLDateTimeContext` and
`graphQLDateTimeLabel(value)`. Keep this typed wrapper for the route model:

```ts
function buildPriceObservation(value: unknown): GraphQLDateTimeContext | null {
  return graphQLDateTimeContext(value);
}
```

- [x] **Step 6: Verify DateTime route integration**

Run:

```bash
cd assets
bun run test -- test/routes/graphql-datetime.test.ts test/routes/offers/offer-discovery.route.test.tsx test/routes/products/detail.route.test.tsx
bun run typecheck
```

Expected: PASS with direct parser coverage and all existing timestamp rendering
assertions unchanged; TypeScript exits 0.

- [x] **Step 7: Mark Task 4 complete and commit**

Check Task 4 boxes in this plan, then run:

```bash
git add assets/src/routes/graphql-datetime.ts assets/src/routes/offers/index.tsx assets/src/routes/products/detail.tsx assets/test/routes/graphql-datetime.test.ts docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md
git commit -m "refactor: expose shared datetime labels"
```

Expected: one direct DateTime contract and type-reuse commit.

---

### Task 5: Aggregate Verification and Stacked PR Publication

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md`
- Temporary: `/private/tmp/shopper-confidence-route-decomposition-pr.md`

**Interfaces:**
- Consumes: completed Tasks 1-4 and their focused verification evidence.
- Produces: a clean pushed branch and a ready stacked PR targeting `codex/shopper-decision-confidence`.

- [ ] **Step 1: Run every focused suite together**

Run:

```bash
cd assets
bun run test -- test/routes/offer-snapshot.test.ts test/routes/catalog/filter-summary.test.ts test/routes/catalog/result-status.test.ts test/routes/graphql-datetime.test.ts test/routes/catalog/browse.route.test.tsx test/routes/offers/offer-discovery.route.test.tsx test/routes/products/detail.route.test.tsx
```

Expected: PASS with all seven test files and zero failures.

- [ ] **Step 2: Run the full frontend gate**

Run:

```bash
cd assets
bun run check
```

Expected: TypeScript and every Vitest unit file pass with zero failures.

- [ ] **Step 3: Verify stacked scope and cleanliness**

Run:

```bash
git diff --check codex/shopper-decision-confidence...HEAD
git diff --stat codex/shopper-decision-confidence...HEAD
git status --short --branch
```

Expected: whitespace check exits 0; the diff contains only the design, plan,
shared policy modules, focused tests, and touched route migrations; the worktree
is clean after the final plan-status commit.

- [ ] **Step 4: Mark Task 5 complete and commit plan evidence**

Check every remaining box in this plan and add exact focused/full test counts to
this section, then run:

```bash
git add docs/superpowers/plans/2026-07-10-shopper-confidence-route-decomposition.md
git commit -m "docs: record shopper decomposition verification"
```

Expected: one final evidence commit with no product-code changes.

- [ ] **Step 5: Push the stacked branch**

Run:

```bash
git push -u origin codex/shopper-confidence-route-decomposition
```

Expected: remote branch created with tracking configured.

- [ ] **Step 6: Open and verify the ready stacked PR**

Create `/private/tmp/shopper-confidence-route-decomposition-pr.md` with:

```markdown
## Summary

This stacked PR decomposes shopper-confidence route policy introduced by PR #77 without changing user-facing behavior.

- share one single-pass offer snapshot aggregator across offer discovery and product detail
- separate catalog filter summary/removal and result-status policy from route parsing/rendering
- add direct GraphQL DateTime contract coverage and reuse its exported type

## Verification

- focused catalog, offer, product-detail, and pure policy suites
- `cd assets && bun run check`
- `git diff --check codex/shopper-decision-confidence...HEAD`

## Stack

Base: `codex/shopper-decision-confidence` (PR #77)
```

Run:

```bash
gh pr create --base codex/shopper-decision-confidence --head codex/shopper-confidence-route-decomposition --title "[codex] Decompose shopper confidence routes" --body-file /private/tmp/shopper-confidence-route-decomposition-pr.md
gh pr view --json number,url,state,isDraft,baseRefName,headRefName,headRefOid
```

Expected: an OPEN, non-draft PR whose base is
`codex/shopper-decision-confidence` and whose head OID matches local `HEAD`.
