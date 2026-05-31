# Backend GraphQL Commerce ID Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-input-helper.md`
  - `docs/work/backend-graphql-global-id-field-helper.md`
  - `docs/work/backend-graphql-affiliate-input-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-commerce-id-helper-implementation-plan.md`
- Objective:
  - Move Commerce attribution GraphQL optional ID decode/encode wrappers onto shared GraphQL helpers.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input.decode_optional_integer_id_field/4` owns optional integer-backed Relay ID field normalization.
- `ProductCompareWeb.GraphQL.GlobalId` owns Relay global ID local-value normalization and field resolver wrapping.
- `ProductCompareWeb.GraphQL.GlobalId.encode_optional_value/2` owns raw optional Relay ID value encoding for nested maps.
- `ProductCompareWeb.Resolvers.CommerceAttributionResolver` delegates revenue summary merchant/product filter ID decode and encode behavior to shared GraphQL helpers.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found Commerce attribution resolver-local optional ID helpers after GraphQL input/global ID helper centralization.
  - Moving these wrappers onto shared helpers keeps revenue summary ID handling aligned with the rest of the GraphQL layer.

## Verification Commands

- `mix test test/product_compare_web/graphql/global_id_test.exs`
- `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-commerce-id-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Commerce GraphQL ID Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Added `ProductCompareWeb.GraphQL.GlobalId.encode_optional_value/2` for raw optional Relay ID value encoding in nested GraphQL response maps.
  - Replaced Commerce attribution resolver-local optional global ID decode and encode wrappers with shared `Input` and `GlobalId` helper calls.
  - Preserved revenue summary filter and invalid-ID GraphQL behavior.
- Verification:
  - `mix test test/product_compare_web/graphql/global_id_test.exs`
  - `mix test test/product_compare_web/graphql/global_id_test.exs test/product_compare_web/graphql/commerce_revenue_summary_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
