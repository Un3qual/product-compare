# Frontend Route Mutation Record Guard Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-route-record-guards.md`
  - `docs/work/frontend-route-mutation-error-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-mutation-record-guard-implementation-plan.md`
- Objective:
  - Route mutation error-message normalization should use the shared route record guard for typed error entries.

## Verified Current State

- `assets/src/routes/route-records.ts` owns the shared route-level unknown-object guard and rejects arrays.
- `assets/src/routes/route-errors.ts` owns `routeMutationErrorMessage(...)` for compare route mutation feedback.
- `routeMutationErrorMessage(...)` now routes typed mutation error entry validation through `isRouteRecord(...)`, so array-shaped values with a string `message` property fall back to the generic route error message.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found route mutation error entry validation not using the shared record guard introduced for route payload normalization.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/__tests__/route-records.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/route-errors.ts`, `assets/src/routes/route-records.ts`, `assets/src/routes/__tests__/route-errors.test.ts`, `assets/src/routes/__tests__/route-records.test.ts`, `assets/src/routes/compare/__tests__/compare.route.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, this file, and `docs/plans/2026-05-30-frontend-route-mutation-record-guard-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Route Mutation Error Record Guard

- Completed: 2026-05-30
- Outcome:
  - Added focused `routeMutationErrorMessage(...)` coverage for array-shaped payload entries with a string `message` property.
  - Replaced route error-local object validation with the shared `isRouteRecord(...)` guard.
  - Preserved compare and saved-comparison route mutation error fallback behavior.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/__tests__/route-records.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
