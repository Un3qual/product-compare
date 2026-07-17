# Frontend Category Product Navigation

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with eight passing category view-data and route
  tests, TypeScript, and diff hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Category Product Navigation Contract

- Status: done on 2026-07-17.
- Result: category product links now use the existing canonical
  `productDetailPath` builder, including reserved-character encoding.
- Candidate evidence: current source inspection found category product links
  bypass the encoded path owner; the existing category view-data and route
  suites pass eight tests, and the owned paths do not overlap the alert-
  navigation, merchant-row, or product-offer navigation candidates.
- Blockers: none.

## Boundaries

- Preserve canonical product-slug encoding.
- Preserve category product ordering, link labels, and ordinary-slug
  destinations.
- Leave view-data projection, link markup, labels, list order, and presentation
  in React.

## Verification

- `cd assets && bun x vitest run test/routes/categories/category-view-data.test.ts test/routes/categories/category.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Completion Evidence

- RED: the live category-route case received `/products/field / camera` instead
  of the encoded `/products/field%20%2F%20camera%3F` destination.
- GREEN: the category view-data and route suites passed eight tests.
- TypeScript and diff hygiene passed on 2026-07-17.
