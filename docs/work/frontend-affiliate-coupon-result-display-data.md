# Frontend Affiliate Coupon Result Display Data

## Snapshot

- Status: done
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after 45 passing affiliate setup data and route
  tests, TypeScript, the full 1,403-test frontend gate, and dependency scans.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Affiliate Coupon Result Display Data Contract

- Status: done on 2026-07-17.
- Completed action: moved deterministic coupon discount copy into the existing
  framework-free affiliate setup data owner. `AffiliateSetupForms` retains the
  generated GraphQL result type and passes its compatible coupon fact to the
  pure helper.
- RED evidence: the new eight-case pure suite failed as expected because
  `couponDiscountText` was not exported by the data owner.
- Green evidence: amount, percent, free-shipping, other, incomplete, and
  unknown/future discount values preserve their visible-copy policy across 45
  focused data and route tests.
- Blockers: none.

## Boundaries

- Preserve amount, percent, free-shipping, other, incomplete, and unknown-value
  copy policy.
- Keep generated GraphQL types, mutation orchestration, markup, and
  presentation in the React form owner.
- Keep the data owner free of React, router, Relay, StyleX, Radix, and generated-
  query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup-data.test.ts test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the affiliate setup data module
- `git diff --check`

## Completion Evidence

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup-data.test.ts test/routes/affiliate/setup/affiliate-setup.route.test.tsx` — 45 tests passed.
- `cd assets && bun run typecheck` — passed.
- Framework/transport dependency scan — the data owner has no React, Relay,
  router, StyleX, Radix, or generated-query imports.
- `cd assets && bun run check` — Relay validation, TypeScript, 1,403 unit
  tests, client/SSR builds, and bundle budget check passed.
- `mix work_queue.validate` — passed with exactly 3 ready rows.
- `git diff --check` — passed.
