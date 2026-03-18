# GraphQL Auth Migration Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-17 at `fd29b13`
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
- The current frontend route surface is still minimal: `assets/src/routes/root.tsx` is the only non-test route file under `assets/src/routes`.

## Completed

- GraphQL-only browser auth contract is documented.
- Cookie-backed `register`, `login`, and `logout` GraphQL flows shipped.
- GraphQL `forgotPassword`, `resetPassword`, and `verifyEmail` shipped with typed payloads.
- Legacy browser-facing REST auth endpoints were removed.

## Open Tracks

### 1. Delivery Transport

- Status: blocked pending a transport choice
- Current state:
  - Reset and verification tokens can be issued through configured delivery hooks.
  - No production mailer or notification dependency is present in `mix.exs`.
- Unblock by:
  - choosing a concrete transport and wiring it, or
  - recording an explicit deferral decision so the work no longer sits as an implied TODO.

### 2. Frontend Recovery And Verification Flows

- Status: needs rebaseline before implementation
- Current state:
  - The backend GraphQL mutations are available.
  - The frontend app has not yet grown beyond the root shell route.
  - The older fullstack plan is too broad to act as the current execution queue.
- Unblock by:
  - writing a narrow frontend auth work doc scoped to the current `assets/` app, or
  - rebaselining the relevant section of the dated frontend fullstack plan into an active `docs/work/*.md` file.

## Next Batch

1. Rebaseline the remaining frontend auth work into a current `docs/work/*.md` execution doc with explicit files, tests, and milestone boundaries.
2. Decide whether production token delivery should be implemented now or explicitly deferred in a decision doc.
3. Once either track is unblocked, replace this section with the concrete implementation batch instead of broad follow-up bullets.

## Verification Commands

- `sed -n '1,220p' docs/work/index.md`
- `sed -n '1,260p' docs/work/graphql-auth-migration.md`
- `rg -n "forgot_password|reset_password|verify_email" lib/product_compare_web/schema.ex`
- `find assets/src/routes -maxdepth 3 -type f | sort`
