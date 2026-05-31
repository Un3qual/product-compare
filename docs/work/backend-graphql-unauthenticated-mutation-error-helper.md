# Backend GraphQL Unauthenticated Mutation Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-auth-migration.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-unauthenticated-mutation-error-helper-implementation-plan.md`
- Objective:
  - Centralize typed mutation unauthenticated error construction so GraphQL resolvers do not repeat the `UNAUTHENTICATED` code and `unauthorized` message pair.

## Verified Current State

- `ProductCompareWeb.GraphQL.Errors` centralizes top-level unauthenticated GraphQL errors and the shared unauthenticated code.
- `ProductCompareWeb.GraphQL.Errors.unauthenticated_mutation_error/0` now owns the typed mutation unauthenticated error shape.
- API token, saved-comparison, and affiliate resolver-local typed mutation payloads now consume the shared typed unauthenticated error helper.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found resolver-local duplication in the typed mutation error boundary after the prior unauthenticated error-code cleanup.
  - The typed error helper cleanup is complete and no broader GraphQL auth-error refactor is queued from this pass.

## Verification Commands

- `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/graphql/**`, `lib/product_compare_web/resolvers/**`, `test/product_compare_web/graphql/**`, this file, and `docs/plans/2026-05-30-backend-graphql-unauthenticated-mutation-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Typed Unauthenticated Mutation Error Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused coverage for `ProductCompareWeb.GraphQL.Errors.unauthenticated_mutation_error/0`.
  - Added the shared typed mutation unauthenticated error helper beside the existing top-level unauthenticated GraphQL error helper.
  - Routed API token, saved-comparison, and affiliate resolver-local unauthenticated typed mutation payloads through the shared helper.
- Verification:
  - `mix test test/product_compare_web/graphql/errors_test.exs`
  - `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
