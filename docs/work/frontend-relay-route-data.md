# Frontend Relay Route-Data Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-22 after merge-conflict review
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-19-frontend-relay-route-data-design.md`
  - `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
  - `docs/work/frontend-saved-comparisons-ui.md`
  - `docs/work/frontend-compare-saved-hardening.md`
- Definition of done:
  - `/products`, `/products/:slug`, `/compare`, `/compare/saved`, and the browser auth flows use Relay query or mutation APIs instead of route-local GraphQL strings and payload parsers.
  - React Router loaders only own URL parsing, local guards, redirects, and Relay preloading.
  - SSR and hydration share a serialized Relay store snapshot so route data fetched on the server is reused on first client paint.
  - The confusing route-local `api.ts` modules are deleted or replaced by explicit `loader.ts`, `queries/`, `fragments/`, or `mutations/` files.
  - The shipped compare/saved route flows no longer depend on the old manual fetch layer, so any remaining compare-route hardening can proceed on one stable data path.

## Verified Current State

- `assets/src/relay/environment.ts` and `assets/src/entry.client.tsx` already provide a Relay environment and provider, but route code still bypasses normal Relay APIs.
- `assets/src/relay/load-query.ts` exists as a thin wrapper, but no current route imports `graphql`, `usePreloadedQuery`, `useFragment`, or `useMutation`.
- `assets/src/routes/catalog/api.ts`, `assets/src/routes/products/api.ts`, `assets/src/routes/compare/api.ts`, and `assets/src/routes/auth/actions.ts` all own raw GraphQL strings, direct `fetchGraphQL(...)` calls, and payload normalization.
- `assets/src/router.tsx` still wires `/products`, `/products/:slug`, `/compare`, and `/compare/saved` through manual route loaders that return DTO-like status payloads instead of Relay preload data.
- `assets/src/entry.server.tsx` creates a request-scoped Relay environment, but the server render path does not serialize the populated store back into the client bootstrap.
- `assets/relay.config.json` exists and `assets/package.json` already includes Relay compiler/runtime dependencies, but `assets/src/__generated__/` still contains only `.gitkeep`.
- The saved-comparisons UI now ships for authenticated users, but both compare routes still extend the same manual GraphQL helper path that this slice is meant to replace.

## Next Batch

- Status: ready
- Batch: Task 1 from `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
- Why this batch:
  - The frontend already has enough Relay foundation to make route adoption tractable, but the missing SSR hydration/preload layer blocks the rest of the migration.
  - Landing the hydration primitives first keeps the route migrations incremental and avoids a one-shot rewrite.
  - `/compare/saved` and the compare save/delete flows have now landed on the manual compare helper path, so this migration is still required before more compare-route follow-up work continues.

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/**`, this file, `docs/work/frontend-saved-comparisons-ui.md`, and `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`
- Stop and record a blocker here if this batch requires `lib/**`, `priv/**`, backend GraphQL tests, or another lane's owned paths.

## Planned Follow-Up

- Re-open `docs/work/frontend-compare-saved-hardening.md` once the compare and saved-comparisons routes share the Relay data path.
- Keep any additional compare/saved route polish behind the Relay migration so those passes do not need to be redone across two data-layer patterns.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/frontend-relay-route-data.md`
- `sed -n '1,260p' docs/plans/2026-03-19-frontend-relay-route-data-design.md`
- `sed -n '1,320p' docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
- `sed -n '1,220p' assets/src/router.tsx`
- `sed -n '1,220p' assets/src/entry.server.tsx`
- `sed -n '1,220p' assets/src/entry.client.tsx`
- `rg -n 'fetchGraphQL|usePreloadedQuery|useMutation|graphql' assets/src`
