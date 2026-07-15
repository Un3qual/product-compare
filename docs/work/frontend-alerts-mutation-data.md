# Frontend Alerts Mutation Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and the passing
  alerts characterization in the 138-test successor cohort.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Alerts Mutation Data Contract

- Status: ready on 2026-07-15.
- Next action: isolate toggle/delete/mark-read variables and operation-specific
  success/error resolution in a framework-free module while retaining pending
  state, Relay commits, revalidation, feedback, and presentation in
  `AlertsRoute`.
- Candidate evidence: current source inspection found all three deterministic
  mutation contracts embedded in the React owner; alerts characterization
  passed in the five-suite, 138-test successor validation run.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/account/alerts/alerts-mutation-data.test.ts test/routes/account/alerts/alerts.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure mutation-data module
- `git diff --check`
