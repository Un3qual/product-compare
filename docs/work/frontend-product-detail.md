# Frontend Product Detail Work Doc

## Snapshot

- Status: active (product-detail route data contract)
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after product-detail route-data candidate
  verification (55 route tests).
- Recently completed usable-product plan:
  - `docs/plans/2026-06-29-product-detail-decision-actions-implementation-plan.md`
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-17-frontend-product-detail-baseline-implementation-plan.md`
- Recently completed implementation plan:
  - `docs/plans/2026-06-27-project-product-detail-offer-pagination-implementation-plan.md`
- Recently completed shopper decision-confidence plan:
  - `docs/plans/2026-07-09-product-detail-price-observation-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes an SSR-safe `/products/:slug` route.
  - The route loads a product's basic detail data from GraphQL by slug and the browse page links into it.
  - Route-level tests cover success, missing-product, and unavailable states for the detail route.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Product Detail Route Data Contract

- Status: active on 2026-07-14 on `codex/route-policy-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: isolate selected-tab, overview-summary, encoded product-path,
  compare-action, and selected-item removal policy in a framework-free module
  while retaining Relay reads, router location and navigation, boundaries,
  tabs, layout, and presentation in `ProductDetailRoute`.
- Owned paths:
  - `assets/src/routes/products/product-detail-route-data.ts`
  - `assets/src/routes/products/ProductDetailRoute.tsx`
  - `assets/test/routes/products/product-detail-route-data.test.ts`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/product-detail-route-data.test.ts test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: pure route policy preserves tab selection, offer-cursor
  fallback, overview counts, encoded product paths, compare selection order,
  add/selected/full states, hashes, and unrelated search parameters.
- Candidate evidence: the existing product-detail route suite passed 55 tests,
  and current source inspection confirmed the cohesive deterministic policy
  remains embedded in the 376-line React route owner.
- Completed implementation evidence (awaiting coordinator dispatch closeout):
  - `product-detail-route-data.ts` now owns framework-free detail-tab
    selection, offer-cursor fallback, overview summaries, encoded product and
    compare paths, compare-action states, and selected-item removal. The route
    owner retains Relay reads, router navigation, boundaries, layout, and
    presentation.
  - RED: `cd assets && bun x vitest run
    test/routes/products/product-detail-route-data.test.ts` failed as expected
    because `product-detail-route-data` did not exist.
  - GREEN: `cd assets && bun x vitest run
    test/routes/products/product-detail-route-data.test.ts
    test/routes/products/detail.route.test.tsx` passed 67 tests.
  - `cd assets && bun run typecheck` completed with exit 0.
  - The direct/transitive import scan of `product-detail-route-data.ts` and its
    `compare/paths.ts` dependency found no React, Relay, router, StyleX, or
    Radix imports.

## Product Community Data Contract

- Status: done on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-trust-surface-view-data-contracts.md`.
- Next action: isolate review/question inputs, summary and accepted-answer
  labels, page cursors, and item merging in a framework-free module while
  retaining Relay operations, moderation feedback, forms, paging state,
  suspense, and presentation in `ProductCommunityPanel`.
- Owned paths:
  - `assets/src/routes/products/product-community-data.ts`
  - `assets/src/routes/products/ProductCommunityPanel.tsx`
  - `assets/test/routes/products/product-community-data.test.ts`
  - `assets/test/routes/products/product-community-panel.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: pure community policy preserves trimmed inputs, rating
  values, summary copy, accepted-answer labels, page cursors, and first-
  occurrence item ordering.
- Candidate evidence: the existing product-community suite passed 2 tests, and
  current source inspection confirmed its deterministic input, summary,
  cursor, and merge policy remains embedded in the 308-line React panel.
- Completed: framework-free community data now owns review, question, and
  answer input normalization; published-review summary and accepted-answer
  copy; next-page cursor selection; and first-occurrence item merging.
  `ProductCommunityPanel` retains Relay reads and mutations, moderation
  feedback, forms, paging state, suspense, and semantic presentation.
- Completed evidence:
  - RED: the new pure suite failed because `product-community-data` did not
    exist.
  - GREEN: the pure and existing community suites passed 8 tests.
  - Incoming pages now avoid duplicate IDs within the same page while
    preserving existing-first and page ordering.
  - The pure module has no React, Relay, router, StyleX, or Radix imports.
  - `cd assets && bun run typecheck` completed with exit 0.
  - `git diff --check` completed with exit 0.

## Product Detail Decision Actions Presentation Extraction

- Status: done on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-12-post-stack-ready-batches.md`.
- Next action: extract the accessible Next steps presentation behind explicit
  add, selected, and full compare states while preserving route-owned Relay,
  selection, navigation, and URL construction.
- Owned paths:
  - `assets/src/routes/products/ProductDecisionActions.tsx`
  - `assets/src/routes/products/ProductDetailRoute.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: decision-action presentation is isolated without changing
  encoded destinations, comparison state, offer cursors, tab hashes, or
  tray-return behavior.
- Completed: `ProductDecisionActions` now owns the accessible `Next steps`
  region, compare-state copy, and offer/catalog links behind an explicit
  `add`, `selected`, or `full` presentation contract. `ProductDetailRoute`
  retains compare selection parsing, maximum enforcement, encoded URL
  construction, Relay reads, navigation, and tray behavior.
- Completed evidence:
  - Baseline: the focused product-detail suite passed 51 tests before the
    extraction.
  - RED: the focused suite failed because the direct component tests could not
    resolve the not-yet-created `ProductDecisionActions` module.
  - GREEN: the focused suite passed 54 tests, including direct semantic
    coverage for all three compare states and the shared offer/catalog links.
  - Review follow-up added an exhaustive default that fails closed for invalid
    runtime states; the expanded focused suite passed 55 tests.
  - `cd assets && bun run typecheck` completed with exit 0.
  - `git diff --check` completed with exit 0.

## Product Not-Found HTTP Status Hardening

- Status: done on 2026-07-12.
- Plan: Task 5 in
  `docs/superpowers/plans/2026-07-12-project-quality-audit-remediation.md`.
- Completed: a GraphQL `product: null` result now returns typed React Router
  `not_found` data with HTTP 404. The existing product-not-found view and SSR
  Relay bootstrap remain available instead of becoming a thrown route error.
- RED: the focused product/SSR/API-token command ran 101 tests with four
  expected failures. The loader returned plain `not_found` data and SSR
  returned a 200 string for the missing product.
- GREEN: the expanded product loader/route and SSR suites passed as part of
  the 115-test Task 5 gate. `bun run typecheck`, `bun run relay:check`,
  `mix format --check-formatted`, and `git diff --check` passed.

## Product Detail Offer List Presentation Extraction

- Status: done on 2026-07-12.
- Plan: `docs/superpowers/plans/2026-07-12-next-presentation-boundaries.md`.
- Completed: Extracted active-offer list, merchant action, current price and
  observation, price-history rows, and coupon rows while preserving panel-owned
  normalization, safety checks, snapshot calculation, and pagination.
- Owned paths:
  - `assets/src/routes/products/ProductOfferPanel.tsx`
  - `assets/src/routes/products/ProductOfferList.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-detail.md`
- Prerequisite: the existing product-detail route suite is green and remains
  the characterization contract.
- Verification:
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: normalized active-offer presentation is isolated without
  changing safe-link filtering, price/date formatting, coupon/history output,
  snapshots, mixed-currency behavior, or pagination.
- Completed evidence:
  - RED: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
    failed as expected because `ProductOfferList` did not yet exist.
  - GREEN: the focused suite passed with 49 tests, including the new direct
    normalized-list presentation contract test.
  - `cd assets && bun run typecheck` completed with exit 0.
  - `git diff --check` completed with exit 0.

## 2026-07-11 Route Decomposition

- Status: done.
- Extracted active-offer normalization, the visible offer snapshot, tracked
  merchant actions, coupon and price-history summaries, and offer pagination
  into `ProductOfferPanel.tsx`.
- The route owner retains Relay query ownership, compare selection, detail-tab
  navigation, product overview, specifications, and route fallbacks; it
  decreased from 864 lines to 414 lines.
- Characterization verification:
  - Before extraction: 48 product-detail route tests passed.
  - After extraction: 48 product-detail route tests passed.
  - `cd assets && bun run typecheck` completed with exit 0.
  - `git diff --check` completed with exit 0.

## Product Detail Price Observation Evidence

- Status: done.
- Plan:
  `docs/plans/2026-07-09-product-detail-price-observation-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
  - `assets/src/routes/products/detail.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`
  - `docs/work/frontend-product-detail.md`
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: visible latest prices show their supported observation date,
  while missing or malformed dates leave the existing price and route behavior
  intact.
- Implemented:
  - `ProductOffersRouteQuery` now selects `latestPrice.observedAt` beside the
    existing latest price.
  - Visible latest-price rows render semantic `Price observed` calendar dates
    only for valid timestamps.
  - Missing or malformed timestamps omit the date claim without hiding the
    merchant action, latest price, snapshot, coupon, history, pagination, or
    compare behavior.
- Completed verification:
  - RED: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
    - 45 tests, 1 expected failure and 44 passes because the observation time
      element was missing.
  - GREEN: the same focused command - 45 tests, 0 failures.
  - `cd assets && bun run relay` - compiled 32 reader, 31 normalization, and 31
    operation text documents.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

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

## Completed Product-Facing Batch

- Status: done.
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

- Implemented route-local `Offer snapshot` rendering above the visible active
  offer list. The summary is derived from the already loaded active-offer page:
  visible offer count, lowest visible price with merchant name, loaded coupon
  availability count, and missing latest price count. Empty visible-offer pages
  omit the snapshot.
- RED: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - 33 tests, 1 failed as expected because the route had no accessible
    `Offer snapshot` region.
- GREEN: `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
  - 33 tests, 0 failures.
- `cd assets && bun run --bun typecheck`
  - `tsc --noEmit` completed with exit 0 using TypeScript 5.9.3.
- `git diff --check` - completed with exit 0.

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
