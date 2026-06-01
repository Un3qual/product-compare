# Frontend Logout Route Baseline

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01 after final auth-slice verification
- Implementation plan: `docs/plans/2026-06-01-frontend-logout-route-baseline-implementation-plan.md`
- Objective: add the missing browser `/auth/logout` route using the existing GraphQL logout mutation and Relay artifact workflow.

## Batch Status

- [x] Task 1: add the Relay logout route, route registration, and navigation link.
- [x] Task 2: run auth-slice verification and close the lane.

## Current Batch

- Task: none.
- Status: completed.
- Owned paths:
  - `assets/src/routes/auth/__tests__/session.route.test.tsx`
  - `assets/src/routes/auth/mutations/LogoutMutation.ts`
  - `assets/src/routes/auth/logout.tsx`
  - `assets/src/__generated__/LogoutMutation.graphql.ts`
  - `assets/src/routes/__tests__/root.route.test.tsx`
  - `assets/src/__tests__/router.test.tsx`
  - `assets/src/router.tsx`
  - `assets/src/routes/root.tsx`
  - `docs/work/frontend-logout-route-baseline.md`
  - `docs/work/graphql-auth-migration.md`
  - `docs/plans/2026-06-01-frontend-logout-route-baseline-implementation-plan.md`
- Next step: no unblocked logout route baseline batch remains.

## Verification

- Plan creation verified the gap by reading `ARCHITECTURE.md`, `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, `docs/work/graphql-auth-migration.md`, `assets/src/router.tsx`, `assets/src/routes/root.tsx`, `assets/src/routes/auth`, `assets/schema.graphql`, `lib/product_compare_web/schema.ex`, and `test/product_compare_web/graphql/session_auth_test.exs`.
- `ARCHITECTURE.md` claims browser auth routes include logout, and backend GraphQL exposes a cookie-backed `logout` mutation.
- The frontend currently has Relay auth mutation routes for login, register, forgot password, reset password, and verify email, but no `/auth/logout` route or `LogoutMutation` artifact.
- Task 1 RED: after restoring `assets/node_modules` with `bun install`, `bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` failed because `LogoutRoute` was missing and root navigation had no `Sign out` link.
- Task 1 GREEN: `bun run relay` completed, `bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` passed 18 tests, and `bun run typecheck` completed with `tsc --noEmit`.
- Task 1 added `LogoutMutation`, `LogoutRoute`, `/auth/logout`, and the `Sign out` navigation/home-action link.
- Task 2 focused verification passed with `bun run relay`, `bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`, `bun run typecheck`, and `mix test test/product_compare_web/graphql/session_auth_test.exs`.
- Task 2 broader verification passed with `bun run check` and `git diff --check`.

## Blockers

- None.
