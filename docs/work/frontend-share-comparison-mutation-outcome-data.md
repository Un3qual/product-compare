# Frontend Share-Comparison Mutation Outcome Data

## Snapshot

- Status: ready
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after current source inspection and 17 passing
  share-comparison data and snapshot-control characterization tests.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Share-Comparison Mutation Outcome Data Contract

- Status: ready on 2026-07-16.
- Next action: isolate structural publish and revoke completion as the
  projected published snapshot or original revoked snapshot, or the shared
  route error, in the existing framework-free share-comparison data owner.
- Candidate evidence: current source inspection found publish and revoke
  completion interpretation embedded in `ShareComparisonControl`; the
  existing pure owner already builds inputs and variables, projects snapshots,
  and owns immutable snapshot state. Its focused suites pass 17 tests, and the
  candidate owns no paths from Tasks 34 through 36.
- Blockers: none.

## Boundaries

- Preserve the generated publish and revoke mutation shapes.
- Preserve current fact-first success when a complete published or revoked
  fact coexists with payload or top-level GraphQL errors.
- Preserve `routeMutationErrorMessage` as the shared error-policy owner rather
  than copying its behavior.
- Leave FormData and location adaptation, Relay mutation promises, hooks,
  component state and callbacks, paging, markup, and presentation in
  `ShareComparisonControl`.

## Verification

- `cd assets && bun x vitest run test/routes/compare/share-comparison-data.test.ts test/routes/compare/comparison-snapshots.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure share-comparison data module
- `git diff --check`
