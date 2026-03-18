# NOW

## Current Batch

- Status: ready
- Batch: Frontend catalog browse
- Source of truth: `docs/work/frontend-catalog-browse.md`
- Implementation plan: `docs/plans/2026-03-17-frontend-catalog-browse-implementation-plan.md`
- Why this is current:
  - The auth migration follow-up is now closed by an explicit transport deferral decision.
  - The frontend already has SSR, GraphQL transport helpers, and auth routes, but no product-discovery route beyond `/`.
  - The backend already exposes the paginated `products` GraphQL query needed for a first browse slice.

## Just Completed

- GraphQL auth migration follow-up:
  - Decision/status doc added at `docs/decisions/2026-03-17-auth-token-delivery-deferral.md`.
  - `docs/work/graphql-auth-migration.md` is closed.
