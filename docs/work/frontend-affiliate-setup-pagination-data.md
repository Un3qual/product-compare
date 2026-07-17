# Frontend Affiliate-Setup Pagination Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 33 passing affiliate-setup loader and route
  tests, green TypeScript and dependency checks, and the full 771-backend /
  1,323-frontend repository gate.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Affiliate Setup Pagination Data Contract

- Status: completed on 2026-07-17 on
  `codex/frontend-mutation-outcome-contracts`.
- Result: the existing framework-free affiliate-setup pagination owner now
  returns exact first-page and next-page hrefs while `AffiliateSetupRoute`
  retains shared markup, labels, and presentation.
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

## Completion Evidence

- RED: the loader suite failed six new pagination cases because
  `buildAffiliateSetupPaginationData` did not exist.
- Focused GREEN: the loader and unchanged route suites passed 33 tests.
- TypeScript exposed Relay's optional `endCursor` identity; the React adapter
  now normalizes `undefined` to the pure contract's canonical `null`. TypeScript
  then passed with no errors.
- The pagination owner has no React, React Router, Relay, generated GraphQL, or
  StyleX dependency, and `git diff --check` passed.
- `mix ci` passed 771 backend and 1,323 frontend tests. Client production build
  validation passed at 596,289 raw / 182,135 gzip bytes for the initial
  JavaScript bundle.
