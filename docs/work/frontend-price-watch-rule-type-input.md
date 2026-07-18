# Frontend Price-Watch Rule-Type Select Input

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 78 passing price-watch data and product-detail
  route tests plus the full frontend gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Price-Watch Rule-Type Select Input Contract

- Status: completed on 2026-07-17.
- Delivered: `priceWatchRuleTypeFromValue` preserves all four supported values
  and falls back to target price for blank, unknown, or future values.
- Consumer: `PriceWatchControl` now passes the raw select value through the
  framework-free normalizer without changing state, amount policy, mutation
  inputs, events, markup, or presentation.
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

## Completion Evidence

- RED: seven new cases failed because `priceWatchRuleTypeFromValue` did not
  exist.
- Focused: 78 tests pass across the pure price-watch data and product-detail
  route suites.
- Full frontend: Relay validation, TypeScript, 100 files and 1,376 tests,
  client and SSR builds, and the 596,339 raw / 182,136 gzip-byte client bundle
  contract pass.
- The price-watch data module contains no React, router, Relay, StyleX, Radix,
  or generated-query dependency.
- `git diff --check` passes.
