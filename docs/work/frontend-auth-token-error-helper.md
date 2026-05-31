# Frontend Auth Token Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-auth-migration.md`
  - `docs/work/frontend-auth-action-success.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-auth-token-error-helper-implementation-plan.md`
- Objective:
  - Centralize browser auth token-link mutation error construction in the shared auth helper module.

## Verified Current State

- Browser auth routes use Relay mutations over `/api/graphql`.
- `assets/src/routes/auth/errors.ts` owns auth mutation payload, result, transport-error, and action-success normalization.
- Reset-password and verify-email each define the same `INVALID_TOKEN` typed mutation error shape for missing URL tokens, with route-specific messages.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found duplicated auth token-link error construction after related auth mutation helpers moved into `assets/src/routes/auth/errors.ts`.

## Verification Commands

- `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`
- `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/recovery.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/auth/**`, `assets/src/routes/auth/__tests__/**`, this file, and `docs/plans/2026-05-30-frontend-auth-token-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Auth Token Error Helper

- Completed: 2026-05-30
- Outcome:
  - Added `invalidTokenMutationError(message)` in `assets/src/routes/auth/errors.ts`.
  - Replaced reset-password and verify-email route-local missing-token error literals with the shared helper.
  - Preserved route-specific missing-token messages, token guards, and verify-email request-cache behavior.
- Verification:
  - `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts`
  - `cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/recovery.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
