# Frontend Trust-Surface Date Presentation Work Doc

## Snapshot

- Status: ready (trust-surface date presentation contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and consumer-suite validation
  (8 merchant-detail and comparison-snapshot tests).

## Trust-Surface Date Presentation Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: centralize UTC date-only and date-time text formatting for
  merchant detail and public comparison snapshots in the framework-free
  product formatter while preserving semantic `dateTime` values and malformed-
  value fallbacks.
- Owned paths:
  - `assets/src/routes/product-formatting.ts`
  - `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
  - `assets/src/routes/compare/shared/SharedComparisonRoute.tsx`
  - `assets/test/routes/product-formatting.test.ts`
  - `assets/test/routes/merchants/merchant-detail.route.test.tsx`
  - `assets/test/routes/compare/comparison-snapshots.test.tsx`
  - `docs/work/frontend-trust-date-presentation.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/product-formatting.test.ts test/routes/merchants/merchant-detail.route.test.tsx test/routes/compare/comparison-snapshots.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: one framework-free formatter owns stable UTC date-only and
  date-time labels, offset normalization, and exact malformed-string fallback;
  merchant and snapshot markup retain their original semantic `dateTime`
  values.
- Candidate evidence: current source inspection found duplicate UTC parsing
  and `Intl.DateTimeFormat` setup in merchant detail and public comparison
  snapshots around the existing `product-formatting.ts` owner. Their current
  focused suites pass 8 tests.
