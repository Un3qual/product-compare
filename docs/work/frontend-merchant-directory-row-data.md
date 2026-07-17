# Frontend Merchant-Directory Row Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 33 passing merchant-directory view-data and
  route tests, TypeScript, dependency scan, and diff hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Merchant Directory Row Data Contract

- Status: done on 2026-07-17.
- Result: the existing framework-free owner now projects source-ordered result
  nodes into exact merchant rows with encoded detail paths and website
  destinations resolved by the shared external-link safety policy.
- Candidate evidence: current source inspection found this deterministic
  projection in `MerchantDirectoryRoute`; the existing view-data and route
  suites pass 31 tests, and the owned paths do not overlap the catalog-browse,
  offer-discovery, or alert-navigation candidates.
- Blockers: none.

## Boundaries

- Preserve merchant order, IDs, names, and domains.
- Encode the supplied slug in the merchant detail path.
- Continue resolving merchant website links through the shared external-
  destination safety policy.
- Leave Relay reads, pagination, visible-page filtering, markup, labels, and
  presentation in their current owners.

## Verification

- `cd assets && bun x vitest run test/routes/merchants/merchant-directory-view-data.test.ts test/routes/merchants/merchant-directory.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the merchant-directory view-data
  module
- `git diff --check`

## Completion Evidence

- RED: the two new pure row-projection cases failed because
  `buildMerchantDirectoryRows` did not exist.
- GREEN: the view-data and route suites passed 33 tests.
- The view-data module remains free of React, Relay, router, StyleX, Radix, and
  generated-query imports.
- TypeScript and diff hygiene passed on 2026-07-17.
