# Frontend Catalog Browse Pagination Demo Parity

## Snapshot

- Status: done
- Priority: P1
- Source of truth: this file
- Live queue row: completed and removed from `docs/work/index.md`
- Implementation plan: `docs/plans/2026-06-04-frontend-catalog-browse-pagination-demo-parity-implementation-plan.md`
- Last verified: 2026-06-04 with focused Relay, Vitest, typecheck, and diff checks
- Objective: make catalog browse pagination demoable from `/products` using the existing Relay `products(first, after)` connection.

## Verified Current State

- `/products` is mounted through `browseLoader` and `BrowseRoute`.
- `BrowseProductsRouteQuery` uses `products(first:, after:)` without a Relay `@connection` handle, so URL-driven cursor pages replace rather than accumulate prior-page edges.
- `browseLoader` preloads the first page with `{ first: 12 }` and forwards URL cursor pages as `{ first: 12, after }`.
- `BrowseRoute` renders product rows, product-detail links, compare links, offer-discovery links, next-page links, first-page reset links, empty state, loading state, and unavailable fallback.
- Focused coverage lives in `assets/src/routes/catalog/__tests__/browse.route.test.tsx`.
- The backend `products(first:, after:)` connection already exists; this batch stayed frontend-only.

## Completion Evidence

- Completed batch: Task 1 in `docs/plans/2026-06-04-frontend-catalog-browse-pagination-demo-parity-implementation-plan.md`.
- Changed paths:
  - `docs/work/index.md`
  - `docs/work/frontend-catalog-browse-pagination-demo-parity.md`
  - `assets/src/routes/catalog/loader.ts`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`
  - `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
  - `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts`
- Constraints:
  - Did not touch CJ ingestion, live provider validation, eBay fallback work, backend fields, or browser REST endpoints.
  - Pagination remains URL-driven so SSR, reload, and hydration paths use the same cursor.

## Verification

- RED: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx` failed with 2 expected failures: missing `after` forwarding and missing `Next products` / `First products` links.
- GREEN: `cd assets && bun run relay` completed successfully.
- GREEN: `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx` passed 15 tests.
- GREEN: `cd assets && bun run typecheck` completed successfully.
- GREEN: `git diff --check` completed successfully.

## Remaining Work

- No ready frontend catalog browse pagination work remains.
- Product data ingestion remains blocked in `docs/work/index.md` on the external CJ evidence named in `docs/work/product-data-scraping.md`.
