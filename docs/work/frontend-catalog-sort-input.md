# Frontend Catalog Sort Select Input

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 62 passing
  catalog route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Catalog Sort Select Input Contract

- Status: ready on 2026-07-17.
- Next action: move raw catalog sort select-value normalization into the
  existing framework-free filters owner.
- Candidate evidence: `CatalogFilterForm` currently asserts the raw DOM value
  to `CatalogProductSort`, while the filters owner already defines the four
  supported sorts and URL normalization policy; the route suite passes 62
  tests.
- Blockers: none.

## Boundaries

- Preserve all four catalog sorts and use catalog order as the safe fallback.
- Keep form state, submitted-field omission, select events, options, markup,
  and presentation unchanged.
- Keep the filters owner free of React, router, Relay, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/catalog/catalog-sort-input.test.ts test/routes/catalog/browse.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the catalog filters module
- `git diff --check`
