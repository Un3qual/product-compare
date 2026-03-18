# Frontend Catalog Browse Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-17 at `7fdb580`
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

- `assets/src/router.tsx` currently mounts only `/` plus the auth routes under `/auth/*`.
- `assets/src/routes/root.tsx` links to auth entry points only and does not expose a browse route yet.
- The frontend already has Bun SSR, route-level tests, and a shared GraphQL transport helper in `assets/src/relay/fetch-graphql.ts`.
- The backend already exposes the paginated `products` query in `lib/product_compare_web/schema.ex` with coverage in `test/product_compare_web/graphql/catalog_queries_test.exs`.
- No `assets/src/routes/catalog` directory exists yet.

## Completed

- Rebaselined the next frontend slice into a current implementation plan at `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`.

## Next Batch

1. Execute Task 1 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md` to add the browse route shell and root navigation entry point.
2. Continue with Task 2 for the typed products loader once the route shell exists.
3. Finish with Task 3 to cover empty/unavailable states and close this slice.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-catalog-browse.md`
- `sed -n '1,260p' docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/routes/root.tsx`
- `rg -n "field :products" lib/product_compare_web/schema.ex`
