# Frontend Alert Product Navigation

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 15 passing
  alert view-data and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Alert Product Navigation Contract

- Status: ready on 2026-07-17.
- Next action: replace the duplicate alert-event and watch product-detail URL
  construction in `AlertsRoute` with the existing canonical
  `productDetailPath` builder.
- Candidate evidence: current source inspection found two independently built
  product-detail links in the React route; the canonical path owner already
  handles reserved-character encoding, and the existing alert view-data and
  route suites pass 15 tests.
- Blockers: none.

## Boundaries

- Preserve canonical product-slug encoding.
- Preserve alert and watch ordering, grouping, link labels, and ordinary-slug
  destinations.
- Leave Relay mutation orchestration, revalidation, pending/error state, link
  markup, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/account/alerts/alerts-view-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
