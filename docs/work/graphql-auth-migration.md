# GraphQL Auth Migration Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01 during frontend auth state hardening Task 4 final verification
- Historical context:
  - `docs/plans/2026-03-16-graphql-auth-migration-design.md`
  - `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
- Definition of done:
  - Browser auth recovery and verification flows are represented by a current frontend execution doc and then implemented from that doc.
  - Production reset/verification delivery is either wired to a real transport or explicitly deferred by a fresh decision doc.
  - This file and `docs/work/index.md` reflect the resulting steady state.

## Verified Current State

- Backend GraphQL auth mutations exist for `register`, `login`, `logout`, `forgotPassword`, `resetPassword`, and `verifyEmail` in `lib/product_compare_web/schema.ex`.
- Accounts still uses injectable delivery hooks and explicitly remains mailer-agnostic in `lib/product_compare/accounts.ex`.
- An explicit transport deferral decision now lives in `docs/decisions/2026-03-17-auth-token-delivery-deferral.md`.
- Frontend auth routes exist in `assets/src/routes/auth` for `login`, `logout`, `register`, `forgot-password`, `reset-password`, and `verify-email`, and now commit the GraphQL auth contract through Relay mutation artifacts instead of route-local `fetchGraphQL(...)` helpers.
- Frontend auth state hardening is complete in `docs/work/frontend-auth-state-hardening.md`; the root shell now renders auth links from GraphQL `viewer` state and logout browser/backend coverage is hardened for PR readiness.
- Route-level frontend coverage exists in `assets/src/routes/auth/__tests__/session.route.test.tsx` and `assets/src/routes/auth/__tests__/recovery.route.test.tsx`, including Relay mutation variable and callback behavior.
- Browser-level frontend coverage now includes `assets/tests/e2e/auth.spec.ts` alongside `assets/tests/e2e/smoke.spec.ts`.
- Frontend auth state hardening is complete: the root shell renders guest/authenticated auth links from GraphQL `viewer` state, and successful login/register/logout mutations update Relay's root `viewer` record only after graphQLError-aware success handling.
- Browser-level logout coverage now sends `LogoutMutation` through `/api/graphql`, verifies the route returns to `/auth/login`, and verifies guest primary-navigation links after a successful GraphQL logout payload.
- Backend session-auth coverage now includes unauthenticated logout idempotency and untrusted-origin rejection for `register`, `login`, and `logout`, including proof that rejected untrusted-origin logout preserves the logged-in viewer.
- Backend GraphQL mutations that return typed payload errors now use `UNAUTHENTICATED` for missing-session failures, matching top-level auth-required query errors.

## Completed

- GraphQL-only browser auth contract is documented.
- Cookie-backed `register`, `login`, and `logout` GraphQL flows shipped.
- GraphQL `forgotPassword`, `resetPassword`, and `verifyEmail` shipped with typed payloads.
- Frontend auth session, recovery, and verification routes shipped with unit coverage.
- Frontend auth session, recovery, and verification routes moved onto Relay mutation APIs.
- Frontend logout route baseline shipped with Relay mutation coverage and a primary-navigation entry point.
- Frontend auth state hardening shipped with root `viewer` preload, viewer-aware auth links, success-gated Relay root `viewer` updates, browser logout e2e coverage, and backend session-auth edge-case coverage.
- Frontend auth browser-level Playwright coverage shipped.
- Legacy browser-facing REST auth endpoints were removed.
- Production reset/verification delivery is explicitly deferred in `docs/decisions/2026-03-17-auth-token-delivery-deferral.md`.
- Missing-session typed mutation payloads now use the shared `UNAUTHENTICATED` code.

## Open Tracks

- None for the GraphQL browser auth migration. Production reset/verification delivery remains deferred by `docs/decisions/2026-03-17-auth-token-delivery-deferral.md` unless a concrete delivery transport is chosen.

## Next Batch

1. No unblocked GraphQL browser auth migration batch remains.
2. Keep browser auth flows on GraphQL over `/api/graphql`; do not add REST browser auth endpoints.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/graphql-auth-migration.md`
- `sed -n '1,260p' docs/work/frontend-auth-browser-coverage.md`
- `rg -n "forgot_password|reset_password|verify_email" lib/product_compare_web/schema.ex`
- `find assets/src/routes -maxdepth 4 -type f | sort`
- `find assets/tests -maxdepth 3 -type f | sort`
- `cd assets && bun x vitest run src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`
- `cd assets && bun run check`
- `mix test test/product_compare_web/graphql/session_auth_test.exs`
- `mix test test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
