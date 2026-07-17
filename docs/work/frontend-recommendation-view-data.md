# Frontend Recommendation Result View Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with the 8-test pure contract suite and 5-test
  recommendation-panel suite passing (13 total), plus clean TypeScript,
  dependency-boundary, and diff checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Recommendation Result View-Data Contract

- Status: done on 2026-07-16 on
  `codex/category-alert-recommendation-contracts`.
- Delivered `getRecommendationViewData`, a framework-free contract for
  first-source-match winner selection, supported versus no-winner reasons in
  source order, and exact singular/plural claim-reference evidence copy.
  `RecommendationPanel` retains Relay fetching, profile navigation, suspense
  and error boundaries, markup, and StyleX presentation.
- Evidence: the pure contract suite first failed as expected because
  `recommendation-view-data.ts` did not exist. After the minimal extraction,
  `cd assets && bun x vitest run test/routes/compare/recommendation-view-data.test.ts test/routes/compare/recommendation-panel.test.tsx`
  passed 13 tests; `cd assets && bun run typecheck` passed; the forbidden
  framework/transport import scan returned no matches; and `git diff --check`
  passed.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/compare/recommendation-view-data.test.ts test/routes/compare/recommendation-panel.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure view-data module
- `git diff --check`
