# Saved Comparisons Backend Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 (UTC) at commit `821067e` (clean working tree)
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-18-saved-comparisons-backend-implementation-plan.md`
- Definition of done:
  - The database stores authenticated users' private saved comparison sets as owner-scoped records with ordered product items.
  - `ProductCompare.Catalog` exposes create/list/delete APIs with deterministic validation around empty, duplicate, missing, and over-limit product selections.
  - GraphQL exposes an authenticated saved-comparison connection query plus typed create/delete mutations without adding browser-facing REST endpoints.
  - Focused catalog and GraphQL tests cover the saved-comparison contract.
  - `docs/work/index.md`, `docs/plans/NOW.md`, and `docs/implementation-checklist.md` record the resulting state.

## Verified Current State

Changes include:
- `priv/repo/migrations/20260318120000_create_saved_comparison_sets.exs` creates owner-scoped saved comparison set and item tables.
- `lib/product_compare/catalog.ex` exposes create/list/delete saved-comparison helpers alongside the existing product and brand APIs.
- `lib/product_compare_web/schema.ex` exposes saved-comparison query, mutation, and object types.
- `lib/product_compare_web/resolvers/catalog_resolver.ex` handles saved-comparison query and mutation flows in addition to catalog browse/detail.
- `assets/src/routes/compare/index.tsx` and `assets/src/routes/compare/api.ts` are still frontend-only today, which is why the next queued slice is the frontend saved-comparisons UI.

## Completed

- Added `priv/repo/migrations/20260318120000_create_saved_comparison_sets.exs` for owner-scoped saved comparison sets and ordered item rows.
- Added `lib/product_compare_schemas/catalog/saved_comparison_set.ex` and `lib/product_compare_schemas/catalog/saved_comparison_item.ex`.
- Extended `lib/product_compare/catalog.ex` with create/list/delete saved-comparison APIs and deterministic empty/duplicate/missing/over-limit validation.
- Extended `lib/product_compare_web/schema.ex`, `lib/product_compare_web/resolvers/catalog_resolver.ex`, and `lib/product_compare_web/graphql/global_id.ex` with `mySavedComparisonSets`, `createSavedComparisonSet`, and `deleteSavedComparisonSet`.
- Added focused backend coverage in `test/product_compare/catalog/saved_comparison_set_test.exs` and `test/product_compare_web/graphql/saved_comparisons_test.exs`.

## Closure

- This backend work item is complete.
- The next unblocked slice is the frontend saved-comparisons UI work queued in `docs/work/frontend-saved-comparisons-ui.md`.

## Verification Commands

- `sed -n '1,220p' ARCHITECTURE.md`
- `sed -n '1,220p' docs/plans/INDEX.md`
- `sed -n '1,260p' docs/plans/NOW.md`
- `sed -n '1,260p' docs/work/index.md`
- `sed -n '1,260p' docs/work/saved-comparisons-backend.md`
- `sed -n '1,320p' lib/product_compare/catalog.ex`
- `sed -n '1,320p' lib/product_compare_web/resolvers/catalog_resolver.ex`
- `sed -n '1,360p' lib/product_compare_web/schema.ex`
- `rg -n "saved comparison|saved_comparison" lib test assets/src priv/repo/migrations`
- `rg -n "saved comparison|saved_comparison|savedComparison" lib/product_compare_web/router.ex lib/product_compare_web/controllers`
- `mix test test/product_compare/catalog/saved_comparison_set_test.exs test/product_compare_web/graphql/saved_comparisons_test.exs test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare_web/graphql/session_auth_test.exs test/product_compare_web/graphql/api_token_auth_test.exs`
- `mix typecheck`
