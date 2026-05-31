# Backend GraphQL Test Global ID Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/graphql-relay-contract-hardening.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-backend-graphql-test-global-id-helper-implementation-plan.md`
- Objective:
  - Make request-level GraphQL tests construct Relay global IDs through the shared application `GlobalId` contract instead of duplicated local Base64 helpers.

## Verified Current State

- `ProductCompareWeb.ConnCase` now imports a `relay_id/2` helper into connection tests.
- `relay_id/2` accepts the same atom type names used by `ProductCompareWeb.GraphQL.GlobalId` and stringifies local IDs before encoding.
- Request-level GraphQL tests under `test/product_compare_web/graphql` now use the shared helper and no longer define local `Base.encode64("#{type}:#{local_id}")` helpers.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active backend queue has no unblocked implementation batch.
  - Review found repeated test-only Relay global ID helpers that duplicated schema contract details.
  - The shared helper cleanup is complete and no broader GraphQL test-support rework is queued from this pass.

## Verification Commands

- `mix test test/product_compare_web/conn_case_test.exs`
- `mix test test/product_compare_web/conn_case_test.exs test/product_compare_web/graphql`
- `mix format --check-formatted`
- `mix test`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `cd assets && bun run check`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `test/support/**`, `test/product_compare_web/**`, this file, and `docs/plans/2026-05-30-backend-graphql-test-global-id-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Shared GraphQL Test Global ID Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused ConnCase coverage for integer-backed and entropy-backed GraphQL global ID helper calls.
  - Added `relay_id/2` to ConnCase so request-level GraphQL tests encode IDs through `ProductCompareWeb.GraphQL.GlobalId`.
  - Migrated GraphQL request tests off duplicated local Base64 Relay ID helpers.
- Verification:
  - `mix test test/product_compare_web/conn_case_test.exs`
  - `mix test test/product_compare_web/conn_case_test.exs test/product_compare_web/graphql`
  - `mix format --check-formatted`
  - `mix test`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `cd assets && bun run check`
  - `git diff --check`
