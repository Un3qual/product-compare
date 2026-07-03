# Frontend Product Detail Work Doc

## Snapshot

- Status: done (persistent compare tray detail support)
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-01 after persistent compare tray verification
- Recently completed usable-product plan:
  - `docs/plans/2026-06-29-product-detail-decision-actions-implementation-plan.md`
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- Recently completed implementation plan:
  - `docs/plans/2026-06-27-project-product-detail-offer-pagination-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes an SSR-safe `/products/:slug` route.
  - The route loads a product's basic detail data from GraphQL by slug and the browse page links into it.
  - Route-level tests cover success, missing-product, and unavailable states for the detail route.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Current Usable Product Batch

- Status: done.
- Plan:
  `docs/plans/2026-06-29-product-detail-decision-actions-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/products/detail.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products/:slug` makes compare and offer review obvious
  while preserving active-offer pagination and existing data contracts.
- Completed evidence:
  - RED: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
    - 27 tests, 1 failed as expected because the route had no accessible
      `Next steps` decision region.
  - GREEN: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
    - 27 tests, 0 failures.
  - `cd assets && bun run typecheck` - `tsc --noEmit` completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Completed Persistent Compare Tray Detail Support

- Status: done.
- Plan:
  `docs/plans/2026-07-01-persistent-compare-tray-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/products/detail.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Implemented:
  - `/products/:slug` now parses repeated `slug` params from the URL and
    renders the shared selected-products tray near the product summary.
  - The detail compare action now adds the current product in place while
    preserving route-local `offersAfter` params.
  - Tray remove links rewrite only compare slugs and preserve detail route
    params; removing the last selected product drops compare slugs while keeping
    route-local params such as `offersAfter`.
  - `Browse products` return links preserve selected compare slugs as
    repeated `slug` params on `/products`.
- Verification:
  - RED: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx -t "persistent compare tray|adds the current detail product|preserves compare slugs|Compare this product|Add this product"` - failed as expected with 3 failed tests and 28 skipped because the detail route still had the old direct compare link and no shared tray.
  - GREEN: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx -t "persistent compare tray|adds the current detail product|preserves compare slugs|Compare this product|Add this product"` - 3 passed, 28 skipped.
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx` - 31 tests, 0 failures.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx` - 163 tests, 0 failures.
  - `cd assets && bun run typecheck` - `tsc --noEmit` completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Queued Product-Facing Batch

- Status: ready.
- Plan:
  `docs/plans/2026-07-02-product-detail-offer-summary-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/products/detail.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products/:slug` summarizes the visible active-offer page
  without changing empty, unavailable, paginated, coupon, price-history, or
  compare-selection behavior.

### Product Detail Offer Summary Evidence

- Queued row evidence belongs here when the row completes.

## Current Cross-Project Batch

- Status: done.
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
- Completed verification:
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx` - 25 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Verified Current State

- `assets/src/routes/catalog/browse.tsx` now renders the first catalog page on `/products` with success, empty, and unavailable states.
- Browse product rows now link product names to `/products/:slug` destinations without widening the list query.
- `ProductCompare.Catalog.get_product_by_slug/1` now preloads `brand`, and `lib/product_compare_web/schema.ex` now exposes `product(slug: String!)` for single-product GraphQL lookup.
- `assets/src/routes/products/api.ts` now returns route-local `ready`, `not_found`, and `error` states for `/products/:slug`.
- `assets/src/routes/products/detail.tsx` now renders the product success state plus missing-product and unavailable fallback copy without introducing a route error boundary.
- `assets/src/routes/products/__tests__/detail.route.test.tsx` now covers success, missing-product, and unavailable detail states.
- The older fullstack frontend plan remains too broad to execute directly; the next slice needs a narrow rebaseline from the current codebase.
- `assets/src/routes/products/loader.ts` now parses `offersAfter` from `/products/:slug` URLs and forwards it as `after` to `ProductOffersRouteQuery` for URL-driven active-offer pagination.
- `assets/src/routes/products/detail.tsx` now renders offer-section pagination links (`First offers` and `Next offers`) using slug-safe and cursor-safe product URLs.
- `assets/test/routes/products/detail.route.test.tsx` now covers `offersAfter` forwarding and offer pagination links under active-offer pagination.
- `assets/src/routes/products/detail.tsx` now renders a `Next steps`
  decision block near the product summary with compare, offer-review, and
  browse-product links without changing Relay query fields.
- `assets/src/routes/products/detail.tsx` now renders URL-backed compare
  selections in the shared tray, adds the current product in place while
  preserving `offersAfter`, and preserves compare slugs on browse-return links.
- `assets/test/routes/products/detail.route.test.tsx` now covers the decision
  block destinations, including encoded product slugs and product IDs, while
  preserving active-offer pagination coverage.

## Completed

- Rebaselined the next frontend slice into `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`.
- Completed Task 1 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding the single-product GraphQL query, resolver path, and regression coverage.
- Completed Task 2 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding the `/products/:slug` loader, route shell, browse links, and focused route coverage.
- Completed Task 3 from `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md` by adding missing-product and unavailable detail states plus slice verification.

## Previous Steady State

1. The 2026-03-17 product-detail baseline batch is complete.
2. The 2026-06-27 active-offer pagination follow-up is complete.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-product-detail.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- `rg -n "field :product|object :product" lib/product_compare_web/schema.ex`
- `rg -n "get_product_by_slug|get_product!|list_merchant_products" lib/product_compare lib/product_compare_web`
- `cd assets && bun x vitest run src/routes/products/__tests__/detail.route.test.tsx src/routes/catalog/__tests__/browse.route.test.tsx`
