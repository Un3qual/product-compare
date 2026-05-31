# Frontend Route Mutation Error Guard Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-auth-mutation-results.md`
  - `docs/work/frontend-route-mutation-error-shape.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-mutation-error-guard-implementation-plan.md`
- Objective:
  - Browser auth and compare route mutation normalization should share typed GraphQL mutation error entry validation.

## Verified Current State

- `assets/src/routes/route-errors.ts` exports `RouteMutationError` and `isRouteMutationError(...)` for typed GraphQL mutation error payload entries.
- `assets/src/routes/auth/errors.ts` now aliases its mutation error type to the shared route type and filters payload errors through `isRouteMutationError(...)`.
- Browser auth and compare mutation payload parsing now share typed GraphQL mutation error entry validation.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found duplicate typed GraphQL mutation error entry validation in route mutation feedback and browser auth mutation normalization.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/route-errors.ts`, `assets/src/routes/auth/errors.ts`, `assets/src/routes/__tests__/route-errors.test.ts`, `assets/src/routes/auth/__tests__/errors.test.ts`, `assets/src/routes/auth/__tests__/session.route.test.tsx`, `assets/src/routes/auth/__tests__/recovery.route.test.tsx`, `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`, `assets/src/routes/compare/__tests__/compare.route.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, this file, and `docs/plans/2026-05-30-frontend-route-mutation-error-guard-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Route Mutation Error Guard

- Completed: 2026-05-30
- Outcome:
  - Exported `RouteMutationError` and `isRouteMutationError(...)` from `assets/src/routes/route-errors.ts`.
  - Routed browser auth mutation payload error filtering through the shared typed mutation error guard.
  - Removed the duplicate private auth mutation error guard.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
