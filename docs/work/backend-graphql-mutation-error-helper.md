# Backend GraphQL Mutation Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-auth-migration.md`
  - `docs/work/backend-graphql-unauthenticated-mutation-error-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-mutation-error-helper-implementation-plan.md`
- Objective:
  - Centralize generic typed mutation error and changeset error shaping so GraphQL resolvers stop duplicating error-map and changeset traversal helpers.

## Verified Current State

- `ProductCompareWeb.GraphQL.Errors` owns top-level unauthenticated errors and the typed unauthenticated mutation error shape.
- `ProductCompareWeb.GraphQL.Errors.mutation_error/3` now owns generic typed mutation error map construction.
- `ProductCompareWeb.GraphQL.Errors.changeset_mutation_errors/1` now owns Ecto changeset traversal and interpolation for typed mutation payloads.
- Auth, catalog, and affiliate resolvers delegate generic typed error construction to the shared GraphQL errors helper.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found resolver-local duplication next to the shared unauthenticated mutation error helper.
  - The generic mutation error cleanup is complete and no broader GraphQL auth-error refactor is queued from this pass.

## Verification Commands

- `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/graphql/**`, `lib/product_compare_web/resolvers/**`, `test/product_compare_web/graphql/**`, this file, and `docs/plans/2026-05-30-backend-graphql-mutation-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Generic Mutation Error Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused coverage for `ProductCompareWeb.GraphQL.Errors.mutation_error/3` and `changeset_mutation_errors/1`.
  - Added shared typed mutation error map construction and changeset interpolation helpers.
  - Removed resolver-local generic mutation error and changeset traversal helpers from auth, catalog, and affiliate resolvers.
- Verification:
  - `mix test test/product_compare_web/graphql/errors_test.exs`
  - `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
