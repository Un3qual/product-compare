# Catalog Faceted Filtering UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/products` from a paginated browse page into a usable faceted product discovery page backed by the existing `products(filters:)` GraphQL contract.

**Architecture:** Add route-local URL parsing and serialization for product filters, preload product results and filter metadata through Relay, and render GET-based controls that preserve SSR behavior. Keep filter state in the URL and reset cursors whenever filters change.

**Tech Stack:** React Router, React, Relay, TypeScript, Vitest, Testing Library, Bun.

**Status:** planned product-facing follow-up. Depends on `docs/plans/2026-06-30-product-filter-metadata-and-facets-implementation-plan.md`.

---

## Ownership

Owned paths:

- Create `assets/src/routes/catalog/filters.ts`
- Create `assets/src/routes/catalog/paths.ts`
- Create `assets/src/routes/catalog/queries/ProductFilterMetadataQuery.ts`
- Modify `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
- Modify `assets/src/routes/catalog/loader.ts`
- Modify `assets/src/routes/catalog/browse.tsx`
- Modify `assets/test/routes/catalog/browse.route.test.tsx`
- Modify `assets/schema.graphql`
- Modify `assets/src/__generated__/**` through `bun run relay`
- Modify `docs/work/frontend-catalog-browse.md`

Do not edit backend filter semantics in this row. If GraphQL metadata is missing
or stale, stop and record the blocker instead of hardcoding IDs.

## URL Contract

Use these query parameters:

- `first=12|24|48`
- `after=<cursor>` for pagination only
- `typeTaxonId=<Relay taxon id>`
- `includeTypeDescendants=1`
- repeated `useCaseTaxonId=<Relay taxon id>`
- repeated `numeric.<Relay attribute id>.min=<decimal>`
- repeated `numeric.<Relay attribute id>.max=<decimal>`
- repeated `boolean.<Relay attribute id>=true|false`
- repeated `enum.<Relay attribute id>=<Relay enum option id>`

Changing any filter must remove `after`. Pagination links must preserve all
active filters and only add or remove `after`.

## Tasks

- [ ] Add failing loader tests showing URL filters become a `ProductFiltersInput` variable and that malformed blank values are omitted.
- [ ] Add `assets/src/routes/catalog/filters.ts` with:
  - `catalogFiltersFromUrl(url: URL)`
  - `catalogFiltersToProductFiltersInput(filters)`
  - `hasActiveCatalogFilters(filters)`
  - `catalogFilterSummaryItems(metadata, filters)`
- [ ] Add `assets/src/routes/catalog/paths.ts` with:
  - `catalogBrowsePath(filters, first, after)`
  - `catalogBrowseFirstPagePath(filters, first)`
  - `catalogBrowseNextPagePath(filters, first, after)`
- [ ] Update `BrowseProductsRouteQuery` to accept `$filters: ProductFiltersInput` and call `products(first: $first, after: $after, filters: $filters)`.
- [ ] Add `ProductFilterMetadataQuery` for `productFilterMetadata(filters: $filters)` with result count, type options, use-case options, numeric filters, boolean filters, and enum filters.
- [ ] Update `browseLoader` so the ready state contains `filters`, product query descriptor, metadata query descriptor, and the normalized page size.
- [ ] Render a `CatalogFilterForm` before the product list. The form must use GET, display metadata-backed controls, preserve page size, and submit to `/products` without `after`.
- [ ] Render an active filter summary with a `Clear filters` link when any filter is active.
- [ ] Change the empty state to say `No products match these filters.` when filters are active and `No products available yet.` when filters are not active.
- [ ] Preserve active filters in `First products` and `Next products` links.
- [ ] Run Relay generation and update generated artifacts.
- [ ] Update lane evidence in `docs/work/frontend-catalog-browse.md`.

## Test Coverage

Add or update focused tests in `assets/test/routes/catalog/browse.route.test.tsx`:

- Loader passes `{first: 12, filters: {primaryTypeTaxonId: "...", includeTypeDescendants: true}}`.
- Loader parses repeated use-case, enum, boolean, and numeric filter URL params.
- Loader drops blank numeric bounds and malformed boolean values.
- Route renders type, use-case, numeric, boolean, and enum controls from metadata.
- Route renders selected controls and active filter summary.
- `Clear filters` links to `/products?first=<current-first>`.
- `Next products` preserves all active filters plus `after`.
- Filter form does not include stale `after`.
- Empty state distinguishes active filters from a globally empty catalog.

## Verification

Run these commands:

```bash
cd assets && bun run relay
cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx
cd assets && bun run typecheck
mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs test/product_compare_web/graphql/catalog_queries_test.exs
git diff --check
```

Expected result: all commands exit 0 and `/products` remains SSR-safe.

## Exit Condition

This row is complete when a user can filter `/products` by metadata-backed type,
use case, numeric, boolean, and enum controls, share the resulting URL, paginate
without losing filters, and clear filters back to a clean browse page.
