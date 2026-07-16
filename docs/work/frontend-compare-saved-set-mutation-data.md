# Frontend Compare Saved-Set Mutation Data

## Snapshot

- Status: active
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 116 passing
  compare save-feedback and route characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Compare Saved-Set Mutation Data Contract

- Status: active on 2026-07-16 on
  `codex/category-alert-recommendation-contracts`.
- Next action: isolate the exact ordered create-saved-set input and structural
  completion result in a framework-free mutation-data module while retaining
  ready and in-flight guards, request identity, Relay callbacks, feedback,
  query reads, markup, and styling in `CompareRoute`.
- Candidate evidence: current source inspection found variable construction
  and completion interpretation embedded in `CompareRoute`; the existing pure
  naming module already owns adjacent name policy, and the save-feedback and
  compare route suites pass 116 tests.
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
