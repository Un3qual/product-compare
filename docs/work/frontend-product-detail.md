# Frontend Product Detail Work Doc

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at `ca3197b` + working tree
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- Current implementation plan:
  - `docs/plans/2026-06-27-project-product-detail-offer-pagination-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes an SSR-safe `/products/:slug` route.
  - The route loads a product's basic detail data from GraphQL by slug and the browse page links into it.
  - Route-level tests cover success, missing-product, and unavailable states for the detail route.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Current Cross-Project Batch

- Status: ready.
- Plan: `docs/plans/2026-06-27-project-product-detail-offer-pagination-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/products/loader.ts`
  - `assets/src/routes/products/detail.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products/:slug` paginates active offers with URL-driven next and first links.

## Verified Current State

- `assets/src/routes/catalog/browse.tsx` now renders the first catalog page on `/products` with success, empty, and unavailable states.
- Browse product rows now link product names to `/products/:slug` destinations without widening the list query.
- `ProductCompare.Catalog.get_product_by_slug/1` now preloads `brand`, and `lib/product_compare_web/schema.ex` now exposes `product(slug: String!)` for single-product GraphQL lookup.
- `assets/src/routes/products/api.ts` now returns route-local `ready`, `not_found`, and `error` states for `/products/:slug`.
- `assets/src/routes/products/detail.tsx` now renders the product success state plus missing-product and unavailable fallback copy without introducing a route error boundary.
- `assets/src/routes/products/__tests__/detail.route.test.tsx` now covers success, missing-product, and unavailable detail states.
- The older fullstack frontend plan remains too broad to execute directly; the next slice needs a narrow rebaseline from the current codebase.

## Completed

- Rebaselined the next frontend slice into `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`.
- Completed Task 1 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding the single-product GraphQL query, resolver path, and regression coverage.
- Completed Task 2 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding the `/products/:slug` loader, route shell, browse links, and focused route coverage.
- Completed Task 3 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding missing-product and unavailable detail states plus slice verification.

## Previous Steady State

1. The 2026-03-17 product-detail baseline batch is complete.
2. The current cross-project follow-up is listed above and dispatched from
   `docs/work/index.md`.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-product-detail.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- `rg -n "field :product|object :product" lib/product_compare_web/schema.ex`
- `rg -n "get_product_by_slug|get_product!|list_merchant_products" lib/product_compare lib/product_compare_web`
- `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`
