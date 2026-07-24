# Community Reads Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-community-reads-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against direct Discussions, community GraphQL,
  and Dataloader characterization paths.

## Target Outcome

`ProductCompare.Discussions.Reads` remains the stable Discussions-internal
facade while legacy lists, published content, viewer submissions, and bounded
public connections live in focused owners without behavior changes.

## Ready Evidence

- The 429-line facade combines four concrete read responsibilities.
- `ProductCompare.Discussions` remains the only production caller.
- Existing direct, GraphQL, and Dataloader suites characterize ordering,
  visibility, pagination, preloads, and query budgets.

## Internal Slices

1. Legacy thread, post, and review lists.
2. Published review and Q&A projections.
3. Viewer-owned submission projections.
4. Bounded public connection queries.
5. Stable read facade and pagination normalization.

## Boundaries

- Preserve every function, default, guard, result, query, order, preload,
  visibility rule, limit, and query budget.
- Do not change schemas, migrations, moderation, GraphQL, loaders, Relay, or
  frontend behavior.

## Verification

- `mix test test/product_compare/discussions test/product_compare_web/graphql/community_content_test.exs test/product_compare_web/graphql/dataloader_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Completion Evidence

- Completed on 2026-07-23 on the aggregate detached-worktree commit stack.
- The stable facade is 130 lines.
- `Legacy` is 47 lines, `PublicContent` is 127 lines,
  `ViewerSubmissions` is 148 lines, and `Connections` is 103 lines.
- The focused direct, GraphQL, and Dataloader gate passed 98 tests with no
  failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check` passed.
- Final `mix ci` passed 913 backend tests at 83.47% coverage and 1,507
  frontend tests, plus every quality, duplication, type, Relay, build, and
  bundle gate.
- Production references to focused owners are limited to the stable Reads
  facade.
