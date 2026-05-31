# Frontend Route Mutation Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-saved-comparisons-relay-migration.md`
  - `docs/work/frontend-route-loader-error-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-mutation-error-helper-implementation-plan.md`
- Objective:
  - Centralize route-local Relay mutation error-message fallback handling so compare save and saved-set delete flows do not repeat `errors[0]?.message ?? DEFAULT_ROUTE_ERROR_MESSAGE`.

## Verified Current State

- `/compare` and `/compare/saved` commit their user-triggered mutations through Relay.
- `assets/src/routes/route-errors.ts` owns the default route error message.
- `routeMutationErrorMessage(...)` owns first typed mutation error message extraction plus default fallback handling.
- Compare save and saved-set delete route components use the shared helper for typed mutation payload failures.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found duplicated route mutation error fallback handling after the Relay mutation migrations.
  - A shared helper keeps compare route mutation feedback consistent as route-local mutations grow.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/**`, this file, and `docs/plans/2026-05-30-frontend-route-mutation-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Route Mutation Error Message Helper

- Completed: 2026-05-30
- Outcome:
  - Added `routeMutationErrorMessage(...)` beside `DEFAULT_ROUTE_ERROR_MESSAGE`.
  - Replaced duplicated first typed mutation error message fallback handling in `/compare` save and `/compare/saved` delete flows.
  - Added focused helper coverage for typed mutation messages plus missing, empty, malformed, and message-less fallback cases.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
