# Frontend Route Mutation GraphQL Errors Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-route-mutation-error-helper.md`
  - `docs/work/frontend-route-mutation-promise-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-mutation-graphql-errors-implementation-plan.md`
- Objective:
  - Keep compare and saved-comparison route mutation feedback consistent with Relay top-level GraphQL error handling.

## Verified Current State

- Auth mutation result helpers already treat Relay top-level GraphQL errors as transport failures before trusting payload data.
- `assets/src/routes/route-errors.ts` centralizes typed route mutation error messages and generic fallback handling for Relay top-level GraphQL errors.
- `/compare` save and `/compare/saved` delete completion handlers now treat top-level GraphQL errors as generic failures before trusting payload IDs.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Architecture identifies `/compare` and `/compare/saved` as delivered Relay mutation surfaces.
  - Review found these route mutations still trust partial payload success even when Relay reports top-level GraphQL errors.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/route-errors.ts`, `assets/src/routes/__tests__/route-errors.test.ts`, `assets/src/routes/compare/index.tsx`, `assets/src/routes/compare/saved.tsx`, `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, this file, and `docs/plans/2026-05-30-frontend-route-mutation-graphql-errors-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Compare Route Mutation GraphQL Error Handling

- Completed: 2026-05-30
- Outcome:
  - Extended `routeMutationErrorMessage(...)` with top-level Relay GraphQL error handling.
  - Added `hasRouteMutationGraphQLErrors(...)` for routes that need to block success paths before reading payload IDs.
  - Updated `/compare` save and `/compare/saved` delete completions to show generic route errors instead of success when Relay reports top-level GraphQL errors.
  - Added focused coverage for the shared helper, compare save feedback, and saved-comparison delete feedback.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
