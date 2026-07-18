# Frontend Price Watch Amount Field Data

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 30 passing
  price-watch data and alert-route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Price Watch Amount Field Data Contract

- Status: ready on 2026-07-17.
- Next action: project amount-field visibility and label from the selected rule
  type in the existing framework-free price-watch data owner.
- Candidate evidence: visibility currently comes from
  `needsPriceWatchAmount`, while `PriceWatchControl` separately chooses the
  amount label; the focused suites pass 30 tests.
- Blockers: none.

## Boundaries

- Preserve Target landed price for target-price rules.
- Preserve Percentage drop for percentage-drop rules.
- Preserve no amount field for availability rules.
- Keep input construction, mutation orchestration, product-scoped form reset,
  markup, and presentation in React.
- Keep the data owner transitively free of React, router, Relay, StyleX, Radix,
  and generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/products/price-watch-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- consumer and transitive framework/transport dependency scans of the price-
  watch data module
- `git diff --check`
