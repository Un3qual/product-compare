# Frontend Recommendation Result View Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after current source inspection and the passing
  recommendation-panel characterization in the 138-test successor cohort.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Recommendation Result View-Data Contract

- Status: ready on 2026-07-15.
- Next action: isolate winner selection, supported/no-winner reasons, and exact
  evidence copy in a framework-free module while retaining Relay fetching,
  profile navigation, suspense/error handling, markup, and styling in
  `RecommendationPanel`.
- Candidate evidence: current source inspection found the result presentation
  policy embedded in the React owner and distinct from completed profile/path
  and snapshot-publish contracts; characterization passed in the five-suite,
  138-test successor validation run.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/compare/recommendation-view-data.test.ts test/routes/compare/recommendation-panel.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
