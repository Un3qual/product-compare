# Frontend Offer-Discovery Pagination Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 60 passing
  offer-discovery filter-data and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer Discovery Pagination Data Contract

- Status: ready on 2026-07-17.
- Next action: isolate first-page and next-page link visibility and path
  projection in the existing framework-free offer-discovery filter-data owner
  while retaining shared pagination markup, labels, and presentation in
  `OfferDiscoveryList`.
- Candidate evidence: current source inspection found this deterministic
  projection in the React list; the existing pure and route suites pass 60
  tests and its owned paths do not overlap the feed-candidate, merchant-
  directory, or catalog-browse candidates.
- Blockers: none.

## Boundaries

- Preserve `offerDiscoveryPath` as the canonical product-, merchant-, active-
  only-, page-size-, sort-, and cursor-encoding owner.
- Preserve first-page visibility only when Relay reports a previous page and a
  current cursor exists.
- Preserve next-page visibility only when Relay reports a next page and a non-
  empty end cursor exists.
- Leave shared `Pagination` markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/offers/offer-discovery-filter-data.test.ts test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the offer-discovery filter-data module
- `git diff --check`
