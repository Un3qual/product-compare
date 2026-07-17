# Frontend Share-Comparison Mutation Outcome Data

## Snapshot

- Status: completed
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 after the extracted pure contract and snapshot-
  control suites passed 30 tests, TypeScript passed, and dependency and diff
  scans were clean.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Share-Comparison Mutation Outcome Data Contract

- Status: completed on 2026-07-16 on
  `codex/frontend-mutation-outcome-contracts`.
- Completed action: isolated structural publish and revoke completion as the
  projected published snapshot or original revoked snapshot, or the shared
  route error, in the existing framework-free share-comparison data owner.
- Evidence: complete publish and revoke facts retain precedence when payload or
  top-level GraphQL errors coexist; incomplete facts delegate to the shared
  route-error policy; publish projection and revoke identity do not mutate
  their inputs. The focused pure and snapshot-control suites pass 30 tests.
- Full repository evidence: `mix ci` passed with 771 backend tests, 1,272
  frontend tests across 94 files, Relay validation, TypeScript, client and SSR
  builds, and the 182,140-byte gzip initial-bundle contract under its 200,000-
  byte budget. The existing six-clone budget remained unchanged.
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
