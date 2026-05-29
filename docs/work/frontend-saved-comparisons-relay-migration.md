# Frontend Saved Comparisons Relay Migration Work Doc

## Snapshot

- Status: in_progress
- Priority: P1
- Source of truth: this file
- Last verified: 2026-05-29 after Task 1 focused verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-19-frontend-relay-route-data-design.md`
  - `docs/plans/2026-03-19-frontend-relay-route-data-implementation-plan.md`
  - `docs/work/frontend-relay-route-data.md`
  - `docs/work/frontend-saved-comparisons-ui.md`
  - `docs/work/frontend-compare-saved-hardening.md`
- Current implementation plan:
  - `docs/plans/2026-05-29-frontend-saved-comparisons-relay-migration-implementation-plan.md`
- Objective:
  - Move `/compare/saved` from the explicit manual `saved-data.ts` GraphQL helper path onto the existing Relay route preload and mutation APIs while preserving saved-set list, reopen, unauthorized, and delete behavior.

## Verified Current State

- `/products`, `/products/:slug`, `/compare`, and browser auth flows already use Relay query or mutation APIs with SSR store hydration.
- `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts` and `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts` now define the paginated Relay route query for saved-set list data.
- `assets/src/routes/compare/saved-data.ts` now preloads saved-set pages through `fetchRouteQuery`, returns Relay route query descriptors plus fallback summaries, preserves pagination guards, and still owns the manual `deleteSavedComparisonSet(...)` helper for Task 2.
- `assets/src/router.tsx` mounts `/compare/saved` through `savedComparisonsLoader`, which now requires the router Relay context like the other Relay-backed route loaders.
- `assets/src/routes/compare/saved.tsx` now renders ready-state rows from Relay preloaded saved-set query data with loader summaries as the error-boundary fallback, and still calls the manual `deleteSavedComparisonSet(...)` helper.
- Existing saved-route coverage lives in `assets/src/routes/compare/__tests__/compare.route.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`, and `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`.

## Next Batch

- Status: in_progress
- Batch: Task 2, Saved-Set Delete Mutation Relay Migration
- Why this batch:
  - Task 1 moved saved-set list loading/rendering onto Relay route query descriptors.
  - The remaining raw saved-comparison GraphQL string is the delete mutation helper in `assets/src/routes/compare/saved-data.ts`.
  - Moving the delete mutation next completes the `/compare/saved` Relay data path without introducing new backend scope.
- Scope:
  - Add a Relay mutation source for `deleteSavedComparisonSet`.
  - Change `SavedComparisonsRoute` to commit deletes through `useMutation`.
  - Preserve duplicate-click suppression, per-row pending state, typed error display, stale error clearing, local deletion removal, and route status behavior.
- Out of scope:
  - Backend GraphQL schema changes.
  - New compare/saved UI polish beyond preserving existing behavior.

## Verification Commands

- `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx`
- `cd assets && bun run relay`
- `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/**`, this file, `docs/work/frontend-relay-route-data.md`, `docs/work/frontend-saved-comparisons-ui.md`, `docs/work/frontend-compare-saved-hardening.md`, and `docs/plans/2026-05-29-frontend-saved-comparisons-relay-migration-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`
- Stop and record a blocker here if this batch requires `lib/**`, `priv/**`, backend GraphQL tests, or another lane's owned paths.

## Completed Batches

### Task 1: Saved-Set List Query Relay Migration

- Completed: 2026-05-29
- Outcome:
  - Added `SavedComparisonsRouteQuery` and generated its Relay artifact.
  - Rewrote `savedComparisonsLoader` to fetch paginated saved-set pages through `fetchRouteQuery`, return route query descriptors plus fallback summaries, and preserve unauthorized, page-cap, cursor, empty, and abort behavior.
  - Modified `SavedComparisonsRoute` to render ready-state saved-set rows from Relay preloaded query records with loader summaries as the route-local error-boundary fallback.
  - Converted saved-route tests from direct `fetchGraphQL(...)` loader assertions to the Relay loader contract.
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`
