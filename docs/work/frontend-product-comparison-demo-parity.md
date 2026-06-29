# Frontend Product Comparison Demo Parity

## Snapshot

- Status: ready
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-27 after compare selection removal verification
- Implementation plan: `docs/plans/2026-05-31-frontend-product-comparison-demo-parity-implementation-plan.md`
- Active implementation plan: `docs/plans/2026-06-29-compare-selection-tray-implementation-plan.md`
- Recently completed implementation plan: `docs/plans/2026-06-27-project-compare-selection-controls-implementation-plan.md`
- Objective: make product comparison demoable from the UI by exposing current product attributes and adding visible compare selection paths.

## Batch Status

- [x] Task 1: expose selected current product attributes through GraphQL `Product.currentAttributes`.
- [x] Task 2: render product attributes and a compare entry link on `/products/:slug`.
- [x] Task 3: add compare entry links from `/products`.
- [x] Task 4: add a product picker to `/compare`.
- [x] Task 5: render product attributes on compare cards.
- [x] Task 6: run full demo-slice verification and close queue docs.
- [x] Task 7: add compare selection remove controls.

## Current Usable Product Batch

- Status: ready.
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
- Pending evidence:
  - Worker should record route-test, typecheck, and whitespace verification
    output here when the row is implemented.

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

- Build an aligned comparison matrix for attributes shared across selected products.
- Add a persistent compare tray across browse/detail pages.
- Add demo parity for API token management, affiliate setup, revenue reporting, and merchant discovery after their current queued refinements complete.

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
