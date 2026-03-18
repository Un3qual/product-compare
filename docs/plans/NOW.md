# NOW

## Current Batch

- Status: blocked
- Batch: none queued
- Source of truth: `docs/work/index.md`
- Next step: restore `docs/plans/INDEX.md` and `ARCHITECTURE.md`, then create the next implementation plan from the active architecture source
- Why no batch is active:
  - Frontend compare baseline Task 3 is complete, so no active work item remains under `docs/work/index.md`.
  - The repo-level fallback for planning the next slice is blocked because `docs/plans/INDEX.md` and `ARCHITECTURE.md` are absent.
  - Saved-comparison persistence and later frontend rebaselines remain deferred until the planning entrypoints are restored.

## Just Completed

- Frontend compare baseline Task 3:
  - Updated `assets/src/routes/compare/api.ts` to return route-local `not_found` and `error` states when any selected product is missing or its product-detail request fails.
  - Updated `assets/src/routes/compare/index.tsx` to render `One or more selected products were not found.` and `Comparison unavailable.` inside the compare shell.
  - Extended `assets/src/routes/compare/__tests__/compare.route.test.tsx` to cover missing-product and unavailable compare states alongside the existing empty, over-limit, and ready cases.
  - Verified `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

- Frontend compare baseline Task 2:
  - Updated `assets/src/routes/compare/api.ts` to reuse `loadProductDetail/2` for up to three selected slugs and return ready-state products in URL order.
  - Updated `assets/src/routes/compare/index.tsx` to render basic comparison cards with product name, brand, slug, and description.
  - Extended `assets/src/routes/compare/__tests__/compare.route.test.tsx` to cover ready-state loading order and compare-card rendering.
  - Verified `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx` and `cd assets && bun run typecheck`.

- Frontend compare baseline Task 1:
  - Added `assets/src/routes/compare/api.ts` and `assets/src/routes/compare/index.tsx` for the `/compare` route-local loader and shell.
  - Registered the compare route in `assets/src/router.tsx` and added `Compare products` links to `assets/src/routes/root.tsx`.
  - Added focused compare-route coverage in `assets/src/routes/compare/__tests__/compare.route.test.tsx` and expanded `assets/src/routes/__tests__/root.route.test.tsx`.
  - Verified `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx` and `cd assets && bun run typecheck`.

- Frontend product offers baseline Task 2:
  - Updated `assets/src/routes/products/api.ts` to preserve product-ready state while returning local offer `ready`, `empty`, and `error` states.
  - Updated `assets/src/routes/products/detail.tsx` to render `No active offers yet.` and `Offers unavailable.` inside the product detail shell.
  - Extended `assets/src/routes/products/__tests__/detail.route.test.tsx` to cover empty and unavailable offer states without collapsing the page to `Product unavailable.`.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `mix test test/product_compare_web/graphql/pricing_queries_test.exs`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.

- Frontend product offers baseline Task 1:
  - Updated `assets/src/routes/products/api.ts` to fetch `merchantProducts(input:)` after the product lookup succeeds and normalize active offer link/price data for the route.
  - Updated `assets/src/routes/products/detail.tsx` to render an `Active offers` section on `/products/:slug` when offers are present.
  - Extended `assets/src/routes/products/__tests__/detail.route.test.tsx` to cover the second GraphQL request and success-state offer rendering.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`.

- Frontend product detail baseline Task 3:
  - Updated `assets/src/routes/products/api.ts` to return route-local `ready`, `not_found`, and `error` states for product detail loading.
  - Updated `assets/src/routes/products/detail.tsx` to render missing-product and unavailable fallback copy without a route error boundary.
  - Extended `assets/src/routes/products/__tests__/detail.route.test.tsx` to cover success, missing-product, and unavailable detail states.
  - Verified `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx`, `mix test test/product_compare_web/graphql/catalog_queries_test.exs`, `cd assets && bun run typecheck`, and `cd assets && bun run test:unit`.
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
