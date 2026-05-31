# Frontend Auth Mutation Results Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-relay-route-data.md`
  - `docs/work/graphql-auth-migration.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-auth-mutation-result-helper-implementation-plan.md`
- Objective:
  - Centralize Relay auth mutation result normalization so login, registration, recovery, and verification flows share one top-level GraphQL error and payload-result boundary.

## Verified Current State

- Browser auth routes use Relay mutations over `/api/graphql`.
- `assets/src/routes/auth/errors.ts` owns mutation payload and transport-error normalization.
- `resolveSessionMutationResult/2` and `resolveActionMutationResult/2` compose top-level Relay GraphQL error handling with the existing auth payload normalizers.
- `login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`, and `verify-email.tsx` now consume the shared auth mutation result helpers.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found duplicated Relay auth mutation result handling after the auth-route Relay migration.
  - The shared-result cleanup is complete and no broader auth-route refactor is queued from this pass.

## Verification Commands

- `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/auth/**`, `assets/src/routes/auth/__tests__/**`, this file, and `docs/plans/2026-05-30-frontend-auth-mutation-result-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Auth Mutation Result Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused coverage for shared session/action mutation result helpers.
  - Added `resolveSessionMutationResult/2` and `resolveActionMutationResult/2` to centralize Relay top-level GraphQL error handling with auth payload normalization.
  - Routed login, registration, forgot-password, reset-password, and verify-email mutation completions through the shared helpers.
- Verification:
  - `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`
  - `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
