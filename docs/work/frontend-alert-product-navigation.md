# Frontend Alert Product Navigation

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 16 passing alert view-data and route tests,
  green TypeScript and diff checks, 771 passing standalone backend tests, and
  1,351 passing frontend tests plus client and SSR production builds.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Alert Product Navigation Contract

- Status: completed on 2026-07-17 on
  `codex/frontend-mutation-outcome-contracts`.
- Result: alert-event and watch product links now use the existing canonical
  `productDetailPath` builder while React retains every mutation, state, link,
  ordering, grouping, and presentation owner.
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

## Completion Evidence

- Characterization: the new route case passed before and after the refactor,
  proving exact reserved-character destinations for both alert-event and watch
  links without coupling the test to the implementation.
- Focused GREEN: the alert view-data and route suites passed 16 tests.
- TypeScript and `git diff --check` passed.
- Independent task review found no code, behavior, architecture, or test
  defects; its required documentation-state follow-up is resolved here.
- The standalone full backend suite passed 771 tests. Both `mix ci` attempts
  passed the queue, Credo, clone-budget, cross-function-smell, Dialyzer,
  frontend, and production-build stages, but their backend stages exposed two
  different unrelated transient failures: three PostgreSQL query-plan choices,
  then two 100 ms scheduler timing assertions. The exact failed files passed
  eight and 19 tests with the same seeds, respectively.
- The full frontend suite passed 1,351 tests. Client and SSR production builds
  passed; the initial JavaScript bundle was 596,344 raw / 182,155 gzip bytes.
