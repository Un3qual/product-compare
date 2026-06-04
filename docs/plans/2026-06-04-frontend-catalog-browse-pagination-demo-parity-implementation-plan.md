# Frontend Catalog Browse Pagination Demo Parity Implementation Plan (2026-06-04)

Execution status lives in `docs/work/frontend-catalog-browse-pagination-demo-parity.md` and `docs/work/index.md`.

Status: done. Completion evidence lives in `docs/work/frontend-catalog-browse-pagination-demo-parity.md`.

## Goal

Make `/products` pagination demoable from the browser by wiring the existing Relay `products(first, after)` connection to URL-driven next-page and first-page navigation.

## Architecture

- Keep the backend contract unchanged: `products(first:, after:)` already exists and the frontend Relay query already declares `after`.
- Parse the `after` search param in `browseLoader`, pass it to the existing route query variables, and leave page size fixed at 12.
- Render pagination links from `pageInfo` inside `BrowseRoute` so SSR, reloads, and client navigation share one URL contract.
- Keep this as a frontend-only slice; CJ ingestion and eBay fallback work remain blocked outside this plan.

## Task 1: Add Browse Pagination Controls

Status: done. See `docs/work/frontend-catalog-browse-pagination-demo-parity.md` for completion evidence and verification output.

### Files

- Update: `assets/src/routes/catalog/loader.ts`
- Update: `assets/src/routes/catalog/browse.tsx`
- Update: `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
- Update: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
- Generate if Relay changes: `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
- Update at completion: `docs/work/frontend-catalog-browse-pagination-demo-parity.md`
- Update at completion: `docs/work/index.md`

### Acceptance Criteria

- `browseLoader` reads `after` from `request.url` and passes `{ first: 12, after }` to `preloadRouteQuery` when a cursor exists.
- `browseLoader` preserves the current first-page variables when `after` is absent.
- `BrowseRoute` renders:
  - existing product rows and links.
  - a `Next products` link when `products.pageInfo.hasNextPage` and `endCursor` are present.
  - a `First products` link when the current loader query variables include `after`.
  - no pagination navigation when there are no products or no next page on the first page.
- Existing loading, empty, preload-error, and Relay-read-error fallbacks keep working.

### TDD Steps

1. Add loader coverage proving `after` is forwarded from `/products?after=<cursor>`.
2. Add route coverage proving next-page and first-page links render with stable hrefs.
3. Add route coverage proving pagination controls are omitted when the first page has no next page.
4. Run `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`.
   - Expected RED: pagination variables or links are missing.
5. Update `browseLoader` to parse `after` and pass it to the Relay query variables.
6. Update `BrowseRoute` to render pagination navigation from `data.products.pageInfo` and the current query variables.
7. Run `cd assets && bun run relay`.
8. Re-run `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`.
   - Expected GREEN.
9. Run `cd assets && bun run typecheck`.
10. Run `git diff --check`.

## Final Verification And Queue Closure

Task 1 is complete:

- `docs/work/frontend-catalog-browse-pagination-demo-parity.md` records completion evidence.
- `docs/work/index.md` no longer contains the completed ready row.
- `docs/plans/NOW.md` remains unchanged because the queue entry point did not change.
- Review cleanup removed the Relay `@connection` handle from the browse route query so URL-driven page replacement does not accumulate prior-page edges in the Relay store.

Expected final verification:

```bash
cd assets && bun run relay
cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx
cd assets && bun run typecheck
git diff --check
```
