# Frontend Saved-Comparison Delete Mutation Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 43 passing
  saved-comparisons route-data and route-state characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Saved-Comparison Delete Mutation Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate exact delete variables and structural completion as a
  deleted ID or shared route error in a framework-free mutation-data module
  while retaining row-scoped in-flight guards, Relay lifecycle, state,
  feedback, query retention, markup, and styling in `SavedComparisonsRoute`.
- Candidate evidence: current source inspection found delete-variable
  construction and completion interpretation embedded in
  `SavedComparisonsRoute`; the existing route-data and route-state suites pass
  43 tests, and the candidate owns no paths from Tasks 31 through 33.
- Blockers: none.

## Boundaries

- Preserve the generated delete mutation shape and saved-set ID source.
- Preserve top-level GraphQL error precedence even when the payload contains a
  deleted ID.
- Preserve the current structural-success behavior when a deleted ID is
  present, including payloads that also carry typed errors.
- Preserve `routeMutationErrorMessage` as the shared error-policy owner rather
  than copying its behavior.
- Leave Relay commits and callbacks, row-scoped concurrency and cleanup,
  pending and deleted set state, query retention, markup, and presentation in
  `SavedComparisonsRoute`.

## Verification

- `cd assets && bun x vitest run test/routes/compare/saved-comparison-delete-mutation-data.test.ts test/routes/compare/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure mutation-data module
- `git diff --check`
