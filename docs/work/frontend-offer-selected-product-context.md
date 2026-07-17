# Frontend Offer Selected-Product Context

## Snapshot

- Status: ready
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 68 passing
  offer-discovery filter-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer-Discovery Selected-Product Context Contract

- Status: ready on 2026-07-17.
- Next action: move selected-product typename qualification and exact context
  projection from `OfferDiscoveryRoute` into its existing framework-free
  filter-data owner.
- Candidate evidence: the route currently projects brand, ID, name, and slug
  after a `Product` typename check; the focused suites pass 68 tests and the
  owned paths do not overlap the category-pagination or saved-sort rows.
- Blockers: none.

## Boundaries

- Return no context for nullish or non-product nodes.
- Preserve exact brand, ID, name, and slug values for product nodes.
- Leave Relay reads, suspense and error boundaries, offer rendering, summaries,
  markup, and presentation unchanged.
- Keep the filter-data owner free of React, Relay, router, StyleX, Radix, and
  generated-query dependencies.

## Verification

- `cd assets && bun x vitest run test/routes/offers/offer-discovery-filter-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the offer-discovery filter-data module
- `git diff --check`
