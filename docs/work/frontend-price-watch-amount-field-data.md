# Frontend Price Watch Amount Field Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after 30 passing price-watch data and alert-route
  tests, TypeScript, consumer and recursive dependency scans, and diff hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Price Watch Amount Field Data Contract

- Status: completed on `codex/frontend-navigation-row-contracts` on
  2026-07-17.
- Next action: project amount-field visibility and label from the selected rule
  type in the existing framework-free price-watch data owner.
- Result: `getPriceWatchAmountFieldData` now projects a discriminated amount-
  field contract for all four rule types, and `PriceWatchControl` consumes its
  visibility and exact label without retaining a second policy decision.
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

## Evidence

- RED: the four new pure cases failed with
  `getPriceWatchAmountFieldData is not a function` while 19 existing cases
  passed.
- GREEN: the price-watch data and alert-route suites passed 30 tests.
- `bun run typecheck` passed.
- The consumer scan found the projection in the pure test and
  `PriceWatchControl`; the recursive closure contains only
  `price-watch-data.ts` and `route-errors.ts`, with no React, router, Relay,
  StyleX, Radix, generated-query, or transport imports.
- `git diff --check` passed.
