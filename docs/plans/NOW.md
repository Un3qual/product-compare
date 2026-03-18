# NOW

## Current Batch

- Status: in progress
- Batch: Frontend catalog browse
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Implementation plan: `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Next step: execute Task 3 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Why this is current:
  - The auth migration follow-up is now closed by an explicit transport deferral decision.
  - The frontend now loads and SSR-renders the first `products(first: 12)` page on `/products`.
  - The remaining browse gap is route-level handling for empty and unavailable catalog states.
  - The backend already exposes the paginated `products` GraphQL query needed for a first browse slice.

## Just Completed

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
