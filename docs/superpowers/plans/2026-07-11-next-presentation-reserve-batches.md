# Next Presentation Reserve Batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the remaining saved-comparison, catalog, and revenue route presentation boundaries without changing Relay, mutation, URL, filter, pagination, suspense, or error behavior.

**Architecture:** Each route remains the owner of loader data, Relay reads, mutations, URL construction, filter and pagination state, and error/suspense boundaries. Its new sibling component receives typed display values, links, and callbacks, and owns only the existing controls, lists, cards, actions, and metric rendering.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, StyleX, Vitest.

## Global Constraints

- Browser data remains GraphQL/Relay-based.
- Preserve every existing accessible name, status message, button label, link destination, URL parameter, filter behavior, sort behavior, pagination behavior, and mutation variable.
- Keep Relay query reads, query retainers, `useMutation`, mutation completion/error handling, loader state, URL/path construction, filter state, pagination decisions, suspense, and error fallbacks in the route owner.
- New components receive typed values, presentation-ready links, and callbacks; they do not call Relay hooks, route-loader hooks, mutation hooks, or location hooks.
- Use direct imports instead of new barrel files.
- Do not add memoization for simple derived values or move route-owned state into effects.

---

### Task 1: Saved Comparison Set Presentation Extraction

**Files:**

- Create: `assets/src/routes/compare/SavedComparisonSetList.tsx`
- Modify: `assets/src/routes/compare/SavedComparisonsRoute.tsx`
- Test: `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- Modify: `docs/work/frontend-compare-saved-hardening.md`
- Include with this milestone: `docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md`

**Interfaces:**

- `SavedComparisonsRoute.tsx` continues to own `useLoaderData`, `useMutation`, delete in-flight tracking, deleted-set state, filter text, sort mode, `buildSavedComparisonsViewState`, query retainers, all delete completion/error handling, and every comparison/pagination URL path.
- `SavedComparisonSetList.tsx` exports `SavedComparisonSetList`, `SavedComparisonSortMode`, and `SavedComparisonSetPagination`.
- The presentation component receives the existing visible saved sets, control values/callbacks, typed delete callback, and route-built links:

```tsx
export type SavedComparisonSortMode =
  | "current"
  | "name-asc"
  | "product-count-desc"
  | "product-count-asc";

export type SavedComparisonSetPagination = {
  firstHref: string | null;
  nextHref: string | null;
};

export function SavedComparisonSetList(props: {
  filterText: string;
  onDelete: (savedComparisonSetId: string) => void;
  onFilterTextChange: (filterText: string) => void;
  onOpenComparison: (savedSet: SavedComparisonSetSummary) => string;
  onSortModeChange: (sortMode: SavedComparisonSortMode) => void;
  pagination: SavedComparisonSetPagination;
  pendingDeleteIds: ReadonlySet<string>;
  savedSets: readonly SavedComparisonSetSummary[];
  sortMode: SavedComparisonSortMode;
}): ReactElement;
```

- The route supplies the typed `SavedComparisonSetSummary` import from `./saved-data`; the component must not construct comparison or pagination URLs itself.

- [x] **Step 1: Confirm the characterization contract before extraction**

Run:

```bash
cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx
```

Expected: the focused saved-comparisons state suite passes before any route markup moves.

- [x] **Step 2: Add behavior assertions for the presentation seam**

In `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`, retain the existing authorization, deletion, filtering, sorting, reopen, and cursor-pagination assertions. Add a render-level assertion that one visible saved set still exposes its filter/sort controls, `Open comparison` link, enabled delete action, and `Saved comparison pages` pagination label after the route delegates markup to the new component.

- [x] **Step 3: Create the typed presentation component**

Move the existing `SavedComparisonControls`, list markup, item markup, product-count formatting, reopen/delete action markup, and pagination markup into `SavedComparisonSetList.tsx`. Keep the existing StyleX controls, saved-set, title, metadata, and actions styles with the presentation. Render a disabled delete button only when `pendingDeleteIds.has(savedSet.id)` and preserve the exact `Deleting comparison...` text.

`SavedComparisonSetList` renders the controls, list, and pagination from its typed props. It calls `onOpenComparison(savedSet)` for the reopen link and `onDelete(savedSet.id)` for the delete action; it does not call `useLoaderData`, `useMutation`, `useRoutePreloadedQuery`, or construct URL search parameters.

- [x] **Step 4: Leave orchestration in the route owner**

Import `SavedComparisonSetList` and pass existing `filterText`, `setFilterText`, `sortMode`, `setSortMode`, `viewState.savedSets`, `pendingDeleteIds`, and `handleDelete` directly. In `SavedComparisonsRoute.tsx`, build and pass:

```tsx
const pagination = {
  firstHref: loaderData.after ? "/compare/saved" : null,
  nextHref:
    loaderData.hasNextPage && loaderData.endCursor
      ? savedComparisonsPagePath(loaderData.endCursor)
      : null
};

const onOpenComparison = (savedSet: SavedComparisonSetSummary) =>
  buildSavedComparisonHref(savedSet.products.map(({ slug }) => slug));
```

Keep the unauthorized branch, status message, delete error feedback, empty return actions, and `SavedComparisonSetQueryRetainers` in `SavedComparisonsRoute.tsx`.

- [x] **Step 5: Verify behavior, types, and diff hygiene**

Run:

```bash
cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected: the focused suite and TypeScript pass, and diff check has no output.

- [x] **Step 6: Record lane evidence and commit the milestone**

Append a completed-batch entry to `docs/work/frontend-compare-saved-hardening.md` naming `SavedComparisonSetList`, route-retained Relay/mutation/query-retention/URL/filter orchestration, and the Step 5 command results.

```bash
git add assets/src/routes/compare/SavedComparisonSetList.tsx assets/src/routes/compare/SavedComparisonsRoute.tsx assets/test/routes/compare/saved-comparisons-route-state.test.tsx docs/work/frontend-compare-saved-hardening.md docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md
git commit -m "refactor(frontend): extract saved comparison set list"
```

---

### Task 2: Catalog Product List Presentation Extraction

**Files:**

- Create: `assets/src/routes/catalog/BrowseProductList.tsx`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `docs/work/frontend-catalog-browse.md`
- Include with this milestone: `docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md`

**Interfaces:**

- `BrowseRoute.tsx` continues to own the loader/preloaded Relay query, filters, selected compare slugs, current location/search, URL construction, selection tray, filter controls, result status, empty state, and pagination decisions.
- `BrowseProductList.tsx` exports `BrowseProductList`, `BrowseProductNode`, and `BrowseCompareAction`.
- The presentation component receives route-derived actions rather than reading location or building paths:

```tsx
export type BrowseProductNode =
  BrowseProductsRouteQuery["response"]["products"]["edges"][number]["node"];

export type BrowseCompareAction =
  | { kind: "selected" }
  | { kind: "full" }
  | { href: string; kind: "add" };

export function BrowseProductList(props: {
  compareActionFor: (product: BrowseProductNode) => BrowseCompareAction;
  detailHrefFor: (product: BrowseProductNode) => string;
  offerHrefFor: (product: BrowseProductNode) => string;
  products: readonly BrowseProductNode[];
}): ReactElement;
```

- `BrowseProductList` owns product-card, specification-highlight, and compare-action presentation. It preserves the three-highlight cap and renders only route-provided destinations.

- [x] **Step 1: Confirm the characterization contract before extraction**

Run:

```bash
cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx
```

Expected: the focused catalog browse suite passes before moving product-list presentation.

- [x] **Step 2: Add behavior assertions for the extracted card boundary**

In `assets/test/routes/catalog/browse.route.test.tsx`, retain the existing filter, compare-tray, pagination, encoded-detail-link, and empty-state coverage. Add one populated-result assertion that confirms a card keeps its accessible product name, at most three specification highlights, `View details`, `View offers`, and the route-derived add/selected/full compare state after delegation.

- [x] **Step 3: Create the typed product-list presentation**

Move `BrowseProductCard`, `SpecificationHighlights`, `CompareAction`, `SPECIFICATION_HIGHLIGHT_LIMIT`, and the existing product/card metadata/action/highlight StyleX styles into `BrowseProductList.tsx`. The list maps `products` to the existing labelled `DataList`/`DataListItem` structure.

For a `BrowseCompareAction`, preserve exact user-visible behavior: `selected` renders `<product name> selected for comparison`, `full` renders `Compare selection full`, and `add` renders `Add <product name> to compare` linked to `href`. The component uses `detailHrefFor(product)` and `offerHrefFor(product)` without importing route paths, compare-selection helpers, `useLocation`, or Relay hooks.

- [x] **Step 4: Keep query, filter, URL, tray, and pagination orchestration in the route**

In `BrowseRoute.tsx`, retain construction of `activeFilters`, `currentBrowsePathname`, `currentCompareSearch`, `selectedCompareSlugs`, `selectionTray`, `catalogControls`, and `paginationLinks`. Pass these route-built callbacks to the new list:

```tsx
detailHrefFor={(product) => browseProductDetailPath(product.slug, selectedCompareSlugs)}
offerHrefFor={(product) => `/offers?productId=${encodeURIComponent(product.id)}`}
compareActionFor={(product) => {
  if (selectedCompareSlugs.includes(product.slug)) return { kind: "selected" };
  if (selectedCompareSlugs.length >= MAX_COMPARE_PRODUCTS) return { kind: "full" };
  return {
    href: buildCurrentRoutePathWithCompareSlugs(
      currentBrowsePathname,
      currentCompareSearch,
      selectedCompareSlugsAfterAdding(selectedCompareSlugs, product.slug, MAX_COMPARE_PRODUCTS)
    ),
    kind: "add"
  };
}}
```

Keep the no-products branch and `FeedbackState` in `BrowseRoute.tsx`; render `BrowseProductList` only for the populated branch.

- [x] **Step 5: Verify behavior, types, and diff hygiene**

Run:

```bash
cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected: the focused suite and TypeScript pass, and diff check has no output.

- [x] **Step 6: Record lane evidence and commit the milestone**

Append a completed-batch entry to `docs/work/frontend-catalog-browse.md` naming `BrowseProductList`, route-retained Relay/filter/URL/tray/pagination orchestration, and the Step 5 command results.

```bash
git add assets/src/routes/catalog/BrowseProductList.tsx assets/src/routes/catalog/BrowseRoute.tsx assets/test/routes/catalog/browse.route.test.tsx docs/work/frontend-catalog-browse.md docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md
git commit -m "refactor(frontend): extract catalog product list"
```

---

### Task 3: Revenue Summary Presentation Extraction

**Files:**

- Create: `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Test: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `docs/work/affiliate-revenue-attribution.md`
- Include with this milestone: `docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md`

**Interfaces:**

- `RevenueSummaryRoute.tsx` continues to own `useLoaderData`, the preloaded Relay query, loader status branches, filter key, query-derived date-preset links, active filter values, metric derivation, suspense, and error fallbacks.
- `RevenueSummaryView.tsx` exports `RevenueSummaryView`, `RevenueSummaryMetrics`, `RevenueActiveFilter`, `RevenueDatePresetLink`, and `RevenueSummaryMetric`.
- The view component owns filter/date-preset/active-filter/metric presentation and receives route-derived values:

```tsx
export type RevenueActiveFilter = { label: string; value: string };
export type RevenueDatePresetLink = { label: string; to: string };
export type RevenueSummaryMetric = { label: string; value: string };

export function RevenueSummaryView(props: {
  activeFilters: readonly RevenueActiveFilter[];
  children: ReactNode;
  datePresetLinks: readonly RevenueDatePresetLink[];
  filters: RevenueSummaryLoaderData["filters"];
}): ReactElement;

export function RevenueSummaryMetrics(props: {
  metrics: readonly RevenueSummaryMetric[];
  suppression: { suppressed: boolean; threshold: number };
}): ReactElement;
```

- The route passes its existing summary values through the public boundary; the view does not call `useLoaderData`, Relay hooks, or build URL query strings.

- [ ] **Step 1: Confirm the characterization contract before extraction**

Run:

```bash
cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx
```

Expected: the focused revenue summary suite passes before moving presentation.

- [ ] **Step 2: Add behavior assertions for controls and metrics**

In `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`, retain existing loader error, missing-currency, invalid-date-range, suppression, and query assertions. Add a populated-summary assertion that verifies `Revenue filters`, all four named fields, `Apply filters`, `Clear filters`, `Revenue date presets`, `Active revenue filters`, and the `Summary` metrics label remain available after extraction.

- [ ] **Step 3: Create the typed summary-view presentation**

Move the filter form, date-preset link list, active-filter list, `ContextRail`, and `SummaryStrip`/suppression-status markup into `RevenueSummaryView.tsx`. Keep the existing `filters` StyleX style in that file. The filter form preserves the exact `method="get"`, field names, autocomplete values, currency max length, submit text, and `/commerce/revenue` clear link.

`RevenueSummaryView` renders the context rail from `filters`, `datePresetLinks`, and `activeFilters`, then renders `children` in the existing workspace layout. `RevenueSummaryMetrics` renders the existing suppression wording and `SummaryStrip` from the supplied values. Neither function evaluates loader status, reads a preloaded query, or constructs date-preset URLs.

- [ ] **Step 4: Keep loader, Relay, suspense, errors, and filter orchestration in the route**

In `RevenueSummaryRoute.tsx`, retain `revenueSummaryFilterKey`, `buildRevenueDatePresetLinks`, `buildActiveFilterItems`, `buildRevenueSummaryMetrics`, the loader status branches, `ResettableErrorBoundary`, and `Suspense`. Build the view props in the route:

```tsx
const datePresetLinks = buildRevenueDatePresetLinks(loaderData.filters);
const activeFilters = buildActiveFilterItems(loaderData.filters);

<RevenueSummaryView
  activeFilters={activeFilters}
  datePresetLinks={datePresetLinks}
  filters={loaderData.filters}
>
  {summaryContent}
</RevenueSummaryView>
```

Make `RevenueSummaryPanel` pass route-derived metrics and `data.revenueSummary.suppression` to `RevenueSummaryMetrics`. Preserve every unavailable, currency-required, and invalid-date fallback in `RevenueSummaryRoute.tsx`.

- [ ] **Step 5: Verify behavior, types, and diff hygiene**

Run:

```bash
cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected: the focused suite and TypeScript pass, and diff check has no output.

- [ ] **Step 6: Record lane evidence and commit the milestone**

Append a completed-batch entry to `docs/work/affiliate-revenue-attribution.md` naming `RevenueSummaryView` and `RevenueSummaryMetrics`, route-retained loader/Relay/filter/suspense/error orchestration, and the Step 5 command results.

```bash
git add assets/src/routes/commerce/revenue/RevenueSummaryView.tsx assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx docs/work/affiliate-revenue-attribution.md docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md
git commit -m "refactor(frontend): extract revenue summary view"
```
