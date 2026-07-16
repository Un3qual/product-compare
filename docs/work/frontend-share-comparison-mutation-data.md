# Frontend Shared Comparison Mutation Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and the passing
  comparison-snapshot characterization in the 82-test successor cohort.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Shared Comparison Mutation Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate publish/revoke variables, structural snapshot
  projection, immutable local publish/revoke state, and exact success copy in
  the existing framework-free sharing module while retaining forms, Relay,
  pagination, pending state, error feedback, markup, and styling in
  `ShareComparisonControl`.
- Candidate evidence: current source inspection found payload and source-node
  projection plus publish/revoke state transitions embedded in the React owner;
  the sharing module already owns the adjacent transport-neutral snapshot
  contract, and the snapshot characterization passed in the three-suite,
  82-test successor validation run.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/compare/share-comparison-data.test.ts test/routes/compare/comparison-snapshots.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure sharing module
- `git diff --check`
