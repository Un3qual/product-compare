# Frontend Saved-Comparison Delete Mutation Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with the extracted mutation-data and route-state
  suites passing 38 tests, TypeScript typechecking cleanly, and a pure-module
  framework/transport dependency scan finding no references.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Saved-Comparison Delete Mutation Data Contract

- Status: completed on 2026-07-16.
- Delivered: `saved-comparison-delete-mutation-data.ts` now builds exact delete
  variables and resolves a structural deleted ID or the shared route error.
  `SavedComparisonsRoute` retains the row-scoped in-flight guard, Relay
  lifecycle, pending/deleted state, feedback, query retention, markup, and
  styling.
- Evidence: the new pure suite first failed because its module was absent, then
  `bun x vitest run test/routes/compare/saved-comparison-delete-mutation-data.test.ts test/routes/compare/saved-comparisons-route-state.test.tsx`
  passed 38 tests. `bun run typecheck` completed with `tsc --noEmit`; the
  framework/transport scan found no references; and `git diff --check` passed.
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
