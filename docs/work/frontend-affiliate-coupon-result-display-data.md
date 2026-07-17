# Frontend Affiliate Coupon Result Display Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 37 passing
  affiliate setup data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Affiliate Coupon Result Display Data Contract

- Status: ready on 2026-07-17.
- Next action: move deterministic coupon discount copy into the existing
  framework-free affiliate setup data owner.
- Candidate evidence: `AffiliateSetupForms` currently interprets discount
  type, value, and currency for result copy, while the data owner already owns
  affiliate setup input and mutation-outcome policy; the focused suites pass
  37 tests.
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
