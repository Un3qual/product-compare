# Frontend Verify-Email Request Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 22 passing focused tests and the full
  repository gate passing 771 backend and 1,312 frontend tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Verify-Email Request Data Contract

- Status: done on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Outcome: one framework-free data owner now returns normalized request data,
  the exact shared missing-token error identity, mutation variables, exact
  success and status copy, and success-only cache eligibility. The route
  retains the promise cache, single-use request deduplication, Relay lifecycle,
  cancellation, hooks, state, markup, and presentation.
- Candidate evidence: current source inspection found those deterministic
  policies embedded in the React route; its recovery-route suite passes 14
  tests and its owned paths do not overlap the three comparison candidates.
- Blockers: none.

## Boundaries

- Preserve the generated verify-email mutation contract and existing auth
  outcome/error owners.
- Preserve successful in-flight and settled request reuse plus failed-outcome
  eviction so a later mount can retry.
- Leave the request cache, Relay commit and promise orchestration, commit ref,
  effect cancellation, hooks, state, markup, and presentation in React.
- The pure owner may only answer whether an action result remains cacheable.

## Verification

- RED: the new pure suite failed because the framework-free verify-email data
  module did not exist.
- `cd assets && bun x vitest run test/routes/auth/verify-email-data.test.ts test/routes/auth/recovery.route.test.tsx`
  passed 22 tests.
- `cd assets && bun run typecheck` passed.
- The framework/transport dependency scan found no React, router, Relay,
  StyleX, transport, or browser-global dependency in the pure verify-email data
  module.
- `mix ci` passed 771 backend and 1,312 frontend tests, Relay validation,
  TypeScript, client and SSR builds, the 6/6 clone budget, and the 182,143-byte
  initial gzip bundle against the 200,000-byte budget.
- `git diff --check` passed.
