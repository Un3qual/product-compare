# Frontend Product Comparison Demo Parity

## Snapshot

- Status: ready (serial matrix and decision-summary data contracts)
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-12 after compare-save and formatting hardening (108 compare tests)
- Implementation plan: `docs/plans/2026-05-31-frontend-product-comparison-demo-parity-implementation-plan.md`
- Active promotion plan: `docs/plans/2026-07-01-persistent-compare-tray-promotion-implementation-plan.md`
- Active implementation plan: `docs/plans/2026-07-01-persistent-compare-tray-implementation-plan.md`
- Recently completed usable-product plan: `docs/plans/2026-06-29-compare-selection-tray-implementation-plan.md`
- Recently completed implementation plan: `docs/plans/2026-06-27-project-compare-selection-controls-implementation-plan.md`
- Planned in-depth comparison follow-up plans:
  - `docs/plans/2026-06-30-compare-matrix-modes-implementation-plan.md`
  - `docs/plans/2026-06-30-compare-attribute-metadata-implementation-plan.md`
  - `docs/plans/2026-06-30-compare-offer-decision-helpers-implementation-plan.md`
- Objective: make product comparison demoable from the UI by exposing current product attributes and adding visible compare selection paths.

## Compare Save And Deterministic Formatting Hardening

- Status: done on 2026-07-12.
- Compare save request refs, pending state, errors, and success feedback now live
  in an inner component keyed to the selected product identity. A selection
  render that suspends before commit cannot mutate or invalidate the still-
  visible selection's request.
- Specification labels and offer merchant names use the product's explicit
  `en-US` ordering rather than the runtime default locale.
- RED: the abandoned-transition regression left the visible save completion
  blank, and Swedish-default probes ordered `Zebra` before `Älg` in both the
  specification matrix and merchant sort.
- GREEN: the compare suite passed 108 tests; the combined compare, ingestion,
  offer, revenue, and SSR run passed 207 tests. `bun run typecheck` and
  `git diff --check` passed.

## Specification Matrix Data Contract

- Status: ready on 2026-07-12.
- Plan: `docs/superpowers/plans/2026-07-12-post-stack-ready-batches.md`.
- Next action: isolate the framework-free row construction and typed comparison
  policy while keeping titles, empty states, scrolling, and table markup in the
  presentation component.
- Owned paths:
  - `assets/src/routes/compare/specification-matrix-data.ts`
  - `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
  - `assets/test/routes/compare/specification-matrix-data.test.ts`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/specification-matrix-data.test.ts test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: the pure data contract preserves stable ordering, duplicate-
  code selection, missing cells, modes, typed values, units, and decimal/
  exponent normalization.

## Decision Summary Data Contract

- Status: ready on 2026-07-12; dispatch serially with the specification-matrix
  data contract because both own this lane doc and the compare route suite.
- Plan: `docs/superpowers/plans/2026-07-12-post-stack-ready-batches.md`.
- Next action: isolate loaded-price safety and decision-metric label derivation
  in a framework-free module while retaining disclosure, table presentation,
  and Review offers URLs in `DecisionSummary`.
- Owned paths:
  - `assets/src/routes/compare/decision-summary-data.ts`
  - `assets/src/routes/compare/DecisionSummary.tsx`
  - `assets/test/routes/compare/decision-summary-data.test.ts`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/decision-summary-data.test.ts test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: pure metric contracts preserve loaded-offer scope, decimal
  and currency safety, unavailable labels, and recency output.

## Compare Product Picker View Extraction

- Status: done on 2026-07-12.
- Plan: `docs/superpowers/plans/2026-07-12-next-presentation-boundaries.md`.
- Next action: Extract picker headings, loaded-product filtering, option
  presentation, no-match copy, and show-more controls while preserving
  boundary-owned Relay reads, page accumulation, selection exclusion, empty
  dataset decisions, and compare path construction.
- Owned paths:
  - `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
  - `assets/src/routes/compare/CompareProductPickerView.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Prerequisite: the existing compare route suite is green and remains the
  characterization contract.
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: picker presentation and local filter state are isolated
  without changing Relay reads, loaded-product accumulation, selected-product
  exclusion, option URLs, empty states, or pagination.
- Completion evidence:
  - RED: the direct picker-view test failed because
    `CompareProductPickerView.tsx` did not exist.
  - `CompareProductPickerBoundary` retains Relay reads, loaded-page
    accumulation and deduplication, selected-product exclusion, genuinely empty
    dataset handling, and resolved comparison paths.
  - `CompareProductPickerView` owns picker headings, loaded-product filtering,
    option markup, no-match copy, and the show-more action from route-resolved
    option view models and a callback.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
    passed 105 tests.
  - `cd assets && bun run typecheck` and `git diff --check` completed with
    exit 0.

## Compare Specification Matrix Extraction

- Status: done on 2026-07-12.
- Plan: `docs/superpowers/plans/2026-07-11-next-control-and-matrix-batches.md`.
- Next action: Extract matrix rendering and row-comparison semantics into
  `CompareSpecificationMatrix` while leaving decision summary and individual
  product cards in `CompareProductList`.
- Owned paths:
  - `assets/src/routes/compare/CompareProductList.tsx`
  - `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Prerequisite: the existing compare route suite is green and remains the
  characterization contract.
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: matrix presentation and exact row comparison are isolated
  without changing mode, ordering, missing-cell, or numeric/unit behavior.
- Completion evidence:
  - RED: the focused suite failed because `CompareSpecificationMatrix.tsx`
    did not exist.
  - `CompareSpecificationMatrix` now owns matrix titles and empty states,
    horizontal scrolling, table markup, stable row construction and ordering,
    duplicate-code handling, and exact typed comparison normalization.
  - `CompareProductList` retains decision-summary and individual-product-card
    presentation.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
    passed 104 tests.
  - `cd assets && bun run typecheck` and `git diff --check` completed with exit 0.

## Completed Bounded Local-Filter Batch

- Status: done on 2026-07-11.
- The decision summary now states that relative loaded price compares only
  already-loaded offers without changing decimal or currency safety behavior.
- The compare picker now filters already-loaded, unselected product names
  case-insensitively while preserving selection URLs and the `Show more
  products` action when no loaded item matches.
- RED: the two focused cases failed because the scope disclosure and loaded
  product search field were absent.
- GREEN:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "loaded product names|scopes relative loaded price"` - 2 passed.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/merchants/merchant-directory.route.test.tsx` - 124 passed.
  - `cd assets && bun run typecheck` - exited 0.

## Relative Loaded Price Follow-Up Evidence

- Status: done.
- Plan:
  `docs/plans/2026-07-10-compare-relative-price-signal-implementation-plan.md`.
- Verified gap: the current decision summary displays each product's best loaded
  price but does not identify a safe lowest value across selected products.
- Owned paths:
  - `assets/src/routes/compare/DecisionSummary.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "relative loaded price|lowest loaded price|not comparable"`
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: the decision summary identifies the safe lowest loaded price
  for comparable same-currency values and declines mixed, missing, malformed, or
  unavailable comparisons.
- RED: the named focused command failed with 5 expected cases because the
  `Relative loaded price` decision row did not exist.
- GREEN:
  - the named focused command passed 5 tests;
  - the full compare route suite passed 93 tests;
  - `cd assets && bun run typecheck` exited 0;
  - `git diff --check` exited 0.
- Exact decimal-string comparison avoids floating-point coercion, normalizes
  leading/trailing zeroes, declines mixed currencies and malformed values, and
  leaves missing or unavailable cells as `Not comparable` when two other safe
  prices can still be compared.

### Exact Decimal Review Follow-Up

- RED: the focused compare run failed two regression cases: the loader retained
  `9007199254740993.00` instead of the lower `9007199254740992.00`, and
  scientific `1E+3` was treated as not comparable to `1000`.
- GREEN: the shared exact-decimal suite passed 13 cases and the two focused
  loader/decision-summary regressions passed.
- `assets/src/routes/decimal-values.ts` now owns exact decimal ordering for both
  loader-level best-offer selection and relative decision-summary labels,
  including scientific notation and values beyond JavaScript Number precision.

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
- [x] Task 11: add bounded, resilient compare offer decision helpers.
- [x] Task 12: add a persistent URL-backed compare tray across compare,
  browse, and product detail routes.

## Completed Persistent Compare Tray Dispatch

- Status: done.
- Plan:
  `docs/plans/2026-07-01-persistent-compare-tray-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/paths.ts`
  - `assets/src/routes/compare/CompareSelectionTray.tsx`
  - `assets/src/routes/compare/CompareRoute.tsx`
  - `assets/src/routes/catalog/paths.ts`
  - `assets/src/routes/catalog/CatalogFilterForm.tsx`
  - `assets/src/routes/catalog/BrowseRoute.tsx`
  - `assets/src/routes/products/ProductDetailRoute.tsx`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `assets/test/routes/catalog/browse.route.test.tsx`
  - `assets/test/routes/products/detail.route.test.tsx`
  - `docs/work/frontend-product-comparison-demo-parity.md`
  - `docs/work/frontend-catalog-browse.md`
  - `docs/work/frontend-product-detail.md`
- Implemented:
  - Added shared compare URL helpers that parse, dedupe, append, cap, and
    rewrite repeated `slug` params while preserving route-local search params.
  - Extracted the selected-products tray into
    `assets/src/routes/compare/CompareSelectionTray.tsx` with an `Open comparison`
    link, slug fallback labels, and route-supplied remove links.
  - `/products` and `/products/:slug` now render the shared tray from URL
    state, preserve repeated compare slugs through local add/remove links, and
    keep `/compare?slug=...` as the full comparison destination.
- Verification:
  - RED: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "compare path helpers"` - failed as expected with 1 failed test and 86 skipped because `selectedCompareSlugsFromSearch` was not exported yet.
  - GREEN: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "compare path helpers"` - 1 passed, 86 skipped.
  - RED: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "selected-product tray"` - failed as expected with 1 failed test, 1 passed, and 85 skipped because `Open comparison` was missing.
  - GREEN: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "selected-product tray"` - 2 passed, 85 skipped.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx` - 87 tests, 0 failures.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx` - 163 tests, 0 failures.
  - `cd assets && bun run typecheck` - `tsc --noEmit` completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Current Usable Product Batch

- Status: done.
- Plan: `docs/plans/2026-06-29-compare-selection-tray-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/CompareRoute.tsx`
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
  - `assets/src/routes/compare/CompareRoute.tsx`
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

- Add demo parity for API token management, affiliate setup, revenue reporting, and merchant discovery after their current queued refinements complete.

## Active Dispatch

Status: done
Lane: Frontend product comparison demo parity (`docs/work/frontend-product-comparison-demo-parity.md`)
Active plan: `docs/plans/2026-07-01-persistent-compare-tray-implementation-plan.md`
Next action: Add a persistent compare tray across `/products` and `/products/:slug` so shoppers can see the current URL-backed compare selection, add or remove selected products from browse/detail pages, and continue to `/compare` without losing repeated `slug` param order.
Owned paths:

- `assets/src/routes/compare/paths.ts`
- `assets/src/routes/compare/CompareSelectionTray.tsx`
- `assets/src/routes/compare/CompareRoute.tsx`
- `assets/src/routes/catalog/paths.ts`
- `assets/src/routes/catalog/CatalogFilterForm.tsx`
- `assets/src/routes/catalog/BrowseRoute.tsx`
- `assets/src/routes/products/ProductDetailRoute.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`
- `docs/work/frontend-catalog-browse.md`
- `docs/work/frontend-product-detail.md`
Verification:
- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/catalog/browse.route.test.tsx test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`
Exit condition: Browse and detail pages expose a persistent compare tray/action area that preserves repeated `slug` params in URL order, supports bounded add/remove behavior, links to `/compare`, and records completed evidence in the compare, catalog, and detail lane docs.

## Completed Offer Decision Helpers Dispatch

- Status: done.
- Plan:
  `docs/plans/2026-06-30-compare-offer-decision-helpers-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/queries/CompareOfferContextQuery.ts`
  - `assets/src/routes/compare/loader.ts`
  - `assets/src/routes/compare/CompareRoute.tsx`
  - `assets/src/routes/compare/CompareProductList.tsx`
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
- Completed verification:
  - RED: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "offer context|decision summary|keeps specs visible"` - failed as expected with 3 failing tests and 77 skipped because the loader did not expose `offerContexts` and the route did not render `Decision summary`.
  - GREEN: `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "offer context|decision summary|keeps specs visible"` - 3 tests passed, 77 skipped.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx` - 80 tests, 0 failures.
  - `cd assets && bun run relay` - completed with exit 0.
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx test/routes/products/detail.route.test.tsx` - 108 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `mix test test/product_compare_web/graphql/pricing_queries_test.exs` - 8 tests, 0 failures.

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
  - `assets/src/routes/products/ProductAttributeList.tsx`
  - `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
  - `assets/src/routes/compare/loader.ts`
  - `assets/src/routes/compare/CompareProductList.tsx`
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
  - `assets/src/routes/compare/CompareRoute.tsx`
  - `assets/src/routes/compare/CompareProductList.tsx`
  - `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
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
