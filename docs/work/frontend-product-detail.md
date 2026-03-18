# Frontend Product Detail Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at `3c6bd7a` + working tree
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes an SSR-safe `/products/:slug` route.
  - The route loads a product's basic detail data from GraphQL by slug and the browse page links into it.
  - Route-level tests cover success, missing-product, and unavailable states for the detail route.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Verified Current State

- `assets/src/routes/catalog/browse.tsx` now renders the first catalog page on `/products` with success, empty, and unavailable states.
- Browse product rows now link product names to `/products/:slug` destinations without widening the list query.
- `ProductCompare.Catalog.get_product_by_slug/1` now preloads `brand`, and `lib/product_compare_web/schema.ex` now exposes `product(slug: String!)` for single-product GraphQL lookup.
- `assets/src/routes/products/api.ts` and `assets/src/routes/products/detail.tsx` now provide a narrow product-detail loader and route shell for `/products/:slug`.
- `assets/src/routes/products/__tests__/detail.route.test.tsx` covers the success-path loader and route render, but the detail route still lacks missing-product and unavailable-state handling.
- The older fullstack frontend plan remains too broad to execute directly; the next slice needs a narrow rebaseline from the current codebase.

## Completed

- Rebaselined the next frontend slice into `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`.
- Completed Task 1 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding the single-product GraphQL query, resolver path, and regression coverage.
- Completed Task 2 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding the `/products/:slug` loader, route shell, browse links, and focused route coverage.

## Next Batch

1. Execute Task 3 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` to add missing-product and unavailable states for the detail route.
2. Keep the slice narrow: extend the route-local loader status shape and route copy, then run slice verification.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-product-detail.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- `rg -n "field :product|object :product" lib/product_compare_web/schema.ex`
- `rg -n "get_product_by_slug|get_product!|list_merchant_products" lib/product_compare lib/product_compare_web`
- `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`
