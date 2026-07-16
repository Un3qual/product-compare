# Frontend Root Destination Policy Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and the passing
  root characterization in the 82-test successor cohort.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Root Destination Policy Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate ordered public, shopper, authenticated, operator,
  secondary, and auth destination composition for guest, member, and operator
  viewers in a framework-free module while retaining active-path matching,
  NavLink/Button composition, semantic navigation, and styling in
  `RootDestinations`.
- Candidate evidence: current source inspection found static destination copy,
  secondary-public filtering, and viewer-specific group composition embedded
  in the React owner; the root characterization passed in the three-suite,
  82-test successor validation run.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/root-destination-data.test.ts test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure data module
- `git diff --check`
