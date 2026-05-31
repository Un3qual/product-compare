# Frontend Route GraphQL Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-auth-mutation-results.md`
  - `docs/work/frontend-route-mutation-graphql-errors.md`
  - `docs/work/frontend-route-mutation-record-guard.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-graphql-error-helper-implementation-plan.md`
- Objective:
  - Centralize route-level top-level Relay GraphQL error presence checks.

## Verified Current State

- `assets/src/routes/route-errors.ts` owns compare route mutation error fallback handling and exports `hasRouteGraphQLErrors(...)` plus the compare-compatible `hasRouteMutationGraphQLErrors(...)`.
- `assets/src/routes/auth/errors.ts` owns auth mutation result normalization and now delegates top-level GraphQL error presence checks to `hasRouteGraphQLErrors(...)`.
- Auth mutation routes already delegate top-level GraphQL error handling through `resolveSessionMutationResult(...)` and `resolveActionMutationResult(...)`.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found top-level Relay GraphQL error presence checks duplicated between compare route mutation helpers and auth mutation normalization.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/route-errors.ts`, `assets/src/routes/auth/errors.ts`, `assets/src/routes/__tests__/route-errors.test.ts`, `assets/src/routes/auth/__tests__/errors.test.ts`, `assets/src/routes/auth/__tests__/session.route.test.tsx`, `assets/src/routes/auth/__tests__/recovery.route.test.tsx`, `assets/src/routes/compare/__tests__/compare.route.test.tsx`, `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`, this file, and `docs/plans/2026-05-30-frontend-route-graphql-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Route GraphQL Error Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused coverage for `hasRouteGraphQLErrors(...)`.
  - Added generic `hasRouteGraphQLErrors(...)` and routed `hasRouteMutationGraphQLErrors(...)` through it.
  - Replaced auth mutation normalization's local top-level GraphQL error presence check with the shared helper.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
