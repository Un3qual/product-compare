# NOW

## Current Batch

- Status: in progress
- Batch: Frontend catalog browse
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Implementation plan: `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Next step: execute Task 2 from `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Why this is current:
  - The auth migration follow-up is now closed by an explicit transport deferral decision.
  - The frontend now exposes `/products`, but the route still renders only the shell instead of GraphQL product data.
  - The backend already exposes the paginated `products` GraphQL query needed for a first browse slice.

## Just Completed

- Frontend catalog browse Task 1:
  - Added the `/products` route shell in `assets/src/routes/catalog/browse.tsx`.
  - Registered the route in `assets/src/router.tsx` and linked to it from `assets/src/routes/root.tsx`.
  - Added focused route tests for the browse shell and root browse link.
- GraphQL auth migration follow-up:
  - Decision/status doc added at `docs/decisions/2026-03-17-auth-token-delivery-deferral.md`.
  - `docs/work/graphql-auth-migration.md` is closed.
