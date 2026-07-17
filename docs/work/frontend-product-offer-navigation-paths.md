# Frontend Product-Offer Navigation Paths

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 230 passing offer-path, browse, product-detail,
  and compare tests, TypeScript, dependency scan, and diff hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Offer Navigation Path Contract

- Status: done on 2026-07-17.
- Result: `productOffersPath` now owns the exact encoded product-scoped offer
  destination used by browse, product detail, and decision summary.
- Candidate evidence: current source inspection found three independently
  constructed links with the same encoded `productId` contract; the existing
  route suites pass 226 tests, and the owned paths do not overlap the offer-
  discovery pagination, alert-navigation, or merchant-row candidates.
- Blockers: none.

## Boundaries

- Encode the product ID as one `productId` query parameter.
- Preserve destinations for ordinary and reserved product IDs.
- Leave link markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/offers/paths.test.ts test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the offer path module
- `git diff --check`

## Completion Evidence

- RED: all four pure path cases failed because `productOffersPath` did not
  exist.
- GREEN: the direct path, browse, product-detail, and compare suites passed 230
  tests.
- The offer path module remains free of React, Relay, router, StyleX, Radix,
  and generated-query imports.
- TypeScript and diff hygiene passed on 2026-07-17.
