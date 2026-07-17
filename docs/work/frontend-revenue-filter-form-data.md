# Frontend Revenue Filter-Form Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-17 after current source inspection and 23 passing
  revenue view-data and route tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Revenue Filter-Form Data Contract

- Status: ready on 2026-07-17.
- Next action: move normalized uncontrolled-form values and reset identity from
  `RevenueSummaryView` into its existing framework-free view-data owner.
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
