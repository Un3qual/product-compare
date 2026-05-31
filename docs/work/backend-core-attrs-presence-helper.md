# Backend Core Attrs Presence Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-31 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/backend-core-attrs-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-31-backend-core-attrs-presence-helper-implementation-plan.md`
- Objective:
  - Extend `ProductCompare.Attrs` with reusable attr presence checks and route Commerce Attribution attr-presence handling through the core helper.

## Verified Current State

- `ProductCompare.Attrs` owns core atom/string attr lookup, non-map normalization, nil-skipping insertion, key-presence checks, and non-nil presence checks.
- `ProductCompare.CommerceAttribution` delegates conversion-upsert click-session lookup, default attribution confidence, and upsert-field detection through `ProductCompare.Attrs`.
- Commerce Attribution no longer carries private duplicate attr lookup, insertion, or presence helpers.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch is complete:
  - Focused core attrs and Commerce Attribution coverage passes with attr presence checks delegated to `ProductCompare.Attrs`.
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
- Owned paths: `lib/product_compare/attrs.ex`, `lib/product_compare/commerce_attribution.ex`, `test/product_compare/attrs_test.exs`, `test/product_compare/commerce_attribution/commerce_attribution_test.exs`, this file, and `docs/plans/2026-05-31-backend-core-attrs-presence-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

- Backend Core Attrs Presence Helper:
  - Added `ProductCompare.Attrs.has_key?/2` and `present?/2`.
  - Replaced Commerce Attribution-local attr lookup, insertion, and presence helpers with shared core helper calls.
  - Verified `mix test test/product_compare/attrs_test.exs`, `mix test test/product_compare/attrs_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`, `cd assets && bun run check`, `mix test`, `mix format --check-formatted`, `mix compile --warnings-as-errors`, `mix typecheck`, and `git diff --check`.
