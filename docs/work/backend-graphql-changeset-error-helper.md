# Backend GraphQL Changeset Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-mutation-error-helper.md`
  - `docs/work/backend-graphql-affiliate-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-changeset-error-helper-implementation-plan.md`
- Objective:
  - Centralize resolver-local first changeset error extraction in `ProductCompareWeb.GraphQL.Errors`.

## Verified Current State

- `ProductCompareWeb.GraphQL.Errors` owns typed mutation error maps and changeset mutation error list shaping.
- `ProductCompareWeb.GraphQL.Errors.changeset_first_error/1` owns first field/message extraction for changesets.
- `ProductCompareWeb.GraphQL.Errors.changeset_first_message/1` owns first-message extraction for resolver payloads that do not expose a field.
- Auth token mutations need only the first changeset error message; Affiliate mutations need both the first changeset field and message.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found duplicate first changeset error extraction after generic GraphQL mutation error helper centralization.
  - Moving this behavior into `ProductCompareWeb.GraphQL.Errors` keeps resolver mutation error shaping consistent.

## Verification Commands

- `mix test test/product_compare_web/graphql/errors_test.exs`
- `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-changeset-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, GraphQL Changeset First Error Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Errors.changeset_first_error/1` and `changeset_first_message/1`.
  - Reused the existing changeset interpolation behavior for first-error extraction.
  - Replaced Auth and Affiliate resolver-local first changeset error helpers with shared helper calls.
- Verification:
  - `mix test test/product_compare_web/graphql/errors_test.exs`
  - `mix test test/product_compare_web/graphql/errors_test.exs test/product_compare_web/graphql/api_token_auth_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
