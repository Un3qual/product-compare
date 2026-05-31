# Frontend Saved Comparisons Relay Migration Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-05-30 after saved-route auth-code cleanup full verification
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
  - `docs/plans/2026-05-30-frontend-saved-comparisons-auth-code-cleanup-implementation-plan.md`
- Objective:
  - Move `/compare/saved` from the explicit manual `saved-data.ts` GraphQL helper path onto the existing Relay route preload and mutation APIs while preserving saved-set list, reopen, unauthorized, and delete behavior.

## Verified Current State

- `/products`, `/products/:slug`, `/compare`, and browser auth flows already use Relay query or mutation APIs with SSR store hydration.
- `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts` and `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts` now define the paginated Relay route query for saved-set list data.
- `assets/src/routes/compare/saved-data.ts` now preloads saved-set pages through `fetchRouteQuery`, returns Relay route query descriptors plus fallback summaries, and preserves pagination guards without owning saved-comparison mutation strings.
- `assets/src/routes/compare/mutations/DeleteSavedComparisonSetMutation.ts` and `assets/src/__generated__/DeleteSavedComparisonSetMutation.graphql.ts` now define the Relay delete mutation.
- `assets/src/router.tsx` mounts `/compare/saved` through `savedComparisonsLoader`, which now requires the router Relay context like the other Relay-backed route loaders.
- `assets/src/routes/compare/saved.tsx` now renders ready-state rows from Relay preloaded saved-set query data with loader summaries as the error-boundary fallback, and commits deletes through `useMutation(DeleteSavedComparisonSetMutation)`.
- `assets/src/routes/compare/saved-data.ts` treats structured `UNAUTHENTICATED` and `FORBIDDEN` GraphQL errors as saved-route auth state, and no longer accepts the legacy `UNAUTHORIZED` code.
- Existing saved-route coverage lives in `assets/src/routes/compare/__tests__/compare.route.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`, and `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - Task 1 moved saved-set list loading/rendering onto Relay route query descriptors.
  - Task 2 moved saved-set deletion onto a Relay mutation and removed the remaining raw saved-comparison mutation helper from `saved-data.ts`.
  - Task 3 recorded the completed `/compare/saved` Relay data path across dependent docs and the full frontend check passed.
  - The auth-code cleanup aligned saved-route auth detection with the current backend `UNAUTHENTICATED` contract and kept the lane complete.
  - No additional compare/saved polish is queued from this migration.

## Verification Commands

- `cd assets && bun run relay`
- `cd assets && bun run typecheck`
- `cd assets && bun run test:unit`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/**`, this file, `docs/work/frontend-relay-route-data.md`, `docs/work/frontend-saved-comparisons-ui.md`, `docs/work/frontend-compare-saved-hardening.md`, and `docs/plans/2026-05-29-frontend-saved-comparisons-relay-migration-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`
- Stop and record a blocker here if this batch requires `lib/**`, `priv/**`, backend GraphQL tests, or another lane's owned paths.

## Completed Batches

### Auth-Code Contract Cleanup

- Completed: 2026-05-30
- Outcome:
  - Tightened `/compare/saved` loader auth-state detection so only structured `UNAUTHENTICATED` and `FORBIDDEN` GraphQL errors are treated as the route's signed-out state.
  - Added a regression proving the legacy `UNAUTHORIZED` extension code is ignored instead of being normalized into saved-route auth state.
  - Preserved saved-route unauthorized, route-state, and compare-route behavior.
- Verification:
  - `cd assets && bun x vitest run src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`
  - `cd assets && bun x vitest run src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`

### Task 3: Queue Handoff And Full Frontend Check

- Completed: 2026-05-30
- Outcome:
  - Recorded that `/compare/saved` now uses Relay query/mutation APIs and no longer depends on raw saved-comparison GraphQL strings.
  - Updated dependent route-data, saved-comparisons UI, compare/saved hardening, architecture, queue index, and NOW docs to remove stale manual-helper follow-up language.
  - Kept dependent compare/saved work items closed; no new compare/saved UI polish batch is queued from this migration.
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun run typecheck`
  - `cd assets && bun run test:unit`
  - `git diff --check`

### Task 2: Saved-Set Delete Mutation Relay Migration

- Completed: 2026-05-29
- Outcome:
  - Added `DeleteSavedComparisonSetMutation` and generated its Relay artifact.
  - Updated `SavedComparisonsRoute` to commit deletes through Relay while preserving duplicate-click suppression, per-row pending state, typed error display, stale error clearing, local removal, and route status behavior.
  - Removed the manual `deleteSavedComparisonSet(...)` helper and raw saved-comparison mutation string from `saved-data.ts`.
  - Updated saved-route regression coverage to assert Relay mutation variables and callback behavior instead of direct `fetchGraphQL(...)` deletion.
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`

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
