# Frontend Price-Watch Input Work Doc

## Snapshot

- Status: ready on 2026-07-15.
- Priority: P1.
- Dispatch source of truth: `docs/work/index.md`.
- Lane context and status evidence: this file.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.

## Price-Watch Input Data Contract

- Next action: isolate amount-bearing rule selection and create-watch input
  normalization in a framework-free data module while retaining product-scoped
  form reset, state, Relay mutation orchestration, validation attributes,
  feedback, and presentation in `PriceWatchControl`.
- Owned paths:
  - `assets/src/routes/products/price-watch-data.ts`
  - `assets/src/routes/products/PriceWatchControl.tsx`
  - `assets/test/routes/products/price-watch-data.test.ts`
  - `assets/test/routes/account/alerts/alerts.route.test.tsx`
  - `docs/work/frontend-price-watch-input.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/price-watch-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
  - `cd assets && bun run typecheck`
  - framework-import scan of the pure data module
  - `git diff --check`
- Exit condition: one framework-free owner preserves rule-specific amount
  fields, trimmed amount values, uppercased trimmed currency, and omission of
  amount fields for availability rules; React retains form and mutation
  behavior.
- Candidate evidence: current source inspection found the deterministic policy
  embedded in `PriceWatchControl`; its focused alert/control suite passed 6
  tests, and the product-detail host route suite passed 55 tests.
- Blockers: none.
