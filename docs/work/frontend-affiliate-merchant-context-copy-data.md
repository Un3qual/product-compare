# Frontend Affiliate Merchant Context Copy Data

## Snapshot

- Status: grouped into the account and setup presentation batch
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 50 passing
  affiliate setup data and route tests.
- Plan: `docs/superpowers/plans/2026-07-18-coherent-frontend-correctness-batches.md`

## Affiliate Merchant Context Copy Data Contract

- Status: retained as internal slice A of
  `docs/work/frontend-account-setup-presentation-contracts.md`; it is not a
  standalone queue row.
- Next action: project selected-merchant and current-merchant copy from the
  canonical merchant choice in the existing framework-free affiliate setup
  data owner.
- Candidate evidence: selected copy is repeated across three forms, current
  copy is inline in the route, and `getMerchantSummary` already owns the
  canonical name/domain summary; the focused suites pass 50 tests.
- Blockers: none.

## Boundaries

- Preserve `Selected merchant: <name> (<domain>)` in program, link, and coupon
  forms.
- Preserve `Current merchant: <name> (<domain>)` in the context rail.
- Preserve no merchant context copy for a missing selection.
- Keep selection, pagination, forms, mutations, results, markup, and
  presentation in React.
- Keep the data owner transitively free of React, router, Relay, StyleX, Radix,
  and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup-data.test.ts test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the
  affiliate setup data module
- `git diff --check`
