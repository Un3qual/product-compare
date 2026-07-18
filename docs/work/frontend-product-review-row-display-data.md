# Frontend Product Review Row Display Data

## Snapshot

- Status: completed
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after focused data and panel tests, TypeScript,
  recursive dependency-closure scanning, consumer confirmation, and diff
  hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Review Row Display Data Contract

- Status: completed on 2026-07-17.
- Result: the framework-free community-data owner projects a published review's
  title, five-character rating-star copy, and purchase-verification author copy
  from a structural facts type. `ProductCommunityPanel` retains review bodies,
  list markup, forms, pagination, mutations, generated Relay types, and
  presentation.
- RED evidence: the expanded pure suite failed as expected because
  `publishedReviewRowDisplayData` did not exist.
- GREEN evidence: explicit and fallback titles, each supported one-through-five
  rating, verified and unverified author copy, and immutable frozen inputs now
  pass in the pure suite.
- Blockers: none.

## Boundaries

- The pure owner accepts only deterministic review-row facts; it does not import
  generated Relay types or framework and transport dependencies.
- Keep authored review bodies, list markup, forms, pagination, mutation
  orchestration, and presentation in `ProductCommunityPanel`.

## Verification

- `cd assets && bun run test test/routes/products/product-community-data.test.ts`
  — RED: 1 new failure, missing `publishedReviewRowDisplayData`.
- `cd assets && bun run test test/routes/products/product-community-data.test.ts`
  — GREEN: 21 tests passed.
- `cd assets && bun run test test/routes/products/product-community-data.test.ts test/routes/products/product-community-panel.test.tsx`
  — 23 tests passed.
- `cd assets && bun run typecheck` — passed.
- Recursive relative-import closure scan for `product-community-data.ts` —
  limited to itself and `route-errors.ts`; no React, Relay, router, StyleX,
  GraphQL, or generated-query imports.
- Consumer scan confirms `ProductCommunityPanel` uses
  `publishedReviewRowDisplayData`.
- `git diff --check` — passed.
