# Frontend Auth Transport Errors Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-auth-migration.md`
  - `docs/work/frontend-auth-mutation-results.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-auth-transport-error-helper-implementation-plan.md`
- Objective:
  - Centralize auth route transport-error array construction so Relay auth mutation routes share one error-list helper.

## Verified Current State

- Browser auth routes use Relay mutations over `/api/graphql`.
- `assets/src/routes/auth/errors.ts` owns auth mutation payload, result, and transport-error normalization.
- `login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`, and `verify-email.tsx` still repeat `[transportMutationError(error)]` when setting route-local transport failures.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found repeated auth transport-error list construction after auth mutation result normalization moved into the shared auth helper module.

## Verification Commands

- `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`
- `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/auth/**`, `assets/src/routes/auth/__tests__/**`, this file, and `docs/plans/2026-05-30-frontend-auth-transport-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Auth Transport Error List Helper

- Completed: 2026-05-30
- Outcome:
  - Added `transportMutationErrors(error)` in `assets/src/routes/auth/errors.ts` to centralize the standard single transport-error list.
  - Replaced repeated `[transportMutationError(error)]` construction in login, register, forgot-password, reset-password, and verify-email routes.
  - Preserved route-local form state, navigation, request-version guards, and success-message behavior.
- Verification:
  - `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`
  - `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
