# Frontend Auth State Hardening

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01 after Task 4 final verification
- Implementation plan: `docs/plans/2026-06-01-frontend-auth-state-hardening-implementation-plan.md`
- Objective: make the root shell reflect the current GraphQL `viewer` session state and harden browser/backend logout coverage before the logout branch opens a PR.

## Batch Status

- [x] Task 1: add root `viewer` route data and render guest/authenticated auth links.
- [x] Task 2: update Relay root `viewer` state after login, register, and logout mutations.
- [x] Task 3: harden browser logout e2e coverage and backend session-auth contract coverage.
- [x] Task 4: run final auth-state verification and close the batch.

## Current Batch

- Task: none.
- Status: completed.
- Next step: no unblocked frontend auth state hardening batch remains; product ingestion remains blocked pending live provider validation and source onboarding compliance signoff.

## Verification

- Plan creation verified the immediate prerequisites by reading `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, `ARCHITECTURE.md`, `docs/work/graphql-auth-migration.md`, `assets/src/routes/root.tsx`, `assets/src/router.tsx`, auth route components, auth route tests, `assets/tests/e2e/auth.spec.ts`, `lib/product_compare_web/resolvers/auth_resolver.ex`, and `test/product_compare_web/graphql/session_auth_test.exs`.
- Before Task 1, the current branch added `/auth/logout`, but root navigation/home actions still showed guest and authenticated auth links at the same time.
- Backend GraphQL already exposes `viewer`, and Task 1 now preloads it through the existing Relay route preload infrastructure.
- The auth e2e file covers login/register/recovery/verification but not logout, and its mock operation names need to match current Relay operation names.
- Backend logout already dropped authenticated sessions; Task 3 added idempotent unauthenticated logout coverage and expanded untrusted-origin coverage to include `register`, `login`, and `logout`.
- Task 1 RED on 2026-06-01:
  - `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` exited 1 before implementation.
  - Expected failures observed: guest/authenticated root rendering showed stale auth links, and `src/__tests__/router.test.tsx` could not resolve `../routes/root/loader`.
- Task 1 GREEN on 2026-06-01:
  - `cd assets && bun run relay` exited 0 and generated `assets/src/__generated__/RootViewerRouteQuery.graphql.ts`.
  - `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx` exited 0: 2 files passed, 10 tests passed.
  - `cd assets && bun run typecheck` exited 0.
- Task 1 completed root `viewer` route data, registered `ROOT_ROUTE_ID`/`rootLoader`, and now renders guest links (`Sign in`, `Create account`) or authenticated `Sign out` consistently in primary navigation and home actions.
- Task 2 RED on 2026-06-01:
  - `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx` exited 1 before implementation: 1 file failed, 3 tests failed, and 8 tests passed.
  - Expected initial failures observed because login, logout, and register did not yet refresh Relay root `viewer` state.
  - Re-review RED for the final graphQLError-aware design: `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx` exited 1 while auth mutations still used unconditional Relay `updater` callbacks: 1 file failed, 1 passed; 10 tests failed, 10 passed.
- Task 2 GREEN on 2026-06-01:
  - After the graphQLError-aware success-gating re-review, `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx` exited 0: 1 file passed, 14 tests passed.
  - After the graphQLError-aware success-gating re-review, `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx` exited 0: 2 files passed, 20 tests passed.
  - Final spec re-review added logout top-level GraphQL error coverage. `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx` exited 0: 1 file passed, 15 tests passed.
  - Final spec re-review paired check: `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx` exited 0: 2 files passed, 21 tests passed.
  - `cd assets && bun run typecheck` exited 0 with `tsc --noEmit`.
- Task 2 completed success-gated Relay root `viewer` local updates for login, register, and logout mutations. Auth routes use `useRelayEnvironment` plus `commitLocalUpdate` helpers only after `resolveSessionMutationResult` or `resolveActionMutationResult` confirms graphQLError-aware success; unconditional mutation `updater` callbacks are not used for root auth shell state.
- Task 3 RED on 2026-06-01:
  - `cd assets && bun x playwright test tests/e2e/auth.spec.ts` exited 1 before operation-name/mock completion: 9 tests failed, including unhandled current Relay operation names and the new logout browser coverage.
  - `mix test test/product_compare_web/graphql/session_auth_test.exs` exited 0: 23 tests, 0 failures. Backend behavior already satisfied the new logout idempotency and untrusted-origin register/logout coverage, so this was coverage-only backend behavior.
- Task 3 implementation state on 2026-06-01:
  - `assets/tests/e2e/auth.spec.ts` now uses `LoginMutation`, `RegisterMutation`, `ForgotPasswordMutation`, `ResetPasswordMutation`, `VerifyEmailMutation`, `LogoutMutation`, and `RootViewerRouteQuery` mock keys, includes `rootViewerResponse`, includes `RootViewerRouteQuery` responses for root-loaded pages, and adds logout browser coverage.
  - `test/product_compare_web/graphql/session_auth_test.exs` now covers unauthenticated logout idempotency and untrusted-origin `register`, `login`, and `logout` session-writing rejection.
- Task 3 GREEN on 2026-06-01:
  - The first GREEN attempt exposed a Task 2 runtime bug while the browser sent `RootViewerRouteQuery` and `LogoutMutation`: Relay rejected `setLinkedRecord(null, "viewer")` while clearing root `viewer`.
  - Task 2 follow-up fixed `clearRootViewer` to clear the linked root `viewer` field with Relay's supported null scalar write path, and `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/__tests__/root.route.test.tsx` exited 0: 2 files passed, 21 tests passed.
  - Code-quality follow-up tightened the logout browser assertion to verify primary-navigation guest links after redirect and tightened backend untrusted-origin logout coverage to prove the logged-in viewer still resolves.
  - `cd assets && bun x playwright test tests/e2e/auth.spec.ts` exited 0 with escalation after the sandbox blocked the local Vite port bind: 9 tests passed.
  - `mix test test/product_compare_web/graphql/session_auth_test.exs` exited 0: 23 tests, 0 failures.
  - `cd assets && bun run typecheck` exited 0 with `tsc --noEmit`.
- Task 4 final verification on 2026-06-01:
  - `cd assets && bun run relay` exited 0 and left Relay artifacts current.
  - `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx` exited 0: 4 files passed, 41 tests passed.
  - `cd assets && bun x playwright test tests/e2e/auth.spec.ts` exited 0 with escalation after the sandbox blocked local Vite port binding: 9 tests passed.
  - `mix test test/product_compare_web/graphql/session_auth_test.exs` exited 0: 23 tests, 0 failures.
  - `cd assets && bun run typecheck` exited 0 with `tsc --noEmit`.
  - `cd assets && bun run check` exited 0: 34 files passed, 307 tests passed.
  - `git diff --check` exited 0.
  - Read-only spec and code-quality subagent reviews both approved the completed auth-state slice.

## Blockers

- None.
