# Frontend Recommendation Profile Navigation Work Doc

## Snapshot

- Status: complete (recommendation profile route data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-15 after RED/GREEN, consumer-suite, TypeScript, and
  framework-boundary validation (34 recommendation and snapshot tests).

## Recommendation Profile Route Data Contract

- Status: complete on 2026-07-15 on `codex/frontend-route-data-contracts`.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Completed: `recommendation-route-data.ts` now owns exact profile parsing,
  ordered profile paths, and recommendation-only loader revalidation. The
  loader preserves its public re-exports while the panel and share control use
  the shared parser/type without changing Relay reads, snapshots, boundaries,
  reset behavior, or markup.
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
  - RED: `cd assets && bun x vitest run test/routes/compare/recommendation-route-data.test.ts` failed because `recommendation-route-data.ts` did not exist.
  - GREEN: `cd assets && bun x vitest run test/routes/compare/recommendation-route-data.test.ts` passed 23 tests.
  - `cd assets && bun x vitest run test/routes/compare/recommendation-route-data.test.ts test/routes/compare/recommendation-panel.test.tsx test/routes/compare/comparison-snapshots.test.tsx` passed 34 tests.
  - `cd assets && bun run typecheck` passed.
  - Framework import scan over `recommendation-route-data.ts` and its only
    transitive local dependency, `paths.ts`, found no React, router, Relay, or
    StyleX imports.
  - `git diff --check` passed for the owned milestone files.
- Exit condition: one framework-free owner preserves exact best-value parsing,
  lowest-cost fallback, ordered encoded slugs, specification mode, profile
  query defaults, and recommendation-only revalidation. The completed
  `share-comparison-data.ts` contract retains snapshot publish-input and
  GraphQL profile mapping.
- Candidate evidence: current source inspection found the deterministic policy
  split between `loader.ts` and `RecommendationPanel.tsx`. The existing
  recommendation-panel and comparison-snapshot suites passed 11 tests. Current
  source inspection also confirmed snapshot publish-input and its profile
  mapping are already complete in `share-comparison-data.ts`, so they remain
  explicitly outside this row.
