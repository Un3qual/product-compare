# Frontend Offer-Discovery Pagination Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 68 passing offer-discovery filter-data and
  route tests, green TypeScript and dependency checks, and the full 771-backend
  / 1,350-frontend repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Offer Discovery Pagination Data Contract

- Status: completed on 2026-07-17 on
  `codex/frontend-mutation-outcome-contracts`.
- Result: the existing framework-free offer-discovery filter-data owner now
  returns exact first-page and next-page hrefs while `OfferDiscoveryList`
  retains shared pagination markup, labels, and presentation.
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

## Completion Evidence

- RED: the filter-data suite failed eight new pagination cases because
  `buildOfferDiscoveryPaginationData` did not exist.
- Focused GREEN: the pure filter-data and unchanged route suites passed 68
  tests.
- TypeScript completed with no errors, and the filter-data owner has no React,
  React Router, Relay, generated GraphQL, or StyleX dependency.
- `git diff --check` passed.
- `mix ci` passed 771 backend and 1,350 frontend tests. Client and SSR
  production builds passed; the initial JavaScript bundle was 596,289 raw /
  182,148 gzip bytes.
