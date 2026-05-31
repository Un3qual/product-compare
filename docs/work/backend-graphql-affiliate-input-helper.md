# Backend GraphQL Affiliate Input Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-graphql-input-helper.md`
  - `docs/work/backend-graphql-global-id-field-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-affiliate-input-helper-implementation-plan.md`
- Objective:
  - Move Affiliate resolver optional Relay integer-ID field normalization onto the shared GraphQL input helper.

## Verified Current State

- `ProductCompareWeb.GraphQL.Input` owns atom/string input lookup and integer-backed Relay ID decoding helpers.
- Pricing, commerce attribution, and catalog resolvers already use shared GraphQL input helpers for common ID decoding behavior.
- `ProductCompareWeb.GraphQL.Input.decode_optional_integer_id_field/4` owns optional integer-backed Relay ID field normalization.
- `ProductCompareWeb.Resolvers.AffiliateResolver` delegates optional affiliate ID input normalization to the shared GraphQL input helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - `ARCHITECTURE.md` records GraphQL global ID normalization as centralized, and review found remaining Affiliate resolver-local optional ID casting.
  - A shared optional integer-ID field helper keeps affiliate mutation input handling aligned with the rest of the GraphQL layer.

## Verification Commands

- `mix test test/product_compare_web/graphql/input_test.exs`
- `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare_web/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-affiliate-input-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Affiliate GraphQL Input Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Added `ProductCompareWeb.GraphQL.Input.decode_optional_integer_id_field/4` for optional integer-backed Relay ID map-field normalization.
  - Added focused helper coverage for present IDs, missing optional fields, nil optional fields, raw IDs, and wrong-type Relay IDs.
  - Replaced Affiliate resolver-local global ID casting with shared helper calls for affiliate network, merchant, merchant product, and artifact inputs.
- Verification:
  - `mix test test/product_compare_web/graphql/input_test.exs`
  - `mix test test/product_compare_web/graphql/input_test.exs test/product_compare_web/graphql/affiliate_workflows_test.exs`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
