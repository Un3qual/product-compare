# Frontend Revenue Filter-Form Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 with 26 passing revenue view-data and route tests,
  TypeScript, dependency scan, full frontend gate, and diff hygiene.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Revenue Filter-Form Data Contract

- Status: done on 2026-07-17.
- Result: the existing framework-free owner now returns exact uncontrolled-
  form values and a JSON-encoded reset identity that cannot collide when
  filters contain delimiter characters.
- Candidate evidence: the current pipe-joined reset key can collide when filter
  values contain the delimiter, leaving stale uncontrolled values after
  navigation; the focused suites pass 23 tests.
- Blockers: none.

## Boundaries

- Preserve exact non-null filter values, including empty strings.
- Normalize only nullish form values to empty strings.
- Use a collision-free reset identity for network, currency, from, and to.
- Leave form fields, labels, submission, links, markup, and presentation in
  React.

## Verification

- `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the revenue view-data module
- `git diff --check`

## Completion Evidence

- RED: both new pure form-data cases failed because
  `buildRevenueSummaryFilterFormData` did not exist.
- GREEN: the revenue view-data and route suites passed 26 tests.
- Distinct delimiter-containing filter combinations now produce distinct reset
  identities while exact field values remain unchanged.
- The view-data owner remains free of React, Relay, router, StyleX, Radix, and
  generated-query imports.
- TypeScript, the full frontend gate, and diff hygiene passed on 2026-07-17.
