# Frontend Price-Watch Input Work Doc

## Snapshot

- Status: done on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Priority: P1.
- Dispatch source of truth: `docs/work/index.md`.
- Lane context and status evidence: this file.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.

## Price-Watch Input Data Contract

- Delivered: `price-watch-data.ts` owns amount-bearing rule selection and
  create-watch input normalization. `PriceWatchControl` retains product-scoped
  form reset, state, Relay mutation orchestration, validation attributes,
  feedback, and presentation.
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
- Completion evidence: the deterministic policy now lives in
  `price-watch-data.ts`; its pure contract and retained alert/control suite
  passed 16 focused tests.
- Blockers: none.

## Completion Evidence (2026-07-15)

- RED: `cd assets && bun x vitest run test/routes/products/price-watch-data.test.ts`
  failed because the new `price-watch-data` module did not exist.
- GREEN: extracted the framework-free amount-rule and create-watch input
  normalization contract. The React control retains product-keyed reset,
  FormData/event handling, Relay mutation lifecycle, validation attributes,
  feedback, and markup.
- `cd assets && bun x vitest run test/routes/products/price-watch-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
  passed: 2 files, 16 tests, 0 failures.
- `cd assets && bun run typecheck` passed.
- The direct framework-import scan of `price-watch-data.ts` found no React,
  Relay, router, or StyleX imports; `git diff --check` passed.
