# Frontend Compare Baseline Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at `ba235dc` + working tree
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-18-frontend-compare-baseline-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes an SSR-safe `/compare` route driven by repeated `slug` query params.
  - The route guards empty and over-limit selection states locally, then renders up to three compared products from the existing GraphQL product-detail surface.
  - Route-level tests cover the compare route's empty, limit, ready, and unavailable states without reopening saved-comparison persistence.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Verified Current State

- `assets/src/router.tsx` now mounts `/compare` with a route-local loader alongside `/`, `/products`, `/products/:slug`, and `/auth/*`.
- `assets/src/routes/root.tsx` now exposes `Compare products` links from both the app navigation and the home action row.
- `assets/src/routes/compare/api.ts` now parses repeated `slug` query params into route-local `empty`, `too_many`, and `ready` selection states.
- `assets/src/routes/compare/index.tsx` now renders the compare route shell plus terse empty and over-limit copy before any product data loading is introduced.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` now covers the route-local selection guards and shell rendering.
- `assets/src/routes/products/api.ts` already exports `loadProductDetail/2`, which can hydrate basic product cards by slug from the existing GraphQL `product(slug:)` query.
- `lib/product_compare_web/schema.ex` already exposes the `product(slug:)` and `merchantProducts(input:)` fields needed for a narrow compare route baseline.
- No saved-comparison persistence or GraphQL surface exists yet, so this slice must stay frontend-only and defer private saved sets.

## Progress

- [x] Task 1: compare route shell, navigation entry, and selection guards.
- [ ] Task 2: compare ready state with up to three product cards.
- [ ] Task 3: compare missing/unavailable states and slice verification.

## Current Batch

1. Execute Task 2 from `docs/plans/2026-03-18-frontend-compare-baseline-implementation-plan.md`.
2. Verify only the compare ready-state loader, route rendering, and the existing product-detail loader helper before editing.

## Next Batch

1. After Task 2 lands, advance `docs/plans/NOW.md` to Task 3 from the same implementation plan.
2. Keep saved comparisons, compare-entry affordances from browse/detail, and deeper spec alignment out of scope for this work doc.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-compare-baseline.md`
- `sed -n '1,260p' docs/plans/2026-03-18-frontend-compare-baseline-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `sed -n '1,280p' assets/src/routes/products/api.ts`
- `rg --files assets/src/routes | rg 'compare|root'`
- `rg -n 'field :product|field :merchantProducts|object :product' lib/product_compare_web/schema.ex`
