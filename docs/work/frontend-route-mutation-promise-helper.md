# Frontend Route Mutation Promise Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-auth-mutation-results.md`
  - `docs/work/frontend-route-form-data-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-mutation-promise-helper-implementation-plan.md`
- Objective:
  - Centralize promise-based Relay route mutation handling used by the verify-email single-use token flow.

## Verified Current State

- `assets/src/routes/relay-mutations.ts` wraps synchronous Relay commit failures for route actions.
- `assets/src/routes/relay-mutations.ts` now also owns promise-based Relay route mutation completion handling.
- `assets/src/routes/auth/verify-email.tsx` now uses the shared promise helper instead of owning a route-local `new Promise(...)` wrapper around Relay commits.
- Verify-email route tests already cover Relay success, transient retry, top-level GraphQL error retry, failed-payload retry, and StrictMode single-submit behavior.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Architecture already identifies Relay-backed auth routes as delivered frontend baseline.
  - Review found the verify-email route still carries reusable Relay commit-to-promise plumbing that belongs beside the existing route mutation helper.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts src/routes/auth/__tests__/recovery.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/relay-mutations.ts`, `assets/src/routes/__tests__/relay-mutations.test.ts`, `assets/src/routes/auth/verify-email.tsx`, `assets/src/routes/auth/__tests__/recovery.route.test.tsx`, this file, and `docs/plans/2026-05-30-frontend-route-mutation-promise-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Route Mutation Promise Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Added `commitRouteMutationPromise(...)` beside the existing route mutation commit helper.
  - Added focused helper coverage for completed Relay responses, Relay `onError` rejection, and synchronous commit failure rejection.
  - Replaced verify-email route-local promise plumbing with the shared helper while preserving single-use token request caching and retry eviction behavior.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts src/routes/auth/__tests__/recovery.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
