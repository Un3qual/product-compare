# Frontend Shared Comparison Mutation Data

## Snapshot

- Status: done
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-16 with 11 pure sharing-contract tests and 6
  comparison-snapshot tests passing (17 total), plus clean TypeScript,
  dependency-boundary, and diff checks.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`

## Shared Comparison Mutation Data Contract

- Status: done on 2026-07-16.
- Delivered a framework-free sharing contract for publish/revoke mutation
  variables, structural publish-payload and source-node projection, immutable
  published/revoked state transitions, and exact success copy.
  `ShareComparisonControl` retains FormData adaptation, Relay commits, pending
  state, pagination, feedback errors, callbacks, markup, and StyleX.
- Evidence: the pure contract suite first failed as expected because the new
  pure APIs did not exist. After the minimal extraction,
  `cd assets && bun x vitest run test/routes/compare/share-comparison-data.test.ts test/routes/compare/comparison-snapshots.test.tsx`
  passed 17 tests; `cd assets && bun run typecheck` passed; the framework/
  transport dependency scan returned no matches; and `git diff --check` passed.
- Blockers: none.

## Verification

- `cd assets && bun x vitest run test/routes/compare/share-comparison-data.test.ts test/routes/compare/comparison-snapshots.test.tsx`
- `cd assets && bun run typecheck`
- framework/transport dependency scan of the pure sharing module
- `git diff --check`
