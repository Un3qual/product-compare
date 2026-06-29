# Frontend Catalog Browse Work Doc

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-27 (working tree)
- Active implementation plan:
  - `docs/plans/2026-06-29-product-catalog-decision-cards-implementation-plan.md`
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Recently completed implementation plan:
  - `docs/plans/2026-06-27-project-catalog-browse-page-size-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes a `/products` route with SSR-safe rendering.
  - The route loads the first page of products from the existing GraphQL `products` connection.
  - Root navigation and route-level tests cover the browse entry point plus success, empty, and unavailable states.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Current Usable Product Batch

- Status: ready.
- Plan:
  `docs/plans/2026-06-29-product-catalog-decision-cards-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products` cards expose clear detail, compare, and offer
  actions without backend or Relay schema changes.
- Pending evidence:
  - Worker should record route-test, typecheck, and whitespace verification
    output here when the row is implemented.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-catalog-browse-page-size-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/catalog/loader.ts`
  - `assets/src/routes/catalog/browse.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `docs/work/frontend-catalog-browse.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/products` accepts bounded `first` values and preserves page size through pagination.
- Completed verification:
  - `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx` - 22 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Verified Current State

- `assets/src/router.tsx` now mounts `/products` with a route loader alongside `/` and the auth routes under `/auth/*`.
- `assets/src/routes/root.tsx` now exposes `Browse products` links from both the app navigation and the home action row.
- `assets/src/routes/catalog/api.ts` now loads the first `products(first: 12)` page and normalizes typed product rows for the route.
- `assets/src/routes/catalog/api.ts` now returns route-local `"ready"` and `"error"` states so failed fetches render fallback UI instead of rejecting the route.
- `assets/src/routes/catalog/browse.tsx` now renders product name, slug, and brand rows from route loader data on `/products`, plus empty and unavailable fallback copy.
- `assets/src/entry.server.tsx` now uses React Router's static handler/static router path so `/products` can SSR its loader data and hydrate on the client.
- `assets/src/routes/catalog/loader.ts` now parses `first` from `/products` URL params with default `12`, max `48`, and malformed/oversized fallback behavior.
- `assets/src/routes/catalog/browse.tsx` now renders a compact `Products per page` control (`12`, `24`, `48`) and preserves `first` in `Next products` and `First products` links.
- `assets/test/routes/catalog/browse.route.test.tsx` now covers page-size normalization, selected page-size rendering, and pagination link preservation.
- The frontend already has Bun SSR, route-level tests, and a shared GraphQL transport helper in `assets/src/relay/fetch-graphql.ts`.
- The backend already exposes the paginated `products` query in `lib/product_compare_web/schema.ex` with coverage in `test/product_compare_web/graphql/catalog_queries_test.exs`.

## Completed

- Rebaselined the next frontend slice into a current implementation plan at `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`.
- Completed Task 1 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by adding the `/products` route shell, root browse links, and focused route tests.
- Completed Task 2 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by wiring the typed browse loader, route rendering, and SSR hydration path for `/products`.
- Completed Task 3 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by adding empty/unavailable state handling, focused route regressions, and slice verification.

## Previous Steady State

1. The 2026-03-17 catalog browse baseline batch is complete.
2. The 2026-06-27 cross-project page-size follow-up is complete.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-catalog-browse.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `rg -n "field :products" lib/product_compare_web/schema.ex`
