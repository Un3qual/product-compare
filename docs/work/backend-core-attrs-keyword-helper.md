# Backend Core Attrs Keyword Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-31 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-core-attrs-helper.md`
  - `docs/work/backend-core-attrs-presence-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-31-backend-core-attrs-keyword-helper-implementation-plan.md`
- Objective:
  - Extend `ProductCompare.Attrs` to cover keyword inputs and route Commerce Attribution revenue filter lookup through the shared helper.

## Verified Current State

- `ProductCompare.Attrs` owns core atom/string map lookup, keyword lookup, non-map normalization, nil-skipping insertion, key-presence checks, and non-nil presence checks.
- `ProductCompare.CommerceAttribution` delegates revenue summary keyword/map filter lookup through `ProductCompare.Attrs`.
- Commerce Attribution no longer carries a private revenue-filter lookup helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch is complete:
  - Focused core attrs and Commerce Attribution coverage passes with revenue filter lookup delegated to `ProductCompare.Attrs`.
  - Full frontend and backend verification passed after the helper extraction.
  - The persistent code-review goal remains active, but this selected batch is complete.

## Verification Commands

- `mix test test/product_compare/attrs_test.exs`
- `mix test test/product_compare/attrs_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: backend
- Owned paths: `lib/product_compare/attrs.ex`, `lib/product_compare/commerce_attribution.ex`, `test/product_compare/attrs_test.exs`, `test/product_compare/commerce_attribution/commerce_attribution_test.exs`, this file, and `docs/plans/2026-05-31-backend-core-attrs-keyword-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

- Backend Core Attrs Keyword Helper:
  - Added keyword-list support to `ProductCompare.Attrs.fetch/3` and `has_key?/2`.
  - Routed Commerce Attribution revenue filter lookup through the shared core helper.
  - Verified `mix test test/product_compare/attrs_test.exs`, `mix test test/product_compare/attrs_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.
