# Frontend Catalog Sort Select Input

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 69 passing catalog sort-input and catalog
  route tests plus the full frontend gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Catalog Sort Select Input Contract

- Status: completed on 2026-07-17.
- Delivered: `catalogProductSortFromValue` preserves `ID_ASC`, `NAME_ASC`,
  `BRAND_NAME_ASC`, and `NEWEST`, and falls back to catalog order (`ID_ASC`)
  for blank, unknown, and future values.
- Consumer: `CatalogFilterForm` now passes the raw sort select value through
  the framework-free normalizer without changing local state, submitted-field
  omission, events, options, markup, or presentation.
- Blockers: none.

## Boundaries

- Preserve all four catalog sorts and use catalog order as the safe fallback.
- Keep form state, submitted fields, select events, options, markup, and
  presentation unchanged.
- Keep the filters owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- RED: `cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts`
  failed all seven new cases because `catalogProductSortFromValue` was absent.
- `cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts test/routes/catalog/browse.route.test.tsx`
  passed 69 tests.
- `cd assets && bun run typecheck` passed.
- `cd assets && bun run check` passed Relay validation, TypeScript, 101 test
  files / 1,383 tests, client and SSR builds, and the bundle contract.
- The filters module dependency scan found no React, router, Relay, StyleX,
  Radix, or generated-query dependency.
- `git diff --check` passes.
