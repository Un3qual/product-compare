# Frontend Compare Saved-Set Mutation Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 8 pure mutation-data tests plus 116 compare
  save-feedback and route characterization tests passing (124 total), clean
  TypeScript, dependency-boundary, and diff checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare Saved-Set Mutation Data Contract

- Status: done on 2026-07-16 on
  `codex/category-alert-recommendation-contracts`.
- Delivered `saved-comparison-mutation-data.ts`, a framework-free owner of
  ordered create input and structural completion policy. It composes the
  existing saved-comparison naming and shared route-error policies, preserves
  duplicate product IDs in source order, and returns the exact success copy.
  `CompareRoute` retains its ready and in-flight guards, request identity,
  Relay callbacks, feedback, query reads, markup, and styling.
- Evidence: the pure test suite first failed because the new module did not
  exist. After the minimal extraction, the pure, save-feedback, and compare
  route suites passed 124 tests; TypeScript, the framework/transport scan, and
  `git diff --check` passed.
- Blockers: none.

## Boundaries

- Compose `buildSavedComparisonName`; do not duplicate its trimming, fallback,
  singular, ordering, or duplicate-name semantics.
- Preserve product-ID source order without deduplication.
- Preserve `hasRouteGraphQLErrors` and `routeMutationErrorMessage` as the shared
  error-policy owners rather than copying their behavior.
- Leave Relay commits, request refs, stale-completion guards, lifecycle
  callbacks, feedback state, and presentation in `CompareRoute`.
- Do not absorb saved-set deletion or public snapshot sharing behavior.

## Verification

- `cd assets && bun x vitest run test/routes/compare/saved-comparison-mutation-data.test.ts test/routes/compare/compare-save-feedback.test.tsx test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure mutation-data module
- `git diff --check`
