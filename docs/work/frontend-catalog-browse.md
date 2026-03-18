# Frontend Catalog Browse Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-17 at `337dd87`
- Historical context:
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-05-frontend-fullstack-implementation-plan.md`
  - `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Definition of done:
  - The Bun frontend exposes a `/products` route with SSR-safe rendering.
  - The route loads the first page of products from the existing GraphQL `products` connection.
  - Root navigation and route-level tests cover the browse entry point plus success and basic fallback states.
  - `docs/work/index.md` and `docs/plans/NOW.md` reflect the resulting steady state.

## Verified Current State

- `assets/src/router.tsx` now mounts `/products` with a route loader alongside `/` and the auth routes under `/auth/*`.
- `assets/src/routes/root.tsx` now exposes `Browse products` links from both the app navigation and the home action row.
- `assets/src/routes/catalog/api.ts` now loads the first `products(first: 12)` page and normalizes typed product rows for the route.
- `assets/src/routes/catalog/browse.tsx` now renders product name, slug, and brand rows from route loader data on `/products`.
- `assets/src/entry.server.tsx` now uses React Router's static handler/static router path so `/products` can SSR its loader data and hydrate on the client.
- The frontend already has Bun SSR, route-level tests, and a shared GraphQL transport helper in `assets/src/relay/fetch-graphql.ts`.
- The backend already exposes the paginated `products` query in `lib/product_compare_web/schema.ex` with coverage in `test/product_compare_web/graphql/catalog_queries_test.exs`.

## Completed

- Rebaselined the next frontend slice into a current implementation plan at `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`.
- Completed Task 1 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by adding the `/products` route shell, root browse links, and focused route tests.
- Completed Task 2 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` by wiring the typed browse loader, route rendering, and SSR hydration path for `/products`.

## Next Batch

1. Execute Task 3 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` to add empty and unavailable states for `/products`.
2. Run the slice verification and close this work doc once those states are covered.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-catalog-browse.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `rg -n "field :products" lib/product_compare_web/schema.ex`
