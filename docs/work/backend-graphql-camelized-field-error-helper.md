# Backend GraphQL Camelized Field Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-mutation-error-helper.md`
  - `docs/work/backend-graphql-changeset-error-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-camelized-field-error-helper-implementation-plan.md`
- Objective:
  - Move GraphQL typed mutation error camelCase field-name normalization into `ProductCompareWeb.GraphQL.Errors`.

## Verified Current State

- `ProductCompareWeb.GraphQL.Errors` owns typed mutation error maps.
- `ProductCompareWeb.GraphQL.Errors.camelized_mutation_error/3` owns typed mutation error maps with camelCase GraphQL field names.
- `ProductCompareWeb.Resolvers.AffiliateResolver` delegates GraphQL mutation error field-name normalization to the shared error helper.
- Affiliate mutation tests cover the public camelCase `field` values for invalid affiliate network and merchant IDs.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found resolver-local GraphQL mutation error field-name normalization after mutation error helper centralization.
  - Moving camelCase field-name normalization into `ProductCompareWeb.GraphQL.Errors` keeps typed mutation error construction consistent.

## Verification Commands

- `mix test test/product_compare_web/graphql/errors_test.exs`
- `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-camelized-field-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, GraphQL Camelized Mutation Field Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Errors.camelized_mutation_error/3` for typed mutation errors that expose GraphQL camelCase input field names.
  - Added focused helper coverage for snake_case atom fields, snake_case string fields, and nil fields.
  - Replaced Affiliate resolver-local field-name camelization with the shared helper.
- Verification:
  - `mix test test/product_compare_web/graphql/errors_test.exs`
  - `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
