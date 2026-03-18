# NOW

## Current Batch

- Status: ready
- Batch: Frontend product detail baseline
- Source of truth: `docs/work/frontend-product-detail.md`
- Implementation plan: `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- Next step: execute Task 3 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- Why this is current:
  - `/products/:slug` now exists as an SSR-safe frontend route with a narrow success-path GraphQL loader.
  - Browse product names now navigate into the detail route without widening the catalog list query.
  - The remaining unblocked work is the route-local missing-product and unavailable-state handling plus slice verification.

## Just Completed

- Frontend product detail baseline Task 2:
  - Added `assets/src/routes/products/api.ts` and `assets/src/routes/products/detail.tsx` for the `/products/:slug` loader and route shell.
  - Registered the detail route in `assets/src/router.tsx` and linked browse product names to it from `assets/src/routes/catalog/browse.tsx`.
  - Added focused detail-route tests and browse-link coverage in `assets/src/routes/products/__tests__/detail.route.test.tsx` and `assets/src/routes/catalog/__tests__/browse.route.test.tsx`.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`.
- Frontend product detail baseline Task 1:
  - Added `product(slug: String!)` to `lib/product_compare_web/schema.ex`.
  - Added `ProductCompare.Catalog.get_product_by_slug/1` and `CatalogResolver.product/3`.
  - Extended `test/product_compare_web/graphql/catalog_queries_test.exs` with single-product query coverage.
  - Verified `mix test test/product_compare_web/graphql/catalog_queries_test.exs`.
- Frontend catalog browse Task 3:
  - Added route-local `"ready"` and `"error"` loader states in `assets/src/routes/catalog/api.ts`.
  - Rendered empty and unavailable copy in `assets/src/routes/catalog/browse.tsx`.
  - Extended `assets/src/routes/catalog/__tests__/browse.route.test.tsx` to cover success, empty, and unavailable states.
  - Verified `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`, `bun run typecheck`, and `bun run test:unit`.
- Frontend catalog browse Task 2:
  - Added `assets/src/routes/catalog/api.ts` to load and normalize the first catalog page from GraphQL.
  - Switched `/products` to route-loader data in `assets/src/router.tsx` and `assets/src/routes/catalog/browse.tsx`.
  - Updated `assets/src/entry.server.tsx` to SSR React Router loader data via the static handler/static router path.
  - Added focused loader, route-render, and entry-server tests plus a clean frontend typecheck.
- Frontend catalog browse Task 1:
  - Added the `/products` route shell in `assets/src/routes/catalog/browse.tsx`.
  - Registered the route in `assets/src/router.tsx` and linked to it from `assets/src/routes/root.tsx`.
  - Added focused route tests for the browse shell and root browse link.
- GraphQL auth migration follow-up:
  - Decision/status doc added at `docs/decisions/2026-03-17-auth-token-delivery-deferral.md`.
  - `docs/work/graphql-auth-migration.md` is closed.
