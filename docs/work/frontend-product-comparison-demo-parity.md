# Frontend Product Comparison Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-30 after compare attribute metadata verification
- Implementation plan: `docs/plans/2026-05-31-frontend-product-comparison-demo-parity-implementation-plan.md`
- Recently completed usable-product plan: `docs/plans/2026-06-29-compare-selection-tray-implementation-plan.md`
- Recently completed implementation plan: `docs/plans/2026-06-27-project-compare-selection-controls-implementation-plan.md`
- Planned in-depth comparison follow-up plans:
  - `docs/plans/2026-06-30-compare-matrix-modes-implementation-plan.md`
  - `docs/plans/2026-06-30-compare-attribute-metadata-implementation-plan.md`
  - `docs/plans/2026-06-30-compare-offer-decision-helpers-implementation-plan.md`
- Objective: make product comparison demoable from the UI by exposing current product attributes and adding visible compare selection paths.

## Batch Status

- [x] Task 1: expose selected current product attributes through GraphQL `Product.currentAttributes`.
- [x] Task 2: render product attributes and a compare entry link on `/products/:slug`.
- [x] Task 3: add compare entry links from `/products`.
- [x] Task 4: add a product picker to `/compare`.
- [x] Task 5: render product attributes on compare cards.
- [x] Task 6: run full demo-slice verification and close queue docs.
- [x] Task 7: add compare selection remove controls.
- [x] Task 8: add a ready-state selected-product tray and add-another heading.
- [x] Task 9: add URL-backed compare matrix modes.
- [x] Task 10: add typed, ordered, groupable compare attribute metadata.

## Current Usable Product Batch

- Status: done.
- Plan: `docs/plans/2026-06-29-compare-selection-tray-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/index.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/compare` shows the active selected-product set, preserves
  URL-driven remove behavior, and keeps add/save flows intact.
- Completed verification:
  - RED: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "selected-product tray|add-another-product"` - failed as expected with 2 failing tests and 60 skipped because the selected tray region and ready-state add-another heading were not rendered.
  - GREEN: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "selected-product tray|add-another-product"` - 2 tests passed, 60 skipped.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx` - 62 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Completed Scope

### Task 1: GraphQL Current Attributes

- Added `ProductCompare.Specs.list_current_attributes_for_product/1` to read selected current claims with their attribute, unit, and enum-option context.
- Added GraphQL `Product.currentAttributes` backed by `ProductCompareWeb.Resolvers.CatalogResolver.current_attributes/3`.
- Added current-attribute display formatting for bool, int, numeric-with-unit, text, date, timestamp, enum, and JSON claim values.
- Added focused GraphQL coverage for selected current attributes and product records with no current claims.

### Task 2: Product Detail Specifications

- Updated the frontend Relay schema and `ProductDetailRouteQuery` to request `Product.currentAttributes`.
- Added a shared `ProductAttributeList` component and rendered a `Specifications` section on `/products/:slug`.
- Added a product-detail compare entry link to `/compare?slug=<product slug>`.
- Added focused product-detail route coverage for current attributes and the compare link.

### Task 3: Browse Compare Entry Links

- Added compare links to product browse cards while preserving the product-detail links.
- Added focused browse route coverage for first-rendered products and recovered route data.

### Task 4: Compare Product Picker

- Added a bounded Relay product-picker query for `/compare`.
- Rendered picker links in the empty compare state and in ready states with fewer than 3 selected products.
- Added focused compare route coverage for empty picker results, empty-state selection links, ready-state append links, and related save/Relay route suites.

### Task 5: Compare Card Attributes

- Rendered the shared product attribute list inside selected `/compare` product cards.
- Added focused compare route coverage for ready-state cards rendering current product attributes.
- Updated compare route ready-state fixtures to match the expanded `ProductDetailRouteQuery` product shape.

### Task 7: Compare Selection Removal

- Added remove links for each selected compare card in `/compare`.
- Added URL-safe compare-removal helpers that remove one selected slug by index and preserve remaining order.
- Ensured removing the last selected product routes back to `/compare` with no query string.
- Added focused compare route coverage for removing first, middle, last, and only selected products.

### Task 8: Compare Selection Tray

- Added a ready-state selected-product tray that lists the active products in
  URL order.
- Added tray-level remove links that reuse the URL-driven removal helper and
  preserve the remaining selected slug order.
- Labeled the ready-state picker as `Add another product` while preserving the
  existing empty-state product picker and save-comparison behavior.
- Added focused route coverage for the selected tray, tray remove links,
  add-another heading, and existing append/save behavior.

### Task 6: Full Demo Slice Verification

- Ran the focused backend/frontend demo-slice verification after Tasks 1-5.
- Ran the broader frontend check for the `assets` workspace.
- Closed the product-comparison demo parity lane with no remaining unblocked batch in this lane.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-compare-selection-controls-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/index.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/compare` users can remove selected products while preserving the remaining slug order.
- Completed verification:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx` - 60 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Follow-Up Candidates

- Add offer and price decision-helper rows to `/compare` using bounded active-offer context.
- Add a persistent compare tray across browse/detail pages.
- Add demo parity for API token management, affiliate setup, revenue reporting, and merchant discovery after their current queued refinements complete.

## Active Dispatch

- Status: ready.
- Plan:
  `docs/plans/2026-06-30-compare-offer-decision-helpers-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/queries/CompareOfferContextQuery.ts`
  - `assets/src/routes/compare/loader.ts`
  - `assets/src/routes/compare/index.tsx`
  - `assets/src/routes/compare/product-list.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `assets/schema.graphql`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/products/detail.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `mix test test/product_compare_web/graphql/pricing_queries_test.exs`
  - `git diff --check`
- Exit condition: `/compare` gives users a bounded, resilient decision summary
  for current price and offer quality alongside the specification matrix.

## Completed Attribute Metadata Dispatch

- Status: done.
- Plan:
  `docs/plans/2026-06-30-compare-attribute-metadata-implementation-plan.md`.
- Owned paths:
  - `priv/repo/migrations/*_add_compare_group_to_taxon_attributes.exs`
  - `lib/product_compare_schemas/specs/taxon_attribute.ex`
  - `lib/product_compare/specs.ex`
  - `lib/product_compare_web/schema.ex`
  - `lib/product_compare_web/resolvers/catalog_resolver.ex`
  - `test/product_compare_web/graphql/catalog_queries_test.exs`
  - `assets/src/routes/products/product-attribute-list.tsx`
  - `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
  - `assets/src/routes/compare/loader.ts`
  - `assets/src/routes/compare/product-list.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `assets/schema.graphql`
  - `assets/src/__generated__/**`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `mix ecto.migrate`
  - `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs`
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `mix typecheck`
  - `git diff --check`
- Exit condition: comparison rows can be grouped, ordered, and compared using
  typed metadata instead of display text alone, while preserving the existing
  `valueText` fallback contract.
- Completed verification:
  - RED: `mix test test/product_compare_web/graphql/catalog_queries_test.exs:148` - failed as expected because `ProductAttributeValue` did not expose `attributeId`, `sortOrder`, `groupLabel`, `isRequired`, `numericValue`, `booleanValue`, `enumOptionId`, or `unitSymbol`.
  - RED: `mix test test/product_compare/specs/product_attribute_claim_changeset_test.exs:84` - failed as expected because `TaxonAttribute.changeset/2` ignored `compare_group_label`.
  - GREEN: `mix test test/product_compare_web/graphql/catalog_queries_test.exs:148` - 1 test, 0 failures.
  - GREEN: `mix test test/product_compare/specs/product_attribute_claim_changeset_test.exs:84` - 1 test, 0 failures.
  - RED: `bun x vitest run test/routes/products/detail.route.test.tsx -t "grouped by compare group label"` - failed as expected because grouped specification headings were not rendered.
  - RED: `bun x vitest run test/routes/compare/compare.route.test.tsx -t "typed attribute metadata|sort order before display name|typed numeric and boolean"` - failed as expected because loader metadata was stripped, rows used first-product order, and differences used display text only.
  - GREEN: `bun x vitest run test/routes/products/detail.route.test.tsx -t "grouped by compare group label"` - 1 test passed, 27 skipped.
  - GREEN: `bun x vitest run test/routes/compare/compare.route.test.tsx -t "typed attribute metadata|sort order before display name|typed numeric and boolean"` - 3 tests passed, 73 skipped.
  - `mix ecto.migrate` - completed with exit 0; migration `20260630180000` applied.
  - `mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs` - 29 tests, 0 failures.
  - `bun run relay` - completed with exit 0.
  - `bun x vitest run test/routes/products/detail.route.test.tsx test/routes/compare/compare.route.test.tsx` - 104 tests, 0 failures.
  - `bun run typecheck` - completed with exit 0.
  - `mix typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Completed Matrix Modes Dispatch

- Status: done.
- Plan:
  `docs/plans/2026-06-30-compare-matrix-modes-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/loader.ts`
  - `assets/src/routes/compare/paths.ts`
  - `assets/src/routes/compare/index.tsx`
  - `assets/src/routes/compare/product-list.tsx`
  - `assets/src/routes/compare/product-picker.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/compare` supports URL-backed shared, differences-only, and
  all-spec matrix modes while preserving save, add, remove, and selected-tray
  behavior.
- Completed verification:
  - RED: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "compare loader parses|compare loader returns an empty state|compare loader rejects more than three"` - failed as expected with 6 failing tests and 61 skipped because loader states did not expose `specMode`.
  - GREEN: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "compare loader parses|compare loader returns an empty state|compare loader rejects more than three"` - 6 tests passed, 61 skipped.
  - RED: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "specification mode|all specification rows|different specification|empty differences"` - failed as expected with 6 failing tests and 67 skipped because compare mode controls, mode-preserving links, and mode-aware matrices were not implemented.
  - GREEN: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "specification mode|all specification rows|different specification|empty differences"` - 6 tests passed, 67 skipped.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx` - 73 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Verification

- `mix test test/product_compare_web/graphql/catalog_queries_test.exs` - 16 tests, 0 failures.
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `mix format --check-formatted`
- `bun run relay`
- `bun x vitest run src/routes/products/__tests__/detail.route.test.tsx` - 17 tests, 0 failures.
- `bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx` - 11 tests, 0 failures.
- `bun run relay`
- `bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare-relay-migration.test.tsx` - 61 tests, 0 failures.
- `bun run typecheck`
- `git diff --check`
- `bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx` - 48 tests, 0 failures.
- `bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare-relay-migration.test.tsx` - 62 tests, 0 failures.
- `bun run typecheck`
- `git diff --check`
- `mix test test/product_compare_web/graphql/catalog_queries_test.exs` - 16 tests, 0 failures.
- `bun run relay`
- `bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare-relay-migration.test.tsx` - 90 tests, 0 failures.
- `bun run typecheck`
- `git diff --check`
- `bun run check` - 25 files, 209 tests, 0 failures.

## Blockers

- None for this completed lane.
