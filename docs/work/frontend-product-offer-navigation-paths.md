# Frontend Product-Offer Navigation Paths

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 226 passing
  browse, product-detail, and compare route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Product Offer Navigation Path Contract

- Status: ready on 2026-07-17.
- Next action: replace product-scoped offer URL construction in browse,
  product-detail, and decision-summary presentation with one canonical builder
  in the existing offer path owner.
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
