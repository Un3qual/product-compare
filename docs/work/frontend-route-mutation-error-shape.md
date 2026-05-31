# Frontend Route Mutation Error Shape Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-route-mutation-error-helper.md`
  - `docs/work/frontend-route-mutation-record-guard.md`
  - `docs/work/frontend-route-graphql-error-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-mutation-error-shape-implementation-plan.md`
- Objective:
  - Route mutation error-message extraction should only trust GraphQL typed mutation error objects with the expected `code`, `message`, and optional `field` shape.

## Verified Current State

- `assets/src/routes/route-errors.ts` owns route mutation error-message fallback handling.
- `routeMutationErrorMessage(...)` now rejects array-shaped entries through `isRouteRecord(...)`.
- `routeMutationErrorMessage(...)` now only accepts route records with a string `code`, string `message`, and missing, null, or string `field`.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found route mutation error entry validation looser than the GraphQL typed mutation error contract used by compare and saved-comparison mutations.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/route-errors.ts`, `assets/src/routes/__tests__/route-errors.test.ts`, `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`, `assets/src/routes/compare/__tests__/compare.route.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, this file, and `docs/plans/2026-05-30-frontend-route-mutation-error-shape-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Route Mutation Error Shape

- Completed: 2026-05-30
- Outcome:
  - Added focused coverage rejecting message-only mutation error entries and entries with malformed `field` values.
  - Tightened `routeMutationErrorMessage(...)` typed error entry validation to require string `code`, string `message`, and optional string/null `field`.
  - Preserved compare save and saved-comparison delete mutation feedback behavior.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
