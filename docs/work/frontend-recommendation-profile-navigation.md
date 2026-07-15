# Frontend Recommendation Profile Navigation Work Doc

## Snapshot

- Status: ready (recommendation profile route data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and consumer-suite validation
  (11 recommendation and snapshot tests).

## Recommendation Profile Route Data Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: consolidate deterministic recommendation-profile route policy
  in a framework-free contract while preserving Relay reads, snapshots,
  boundaries, and panel markup.
- Owned paths:
  - `assets/src/routes/compare/recommendation-route-data.ts`
  - `assets/src/routes/compare/loader.ts`
  - `assets/src/routes/compare/RecommendationPanel.tsx`
  - `assets/src/routes/compare/ShareComparisonControl.tsx`
  - `assets/test/routes/compare/recommendation-route-data.test.ts`
  - `assets/test/routes/compare/recommendation-panel.test.tsx`
  - `assets/test/routes/compare/comparison-snapshots.test.tsx`
  - `docs/work/frontend-recommendation-profile-navigation.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/recommendation-route-data.test.ts test/routes/compare/recommendation-panel.test.tsx test/routes/compare/comparison-snapshots.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: one framework-free owner preserves exact best-value parsing,
  lowest-cost fallback, ordered encoded slugs, specification mode, profile
  query defaults, GraphQL enum mapping, and recommendation-only revalidation.
- Candidate evidence: current source inspection found the deterministic policy
  split between `loader.ts` and `RecommendationPanel.tsx`. The existing
  recommendation-panel and comparison-snapshot suites passed 11 tests.
