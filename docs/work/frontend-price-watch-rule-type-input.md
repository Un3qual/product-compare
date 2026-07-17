# Frontend Price-Watch Rule-Type Select Input

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 71 passing
  price-watch data and product-detail route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Price-Watch Rule-Type Select Input Contract

- Status: ready on 2026-07-17.
- Next action: move raw rule-type select-value normalization into the existing
  framework-free price-watch data owner.
- Candidate evidence: `PriceWatchControl` currently asserts the raw DOM value
  to `PriceWatchRuleType`, while the data owner already defines the supported
  rule types and all downstream amount policy; the focused suites pass 71
  tests.
- Blockers: none.

## Boundaries

- Preserve all four rule types and use target price as the safe fallback.
- Keep form state, amount-field visibility, mutation inputs, select events,
  markup, and presentation unchanged.
- Keep the data owner free of React, router, Relay, StyleX, Radix, and generated-
  query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/products/price-watch-data.test.ts test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the price-watch data module
- `git diff --check`
