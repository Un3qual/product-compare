# Frontend Relay Route-Data Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-04-24 after Task 2 browse-route Relay migration verification
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

- `assets/src/relay/environment.ts`, `assets/src/relay/ssr.ts`, `assets/src/entry.client.tsx`, and `assets/src/entry.server.tsx` now seed/dehydrate Relay records through the SSR bootstrap while preserving the existing Relay provider.
- `assets/src/relay/load-query.ts` and `assets/src/relay/route-preload.ts` provide route-preload primitives for serializable descriptors plus in-memory query-ref reuse.
- `/products` now uses `assets/src/routes/catalog/loader.ts`, `assets/src/routes/catalog/queries/BrowseProductsRouteQuery.ts`, and `assets/src/__generated__/BrowseProductsRouteQuery.graphql.ts` instead of `assets/src/routes/catalog/api.ts`.
- `assets/src/routes/products/api.ts`, `assets/src/routes/compare/api.ts`, and `assets/src/routes/auth/actions.ts` still own raw GraphQL strings, direct `fetchGraphQL(...)` calls, and payload normalization.
- `assets/src/router.tsx` wires `/products` through a Relay preload loader, while `/products/:slug`, `/compare`, and `/compare/saved` still use manual route loaders that return DTO-like status payloads instead of Relay preload data.
- `assets/src/entry.server.tsx` creates a request-scoped Relay environment, exposes it through React Router loader context, and serializes the populated store back into a non-executable client bootstrap script.
- `assets/relay.config.json` exists, `assets/package.json` already includes Relay compiler/runtime dependencies, and browse now has a tracked generated Relay artifact.
- The saved-comparisons UI now ships for authenticated users, but both compare routes still extend the same manual GraphQL helper path that this slice is meant to replace.

## Next Batch

- Status: ready
- Batch: Task 3 from `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
- Why this batch:
  - The `/products` browse route now exercises the Relay preload path, so the next route-data migration can move the product detail and offers page onto the same pattern.
  - Migrating `/products/:slug` next removes another manual GraphQL wrapper while preserving the existing product-ready, missing-product, offer-empty, and offer-unavailable behavior.
  - `/compare/saved` and the compare save/delete flows have now landed on the manual compare helper path, so this migration is still required before more compare-route follow-up work continues.

## Completed Batches

### Task 2: Browse Route Relay Migration

- Completed: 2026-04-24
- Outcome:
  - Replaced `assets/src/routes/catalog/api.ts` with `assets/src/routes/catalog/loader.ts`, a Relay route query source, and the generated `BrowseProductsRouteQuery` artifact.
  - Updated `assets/src/routes/catalog/browse.tsx` to render from `usePreloadedQuery` via the route-preload descriptor while preserving ready, empty, and unavailable UI states.
  - Extended `assets/src/relay/route-preload.ts` so loader-created query refs can be reused during route render and recreated against a hydrated Relay environment on the client.
  - Updated `assets/schema.graphql` and `assets/.gitignore` so the browse query compiles and generated `.graphql.ts` artifacts can be tracked.
- Verification:
  - `cd assets && bun run relay && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`
  - `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/routes/catalog/__tests__/browse.route.test.tsx`
  - `cd assets && bun run typecheck`

### Task 1: Relay SSR Hydration And Route-Preload Primitives

- Completed: 2026-04-24
- Outcome:
  - Added `assets/src/relay/ssr.ts` for Relay store dehydration, HTML-safe bootstrap serialization, and client bootstrap parsing.
  - Added `assets/src/relay/route-preload.ts` for route query preloading descriptors and shared React Router loader context access to the Relay environment.
  - Updated `assets/src/relay/environment.ts`, `assets/src/entry.server.tsx`, `assets/src/entry.client.tsx`, and `assets/src/router.tsx` so SSR and hydration share seeded Relay records and loaders can use the request/client Relay environment.
  - Added focused coverage in `assets/src/relay/__tests__/route-preload.test.ts`, extended `assets/src/__tests__/entry.server.test.tsx`, and kept the entry-server error-handling tests aligned with the new environment options.
- Verification:
  - `cd assets && bun x vitest run src/relay/__tests__/route-preload.test.ts src/__tests__/entry.server.test.tsx src/__tests__/entry.server.error-handling.test.tsx`
  - `cd assets && bun run typecheck`

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
