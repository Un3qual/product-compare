# Community Submissions Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-community-submissions-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the direct community-trust
  characterization path.

## Target Outcome

`ProductCompare.Discussions.Submissions` remains the stable discussion-context
boundary while idempotent creation, owner lifecycle actions, reporting, and
shared write-limit persistence live in focused internal modules with unchanged
transactions, ownership, moderation lifecycle, idempotency, limits, values,
and errors.

## Ready Evidence

- `lib/product_compare/discussions/submissions.ex` is 483 lines and combines
  four concrete implementation responsibilities behind six stable functions.
- `ProductCompare.Discussions` is the only production caller.
- The direct community-trust characterization gate passed 25 tests on
  2026-07-23.
- Creation, owner actions, reports, and write-limit accounting enforce one
  community write lifecycle and remain internal slices rather than separate
  queue batches.
- The owned source and direct-test paths are disjoint from Discussions
  Resolver decomposition and the other replenished successors.

## Internal Slices

1. Review, question, and answer creation plus idempotent receipts.
2. Owner update and retained-removal lifecycle.
3. Attributable duplicate-safe reporting.
4. Transactional UTC-hour write-limit accounting.
5. Stable submissions facade and exact result parity.

## Boundaries

- Preserve all six stable functions, arguments, return values, changesets,
  atoms, transactions, locks, and rollbacks.
- Preserve Global UUID targets, idempotency digests and conflicts, ownership,
  moderation reset, accepted-answer cleanup, report deduplication, and
  committed-only UTC-hour counters.
- Keep `ProductCompare.Discussions` as the only production caller.
- Do not change schemas, migrations, limits, authorization, moderation,
  GraphQL, Relay, or frontend behavior.

## Verification

- `mix test test/product_compare/discussions/community_trust_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Completion Evidence

- Completed on 2026-07-23 on the aggregate detached-worktree commit stack.
- The stable facade is 47 lines.
- `WriteLimits` is 65 lines, `Creates` is 183 lines, `OwnerActions` is 178
  lines, and `Reports` is 74 lines.
- The existing `ProductCompare.Discussions.Moderation` boundary owns the
  cross-content entropy lookup shared by creation replay and reporting; this
  removed the exact-copy group exposed by the extraction.
- The exact characterization gate passed 25 tests with no failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check` passed.
- Final `mix ci` passed 913 backend tests and 1,507 frontend tests, plus every
  quality, duplication, type, Relay, build, and bundle gate.
- Production references to focused owners are limited to the stable facade or
  modules inside the same implementation namespace.
