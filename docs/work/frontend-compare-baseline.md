# Frontend Compare Baseline Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at `aa9faad` + working tree
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
- `assets/src/routes/compare/api.ts` now reuses `loadProductDetail/2` to hydrate up to three compared products in URL order for the compare ready state.
- `assets/src/routes/compare/api.ts` now returns route-local `not_found` and `error` states when any selected product is missing or its detail request fails.
- `assets/src/routes/compare/index.tsx` now renders simple comparison cards with product name, brand, slug, and description for ready-state selections.
- `assets/src/routes/compare/index.tsx` now renders route-local missing-product and unavailable fallback copy without collapsing the compare shell.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` now covers route-local selection guards plus ready, missing-product, and unavailable compare states.
- `assets/src/routes/products/api.ts` already exports `loadProductDetail/2`, which can hydrate basic product cards by slug from the existing GraphQL `product(slug:)` query.
- `lib/product_compare_web/schema.ex` already exposes the `product(slug:)` and `merchantProducts(input:)` fields needed for a narrow compare route baseline.
- No saved-comparison persistence or GraphQL surface exists yet, so this slice must stay frontend-only and defer private saved sets.

## Completed

- Rebaselined the next frontend slice into `docs/plans/2026-03-18-frontend-compare-baseline-implementation-plan.md`.
- Task 1 complete: `/compare` now ships the route shell, compare navigation entry, and route-local empty and over-limit guards.
- Task 2 complete: the compare route now renders up to three product cards from the existing product-detail GraphQL path while preserving URL order.
- Task 3 complete: the compare route now distinguishes missing-product and unavailable states locally and verification covers the focused route test, frontend typecheck, and frontend unit suite.

## Closure

- This work item is complete.
- No next active batch is queued under `docs/work/index.md`.
- The repo-level fallback for creating the next plan remains blocked because `docs/plans/INDEX.md` and `ARCHITECTURE.md` are absent.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-compare-baseline.md`
- `sed -n '1,260p' docs/plans/2026-03-18-frontend-compare-baseline-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `sed -n '1,280p' assets/src/routes/products/api.ts`
- `rg --files assets/src/routes | rg 'compare|root'`
- `rg -n 'field :product|field :merchantProducts|object :product' lib/product_compare_web/schema.ex`
- `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run test:unit`
