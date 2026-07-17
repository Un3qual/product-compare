# Frontend Affiliate-Setup Pagination Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 27 passing
  affiliate-setup loader and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Affiliate Setup Pagination Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate merchant first-page and next-page link visibility and
  path projection in the existing framework-free affiliate-setup pagination
  owner while retaining shared pagination markup, labels, and presentation in
  `AffiliateSetupRoute`.
- Candidate evidence: current source inspection found this deterministic
  projection in the React route; the existing loader and route suites pass 27
  tests and its owned paths do not overlap the comparison tray, verify-email,
  or API-token candidates.
- Blockers: none.

## Boundaries

- Preserve `affiliateSetupPagePath` as the canonical page-size-preserving and
  cursor-encoding path owner.
- Preserve first-page visibility only when Relay reports a previous page and a
  current cursor exists.
- Preserve next-page visibility only when Relay reports a next page and a non-
  empty end cursor exists.
- Leave shared `Pagination` markup, labels, and presentation in React.

## Verification

- `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup-loader.test.ts test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the affiliate-setup pagination module
- `git diff --check`
