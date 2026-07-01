# Persistent Compare Tray Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep compare selections visible and actionable while shoppers move between `/products`, `/products/:slug`, and `/compare`.

**Architecture:** Keep compare state URL-driven with repeated `slug` search params, reusing the existing `/compare` contract instead of adding browser storage or global client state. Browse and detail routes read selected compare slugs from the current URL, preserve them through local route links and GET forms, add/remove slugs by rewriting only `slug` params, and use `/compare?slug=...` only for the full comparison page.

**Tech Stack:** React Router, React, Relay-generated route data, Testing Library, Vitest, Bun.

**Status:** planned product-facing follow-up. Promote through `docs/work/index.md` before implementation.

---

## Owned Paths

- `assets/src/routes/compare/paths.ts`
- `assets/src/routes/compare/selection-tray.tsx`
- `assets/src/routes/compare/index.tsx`
- `assets/src/routes/catalog/paths.ts`
- `assets/src/routes/catalog/filter-form.tsx`
- `assets/src/routes/catalog/browse.tsx`
- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`
- `docs/work/frontend-catalog-browse.md`
- `docs/work/frontend-product-detail.md`

Do not edit `assets/schema.graphql`, `assets/src/__generated__/**`, `lib/**`, `priv/**`, `assets/src/router.tsx`, `docs/work/index.md`, `docs/plans/INDEX.md`, or `docs/plans/NOW.md` unless the live queue row explicitly names them as target paths.

## Scope

- Show a compact compare tray on `/products` and `/products/:slug` when the current URL has selected compare slugs.
- Let shoppers add visible browse/detail products to the tray without leaving the current page.
- Let shoppers remove selected slugs without losing route-local params such as catalog filters, page size, pagination cursor, or `offersAfter`.
- Preserve selected compare slugs through browse pagination, browse filter submission, browse clear-filter links, product detail links, and detail browse-return links.
- Keep `/compare` as the full comparison destination with repeated `slug` params.
- Keep add operations capped at the existing compare max.
- Use product names when the route already has them; otherwise display selected slug text.
- Do not add Relay queries solely for tray labels.
- Do not introduce localStorage, React context, Redux-style state, backend work, schema changes, or Relay artifact changes.

## File Structure

- `assets/src/routes/compare/paths.ts`: pure helpers for parsing, adding, removing, and rewriting compare slugs.
- `assets/src/routes/compare/selection-tray.tsx`: shared presentational tray for `/compare`, `/products`, and `/products/:slug`.
- `assets/src/routes/compare/index.tsx`: replace the route-local tray with the shared tray while preserving existing compare behavior.
- `assets/src/routes/catalog/paths.ts`: preserve compare slugs in catalog browse path builders.
- `assets/src/routes/catalog/filter-form.tsx`: preserve compare slugs through GET filter forms and clear links.
- `assets/src/routes/catalog/browse.tsx`: parse selected slugs, render tray, preserve slugs through browse links, and change compare actions to route-local add links.
- `assets/src/routes/products/detail.tsx`: parse selected slugs, render tray, preserve `offersAfter`, and change compare action to route-local add.

## Tasks

### Task 1: Add Shared URL Helpers

**Files:**
- Modify: `assets/src/routes/compare/paths.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`

- [ ] Add failing tests for:
  - `selectedCompareSlugsFromSearch("?slug=detail-product&slug=&slug=second-product&slug=detail-product")` returning `["detail-product", "second-product"]`.
  - `selectedCompareSlugsAfterAdding(["detail-product"], "second-product", 3)` returning `["detail-product", "second-product"]`.
  - `selectedCompareSlugsAfterAdding(["detail-product"], "detail-product", 3)` returning `["detail-product"]`.
  - `buildCurrentRoutePathWithCompareSlugs("/products", "?first=24&slug=detail-product&typeTaxonId=type-laptops", ["second-product"])` returning `/products?first=24&typeTaxonId=type-laptops&slug=second-product`.
- [ ] Run:

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "compare path helpers"
```

Expected: failure because the helpers are not exported yet.

- [ ] Implement these exports in `assets/src/routes/compare/paths.ts`:
  - `selectedCompareSlugsFromSearch(search: string): string[]`
  - `selectedCompareSlugsAfterAdding(selectedSlugs: readonly string[], slug: string, maxProducts: number): string[]`
  - `buildCurrentRoutePathWithCompareSlugs(pathname: string, search: string, selectedSlugs: readonly string[]): string`
- [ ] Requirements:
  - Trim slugs.
  - Drop blanks.
  - Dedupe by first occurrence.
  - Preserve existing non-`slug` search params and their relative order.
  - Delete all existing `slug` params before appending selected slugs.
  - Return `pathname` without `?` when no search params remain.
  - Do not import max compare constants into `paths.ts`; callers pass the cap.
- [ ] Run the focused test again and commit:

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "compare path helpers"
git add assets/src/routes/compare/paths.ts assets/test/routes/compare/compare.route.test.tsx
git commit -m "feat: add URL helpers for persistent compare selection"
```

### Task 2: Extract The Shared Compare Tray

**Files:**
- Create: `assets/src/routes/compare/selection-tray.tsx`
- Modify: `assets/src/routes/compare/index.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`

- [ ] Extend the existing selected-product tray test so it asserts an `Open comparison` link with href `/compare?slug=detail-product&slug=second-product&slug=third-product`.
- [ ] Run:

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "selected-product tray"
```

Expected: failure because the current tray does not expose the shared open-comparison link.

- [ ] Create `CompareSelectionTray` in `assets/src/routes/compare/selection-tray.tsx`.
- [ ] Props:
  - `selectedSlugs: readonly string[]`
  - `items: readonly { slug: string; label: string }[]`
  - `maxProducts: number`
  - `openComparePath: string`
  - `removePathForIndex: (index: number) => string`
  - `title?: string`, default `Selected products`
- [ ] Render:
  - labelled `section` region.
  - `{selectedSlugs.length} of {maxProducts} products selected.`
  - `Open comparison` link when at least one slug is selected.
  - one remove link per selected slug, using item labels when available and slug fallback otherwise.
- [ ] Replace the route-local tray in `assets/src/routes/compare/index.tsx` with the shared component.
- [ ] Preserve spec-mode-aware remove links and open path with existing compare path helpers.
- [ ] Run the focused test, full compare route suite, and commit:

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "selected-product tray"
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx
git add assets/src/routes/compare/index.tsx assets/src/routes/compare/selection-tray.tsx assets/test/routes/compare/compare.route.test.tsx
git commit -m "feat: share compare selection tray"
```

### Task 3: Add Persistent Tray Behavior To Browse

**Files:**
- Modify: `assets/src/routes/catalog/paths.ts`
- Modify: `assets/src/routes/catalog/filter-form.tsx`
- Modify: `assets/src/routes/catalog/browse.tsx`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`

- [ ] Add failing browse tests using the existing `renderBrowseRouteWithRelayData`, `readyBrowseLoaderData`, `browseQueryDescriptorFromVariables`, and `buildBrowseProductsResponse` helpers.
- [ ] Cover:
  - `/products?first=24&slug=detail-product&slug=second-product` renders the shared tray with `2 of 3 products selected.`.
  - `Open comparison` links to `/compare?slug=detail-product&slug=second-product`.
  - removing `detail-product` links to `/products?first=24&slug=second-product`.
  - product card action says `Add Catalog Second to compare` and links to the current `/products` URL with the appended slug.
  - `Next products` preserves compare slugs.
  - the `Filter products` GET form contains hidden `slug` inputs for each selected slug.
- [ ] Update existing decision-card expectations from direct `/compare` links to route-local add links.
- [ ] Run:

```bash
cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx -t "persistent compare tray|adds a browse product|preserves compare slugs|renders decision actions"
```

Expected: failure because browse does not read compare slugs or render the tray yet.

- [ ] In `assets/src/routes/catalog/paths.ts`, add optional `compareSlugs: readonly string[] = []` parameters to `catalogBrowsePath`, `catalogBrowseFirstPagePath`, and `catalogBrowseNextPagePath`; append compare slugs after catalog filters and `after`.
- [ ] In `assets/src/routes/catalog/filter-form.tsx`, add `compareSlugs` props to `CatalogFilterForm` and `CatalogActiveFilterSummary`; render hidden `slug` inputs and preserve slugs on clear-filter links.
- [ ] In `assets/src/routes/catalog/browse.tsx`, import `useLocation`, compare helpers, and `CompareSelectionTray`; parse selected slugs, render the tray, preserve slugs in pagination/filter/detail links, and replace direct compare card links with in-place add/selected/full states.
- [ ] Run focused and full browse tests, then commit:

```bash
cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx -t "persistent compare tray|adds a browse product|preserves compare slugs|renders decision actions"
cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx
git add assets/src/routes/catalog/paths.ts assets/src/routes/catalog/filter-form.tsx assets/src/routes/catalog/browse.tsx assets/test/routes/catalog/browse.route.test.tsx
git commit -m "feat: keep compare tray on product browse"
```

### Task 4: Add Persistent Tray Behavior To Product Detail

**Files:**
- Modify: `assets/src/routes/products/detail.tsx`
- Test: `assets/test/routes/products/detail.route.test.tsx`

- [ ] Add failing detail tests using the existing `PRODUCT_QUERY_DESCRIPTOR`, `OFFERS_QUERY_DESCRIPTOR`, `makeOffersQueryDescriptor`, `mockRouteQueryRefs`, and `buildOffersData` helpers.
- [ ] Cover:
  - `/products/detail-product?slug=second-product` renders the shared tray with `1 of 3 products selected.`.
  - `Open comparison` links to `/compare?slug=second-product`.
  - removing `second-product` links to `/products/detail-product`.
  - adding the current product preserves `offersAfter`, appending `slug=detail-product`.
  - `Browse products` preserves selected compare slugs as `/products?slug=second-product`.
- [ ] Update existing `Compare this product` expectations to `Add this product to compare`.
- [ ] Run:

```bash
cd assets && bun x vitest run test/routes/products/detail.route.test.tsx -t "persistent compare tray|adds the current detail product|preserves compare slugs|Compare this product|Add this product"
```

Expected: failure because detail does not read compare slugs or render the tray yet.

- [ ] In `assets/src/routes/products/detail.tsx`, import `useLocation`, compare helpers, and `CompareSelectionTray`; parse selected slugs, render the tray near the summary, preserve `offersAfter` when adding/removing compare slugs, and preserve compare slugs on browse-return links.
- [ ] Run focused and full detail tests, then commit:

```bash
cd assets && bun x vitest run test/routes/products/detail.route.test.tsx -t "persistent compare tray|adds the current detail product|preserves compare slugs|Add this product"
cd assets && bun x vitest run test/routes/products/detail.route.test.tsx
git add assets/src/routes/products/detail.tsx assets/test/routes/products/detail.route.test.tsx
git commit -m "feat: keep compare tray on product detail"
```

### Task 5: Update Lane Docs And Run Final Verification

**Files:**
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`
- Modify: `docs/work/frontend-catalog-browse.md`
- Modify: `docs/work/frontend-product-detail.md`

- [ ] Record the completed persistent compare tray dispatch in the compare lane doc and remove it from open follow-up candidates.
- [ ] Add browse lane evidence for URL-backed tray rendering, in-place add links, and compare-slug preservation through browse controls.
- [ ] Add product detail lane evidence for URL-backed tray rendering, in-place current-product add links, `offersAfter` preservation, and browse-return preservation.
- [ ] Run final verification:

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

- [ ] Commit docs and final verification evidence:

```bash
git add docs/work/frontend-product-comparison-demo-parity.md docs/work/frontend-catalog-browse.md docs/work/frontend-product-detail.md
git commit -m "docs: record persistent compare tray verification"
```

## Exit Condition

The implementation is complete when `/products` and `/products/:slug` display and preserve URL-backed compare selections, add/remove links preserve route-local params, `/compare` behavior remains intact, route tests and typecheck pass, no backend/generated/schema/global-state changes are introduced, and lane docs record evidence.

## Blocker And Fallback Rules

- If current route architecture cannot preserve compare slugs through browse filters without widening ownership beyond the listed files, stop and record the blocker in `docs/work/frontend-product-comparison-demo-parity.md`.
- If product names for off-page selected slugs are unavailable on browse/detail, use slug fallback labels. Do not add a new Relay query solely for tray labels.
- If the live queue row does not name `docs/work/index.md`, leave queue promotion/closure to the coordinator.
