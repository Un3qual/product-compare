# Frontend Trust-Surface Date Presentation Work Doc

## Snapshot

- Status: complete (trust-surface date presentation contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after focused and full frontend verification (15
  task-focused tests; 26 tests with the canonical validator suite; 71 files
  and 995 tests in the full gate).

## Trust-Surface Date Presentation Contract

- Status: complete on `codex/route-policy-data-contracts` as of 2026-07-14.
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

## Completion Evidence

- `product-formatting.ts` owns cached UTC date-only and date-time formatters
  and reuses the strict GraphQL DateTime validator for exact malformed-string
  fallback; it remains free of React, Relay, router, StyleX, and Radix imports.
- Merchant detail and public comparison snapshots use the shared contract
  without changing source `dateTime` attributes or captured-decision copy.
- RED: the focused run failed four direct tests because the two string helpers
  were absent while both existing consumer suites remained green.
- GREEN: the direct formatter and consumer suites passed 15 tests.
- Review follow-up added impossible-calendar-date and missing-offset
  regressions. Both failed before the fix; the formatter, canonical validator,
  merchant, and snapshot suites then passed 26 tests.
- `cd assets && bun run typecheck` passed.
- `cd assets && bun run check` passed Relay validation, TypeScript, 71 test
  files and 995 tests, client and SSR production builds, and the client bundle
  budget (181,909 gzip bytes against 200,000).
- The framework-import scan and `git diff --check` passed.
