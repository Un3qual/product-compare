# Backend GraphQL Global ID Field Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-global-id-encode-helper.md`
  - `docs/work/backend-graphql-connection-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-global-id-field-helper-implementation-plan.md`
- Objective:
  - Move GraphQL field resolver global ID wrapping helpers into `ProductCompareWeb.GraphQL.GlobalId`.

## Verified Current State

- `ProductCompareWeb.GraphQL.GlobalId.encode/2` owns integer and binary local-ID encoding.
- `ARCHITECTURE.md` records GraphQL global ID local-value normalization and encoding as centralized in `ProductCompareWeb.GraphQL.GlobalId`.
- `ProductCompareWeb.GraphQL.GlobalId.encode_required/2` and `encode_optional/2` own Absinthe field resolver ID wrapping.
- `ProductCompareWeb.Schema` delegates object field global ID resolvers to `ProductCompareWeb.GraphQL.GlobalId`.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found schema-local global ID resolver wrapping helpers after global ID encoding centralization.
  - Moving the field resolver wrappers into `ProductCompareWeb.GraphQL.GlobalId` keeps ID encoding behavior centralized and reusable.

## Verification Commands

- `mix test test/product_compare_web/graphql/global_id_test.exs`
- `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-global-id-field-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, GraphQL Global ID Field Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Added `ProductCompareWeb.GraphQL.GlobalId.encode_required/2` and `encode_optional/2` for Absinthe field resolver ID wrappers.
  - Added focused helper coverage for required integer IDs, required binary IDs, unsupported local values, and optional nil handling.
  - Replaced schema-local global ID wrapper helpers with shared `GlobalId` helper calls.
- Verification:
  - `mix test test/product_compare_web/graphql/global_id_test.exs`
  - `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/node_query_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
