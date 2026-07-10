# Catalog Result Guidance And Removable Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Status:** ready. This is the highest-ranked row in the shopper decision
confidence queue.

**Goal:** Show the complete filtered product count and let shoppers remove one
active catalog filter without losing unrelated filter, page-size, or compare
state.

**Architecture:** Keep the batch frontend-only. Convert the existing catalog
filter summary from display-only strings into structured items that carry the
remaining normalized `CatalogFilters`, then build first-page links through the
existing catalog path serializer.

**Tech Stack:** React, TypeScript, React Router, Relay route data, Vitest, Bun.

## Global Constraints

- Do not add backend, schema, provider, ingestion, eBay, dashboard, operator,
  credential, scraping, or CSV export work.
- Treat `productFilterMetadata.resultCount` as the complete matching result
  count, not the number of rows on the loaded page.
- Every removal link preserves page size and compare slugs and omits `after`.
- Keep the current filter form, empty states, pagination, sorting, and compare
  tray behavior intact.

## Owned Paths

- `assets/src/routes/catalog/filters.ts`
- `assets/src/routes/catalog/paths.ts`
- `assets/src/routes/catalog/filter-form.tsx`
- `assets/src/routes/catalog/browse.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `docs/work/frontend-catalog-browse.md`

## Interfaces

- `catalogFilterSummaryItems(metadata, filters)` returns structured items with
  stable `key`, display `label`, and `remainingFilters: CatalogFilters`.
- Query removal clears only `query`; sort removal clears only `sort`.
- Type removal clears `typeTaxonId` and `includeTypeDescendants` together.
- Use-case removal removes one taxon id; numeric removal removes one attribute's
  full range; boolean and enum removal remove one matching attribute.
- `CatalogActiveFilterSummary` builds every removal href with
  `catalogBrowseFirstPagePath(item.remainingFilters, pageSize, compareSlugs)`.

## Batches

- [ ] **1. Add failing route coverage.** Cover zero, one, and plural matching
  result counts plus removal hrefs for search, non-default sort, type with
  descendants, one of multiple use cases, numeric bounds, boolean, and enum
  filters. Assert unrelated filters, `first`, and repeated `slug` values remain
  while `after` is absent.
- [ ] **2. Add structured removal state.** Replace string-only summary items in
  `filters.ts` with stable keyed items and exact remaining-filter copies. Keep
  filter normalization and unique enum semantics unchanged.
- [ ] **3. Render result guidance and removal links.** Show
  `No matching products`, `1 matching product`, or `<n> matching products` from
  metadata and label links as `Remove <summary label>`. Retain `Clear filters`
  as the all-at-once action.
- [ ] **4. Verify and record completion.** Run the focused route suite and
  TypeScript check, then replace the ready section in
  `docs/work/frontend-catalog-browse.md` with red/green evidence and the final
  behavior summary.
- [ ] **5. Commit the milestone.** Commit code, tests, generated behavior, and
  lane evidence together with `feat: add catalog result guidance`.

## Verification

- `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

`/products` shows the metadata-backed complete match count, every active filter
has a scoped removal link, and removal preserves unrelated filters, page size,
and compare selections without preserving a stale cursor.

## Blocker And Fallback

If a summary item cannot be mapped back to a stable normalized filter identity,
stop and record that specific filter shape in the catalog lane doc. Do not parse
display labels or mutate `window.location` as a fallback.
