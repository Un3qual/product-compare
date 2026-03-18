# Frontend Auth Browser Coverage Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-17 at `4f42fcc`
- Historical context:
  - `docs/work/graphql-auth-migration.md`
  - `docs/plans/2026-03-16-graphql-auth-migration-implementation-plan.md`
- Definition of done:
  - Browser-level Playwright coverage exists for the existing frontend auth flows: `login`, `register`, `forgot-password`, `reset-password`, and `verify-email`.
  - The Playwright tests exercise the Bun frontend against intercepted GraphQL responses and assert the browser-visible success, redirect, and error states.
  - `docs/work/index.md` and `docs/work/graphql-auth-migration.md` reflect the resulting steady state.

## Verified Current State

- `assets/src/router.tsx` already mounts `auth/login`, `auth/register`, `auth/forgot-password`, `auth/reset-password`, and `auth/verify-email`.
- Route-level unit coverage already exists in:
  - `assets/src/routes/auth/__tests__/session.route.test.tsx`
  - `assets/src/routes/auth/__tests__/recovery.route.test.tsx`
- The Playwright suite now contains `assets/tests/e2e/smoke.spec.ts` and `assets/tests/e2e/auth.spec.ts`.
- `assets/playwright.config.ts` starts only the Bun frontend dev server, so browser-level auth tests must stub `/api/graphql` rather than depending on a live Phoenix backend.
- The root shell exposes entry points for `Sign in` and `Create account`; recovery and verification flows are reached from auth route links or query-string URLs.

## Completed

- Frontend session auth routes shipped.
- Frontend recovery and verification routes shipped.
- Route-level unit coverage exists for session and recovery/verification flows.
- Relay fetches GraphQL over `/api/graphql` with browser credentials in `assets/src/relay/fetch-graphql.ts`.
- Browser-level Playwright coverage now exists in `assets/tests/e2e/auth.spec.ts` for `login`, `register`, `forgot-password`, `reset-password`, and `verify-email`.

## Milestone Boundary

- Auth Playwright coverage is complete for session, recovery, and verification flows.
- `cd assets && bun x playwright test tests/e2e/smoke.spec.ts tests/e2e/auth.spec.ts` passes.
- Work docs are updated to reflect completion.
- Commit message: `test(frontend): add auth playwright coverage`

## Next Batch

1. No further batch lives in this doc.
2. Return to `docs/work/graphql-auth-migration.md` for the remaining delivery-transport decision track.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/graphql-auth-migration.md`
- `sed -n '1,260p' docs/work/frontend-auth-browser-coverage.md`
- `find assets/tests -maxdepth 3 -type f | sort`
- `find assets/src/routes/auth -maxdepth 3 -type f | sort`
