# Product Discovery And Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn product detail into a decision workspace with multi-spec catalog filtering and one truthful product-wide price chart while simplifying the touched product, catalog, and offer code.

**Architecture:** The product route keeps one persistent decision header and three capability tabs. A versioned product-scoped selection model maps filterable current attributes into the catalog's existing URL/filter input contract and is edited in a Base UI bottom drawer. Pricing exposes a fixed, bounded 90-day product trend grouped by currency; the backend performs Decimal aggregation and the frontend renders Lowest, Average, or By merchant through the existing TanStack/StyleX chart boundary.

**Tech Stack:** Elixir 1.19, Ecto/PostgreSQL, Absinthe Relay, React 19, Relay 20, Base UI, TanStack Charts, StyleX, Vitest, Playwright, ExUnit

## Global Constraints

- Remove the Overview tab; keep `Specifications`, `Offers`, and `Reviews & Q&A`.
- The persistent decision header shows product identity, brand/model, comparable best current price, active offer count, relative freshness with exact timestamp, and category-ordered key specifications.
- Product slugs never render as identity or metadata.
- Enum/boolean spec filters are exact; numeric filters support Same, At least, and At most; selected filters combine with AND semantics.
- The catalog URL remains the shareable filtering authority; do not create another filtering engine.
- Pending spec selection is a versioned, product-scoped session value and is validated once at the storage boundary.
- The product chart is independent of paginated offers, covers a bounded 90-day window, never combines currencies, and uses backend Decimal math.
- TanStack internal class names are not application styling or test APIs.
- Relay-generated operation/input/enum/payload types are authoritative. Do not widen selected GraphQL values to `unknown` and reconstruct them.
- Keep URL parsing, Decimal aggregation, pagination, external URL safety, authorization, and storage validation at their real boundaries.

---

### Task 1: Characterize product decisions, filtering, chart semantics, and query bounds

**Files:**
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Create: `assets/test/routes/products/specifications/spec-filter-selection.test.ts`
- Create: `assets/test/routes/products/specifications/SpecificationFilterDrawer.test.tsx`
- Create: `assets/test/routes/products/offers/ProductPriceTrend.test.tsx`
- Create: `assets/test/ui/components/data/RelativeDateTime.test.tsx`
- Modify: `assets/test/routes/catalog/catalog-sort-input.test.ts`
- Create: `test/product_compare/pricing/product_price_trends_test.exs`
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**
- Produces: red acceptance for header/tab hierarchy, multi-selection and numeric modes, storage recovery, exact catalog URL mapping, currency-separated trend data, merchant crossover, stock removal/re-entry, opening state, sparse data, and bounded query count.

- [ ] **Step 1: Add product hierarchy and drawer RED tests**

  Assert Overview is absent; the header remains while each remaining tab is active; slugs are absent; selecting two specs opens the drawer; numeric mode edits persist; Clear removes all; closing/reopening retains the draft; and Show matching produces one `/products?...` URL containing both filters.

- [ ] **Step 2: Add backend trend RED tests**

  Seed two merchants with Decimal prices, pre-window state, in-stock/out-of-stock transitions, a lowest-price crossover, missing observations, and a second currency. Assert one UTC-daily point series per currency, exact lowest/average Decimal strings, winner identity, no backward fill before first observation, and at most 91 points per currency.

- [ ] **Step 3: Add GraphQL and batching RED tests**

  Query a product's `priceHistory90d` with merchant names and per-point merchant prices. Assert global IDs, stable ordering, no mixed currencies, and constant query count when requesting several aliased products.

- [ ] **Step 4: Run RED**

  ```bash
  mix test test/product_compare/pricing/product_price_trends_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs
  cd assets && pnpm run test:unit -- test/routes/products test/routes/catalog/catalog-sort-input.test.ts
  ```

- [ ] **Step 5: Commit characterization**

  ```bash
  git add assets/test test/product_compare
  git commit -m "test: lock product decision workspace behavior"
  ```

---

### Task 2: Implement the bounded product-wide price projection

**Files:**
- Create: `lib/product_compare/pricing/product_price_trends.ex`
- Modify: `lib/product_compare/pricing.ex`
- Modify: `lib/product_compare_web/schema/pricing/types.ex`
- Modify: `lib/product_compare_web/schema/catalog/types.ex`
- Modify: `lib/product_compare_web/resolvers/pricing/offers.ex`
- Modify: `lib/product_compare_web/graphql/loader/root_sources.ex`
- Modify: `test/product_compare/pricing/product_price_trends_test.exs`
- Modify: `test/product_compare_web/graphql/pricing_queries_test.exs`
- Modify: `test/product_compare_web/graphql/dataloader_batching_test.exs`

**Interfaces:**
- Produces: `Pricing.product_price_trends([pos_integer()], as_of: DateTime.t()) :: %{pos_integer() => [currency_series()]}`.
- Produces: Product GraphQL field `priceHistory90d: [ProductPriceTrendCurrency!]!`.
- Produces: `ProductPriceTrendCurrency { currency, merchants, points }`; merchant has `id`, `name`, and `merchantProductId`; point has `observedAt`, `lowestPrice`, `averagePrice`, `lowestMerchantProductId`, and `merchantPrices`.
- Invariant: each series contains daily UTC points from `as_of - 90 days` through `as_of`; price state is the latest observation at or before that point, in-stock `false` removes the merchant, and no state predates its first observation.

- [ ] **Step 1: Implement one batched history query**

  Fetch qualifying active merchant products, their merchants, the last observation before the window, and in-window observations for all requested products without per-product queries. Order by product, currency, merchant product, and timestamp; reject no internal IDs because all product IDs already crossed the GraphQL boundary.

- [ ] **Step 2: Implement Decimal state reduction**

  Walk observations once per merchant, project daily states, compute `Decimal.min/2` and `Decimal.add/2 |> Decimal.div/2`, and preserve the lowest merchant-product identity. Return empty series for products without data and stable currency/merchant order.

- [ ] **Step 3: Add schema and Dataloader projection**

  Resolve `priceHistory90d` through one request-scoped Dataloader root source. Encode merchant and merchant-product IDs through `GlobalId`; do not expose internal bigint IDs or accept arbitrary client window/resolution arguments.

- [ ] **Step 4: Run GREEN**

  ```bash
  mix format
  mix test test/product_compare/pricing/product_price_trends_test.exs test/product_compare_web/graphql/pricing_queries_test.exs test/product_compare_web/graphql/dataloader_batching_test.exs test/product_compare_web/graphql/schema_snapshot_test.exs
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add lib/product_compare/pricing.ex lib/product_compare/pricing/product_price_trends.ex lib/product_compare_web test/product_compare
  git commit -m "feat: expose product-wide price trends"
  ```

---

### Task 3: Build the multi-spec drawer on the existing catalog filter contract

**Files:**
- Create: `assets/src/routes/products/specifications/spec-filter-selection.ts`
- Create: `assets/src/routes/products/specifications/SpecificationFilterDrawer.tsx`
- Create: `assets/src/routes/products/specifications/ProductSpecifications.tsx`
- Create: `assets/src/routes/products/specifications/index.ts`
- Modify: `assets/src/routes/catalog/filters.ts`
- Modify: `assets/src/routes/catalog/paths.ts`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Delete: `assets/src/routes/products/ProductAttributeList.tsx`
- Delete: `assets/src/routes/products/product-attribute-list-data.ts`
- Move/modify tests under: `assets/test/routes/products/specifications/**`

**Interfaces:**
- Produces: `SpecFilterSelection = { attributeId, code, displayName, kind, mode, value, unitSymbol? }` where `kind` is `enum | boolean | numeric` and numeric `mode` is `same | at_least | at_most`.
- Produces: `readSpecFilterDraft(storage, productId)`, `writeSpecFilterDraft(storage, productId, selections)`, and `catalogPathForSpecSelections(selections)`; only the first two validate untyped browser storage.
- Consumes: generated catalog `ProductNumericFilterInput`, `ProductBooleanFilterInput`, `ProductEnumFilterInput`, and `ProductFiltersInput` types from `BrowseRouteQuery.graphql`.

- [ ] **Step 1: Replace manual catalog GraphQL input types**

  Import generated Relay input and enum types. Keep `CatalogFilters` as URL/domain state, but make `catalogFiltersToProductFiltersInput` return generated `ProductFiltersInput`; explicitly exclude `%future added value` when mapping a UI select to `ProductSort`.

- [ ] **Step 2: Implement storage and URL mapping**

  Store `{ version: 1, productId, selections }` in `sessionStorage`. Validate version, product match, kind, IDs, modes, and scalar values once. Map Same to min+max, At least to min, At most to max, and enum/boolean to the existing catalog query parameters.

- [ ] **Step 3: Implement grouped specifications and drawer**

  Render all attributes readably; expose selection only for enum, boolean, and numeric values with required IDs. Selecting the first opens a Base UI drawer/dialog. Desktop uses a centered height-limited bottom sheet; narrow screens use full width. Provide collapsed count/Clear/Show matching and expanded edit/remove controls with focus restoration.

- [ ] **Step 4: Run GREEN**

  ```bash
  cd assets && pnpm run relay:check && pnpm run typecheck && pnpm run test:unit -- test/routes/products/specifications test/routes/catalog
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add assets/src/routes/products assets/src/routes/catalog assets/test/routes/products assets/test/routes/catalog assets/src/__generated__
  git commit -m "feat: filter catalog from product specifications"
  ```

---

### Task 4: Render the persistent decision header and product-wide chart

**Files:**
- Create: `assets/src/routes/products/ProductDecisionHeader.tsx`
- Create: `assets/src/routes/products/offers/ProductPriceTrend.tsx`
- Create: `assets/src/routes/products/offers/product-price-trend.ts`
- Create: `assets/src/routes/products/offers/index.ts`
- Create: `assets/src/ui/components/data/RelativeDateTime.tsx`
- Create: `assets/src/ui/components/data/date-time.ts`
- Create: `assets/src/ui/components/data/index.ts`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`
- Modify: `assets/src/ui/components/data/PriceHistoryChart.tsx`
- Modify: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `assets/test/routes/products/offers/ProductPriceTrend.test.tsx`
- Regenerate: `assets/src/__generated__/ProductDetailRouteQuery.graphql.ts`

**Interfaces:**
- Produces: chart mode `lowest | average | merchants` and selected currency state local to `ProductPriceTrend`.
- Produces: `RelativeDateTime({ value, referenceTime, prefix? })` with deterministic relative text, semantic `<time>`, and an exact timestamp reachable by hover, focus, and touch.
- Consumes: generated `ProductDetailRouteQuery$data["product"]["priceHistory90d"]`; no manual GraphQL connection, node, or scalar shape.
- Keeps: `PriceHistoryChart` as the StyleX/chart-theme boundary and accessible data-table owner.

- [ ] **Step 1: Extend the product operation and regenerate Relay**

  Select decision-header offer truth plus `priceHistory90d` merchant/point fields. Run `pnpm run relay`; never hand-edit the artifact.

- [ ] **Step 2: Implement deterministic relative-date presentation**

  Use `Intl.RelativeTimeFormat` with bounded seconds/minutes/hours/days selection and `Intl.DateTimeFormat` for exact text. Pass an explicit initial render reference so hydration does not immediately change copy; invalid values use the existing unavailable state.

- [ ] **Step 3: Replace Overview with the decision header**

  Move useful overview facts above tabs, select category-ordered key specs, omit slugs, and keep honest mixed-currency/missing-price fallbacks. Tabs become Specifications, Offers, and Reviews & Q&A.

- [ ] **Step 4: Implement all chart modes**

  Lowest uses the backend lowest series and colors dots by winner; Average uses the average series; By merchant renders one stable-color line per merchant. Add a currency selector when more than one series exists. Tooltips show merchant(s), value, currency, and exact point timestamp. Keep the accessible table.

- [ ] **Step 5: Keep chart failure local**

  Place the trend boundary above paginated offers. A chart failure must leave header, specs, offers, and community usable. Do not derive it from `merchantProducts(first:)` or hide offer pagination.

- [ ] **Step 6: Run GREEN**

  ```bash
  cd assets && pnpm run relay:check && pnpm run typecheck && pnpm run test:unit -- test/routes/products test/ui/components/data/PriceHistoryChart.test.tsx
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add assets/src/routes/products assets/src/ui/components/data assets/src/__generated__ assets/test/routes/products
  git commit -m "feat: create product decision workspace"
  ```

---

### Task 5: Reorganize product, catalog, and offer capabilities and remove redundant guards

**Files:**
- Move/split product community files under: `assets/src/routes/products/community/**`
- Move offer presentation under: `assets/src/routes/products/offers/**`
- Split catalog ownership under: `assets/src/routes/catalog/filters/**` and `assets/src/routes/catalog/results/**`
- Split offer discovery under: `assets/src/routes/offers/discovery/**` and `assets/src/routes/offers/commerce-click/**`
- Merge/delete trivial `*-data.ts` and corresponding tests in those cohorts
- Modify: `assets/src/routes/products/product-offer-panel-data.ts`
- Modify: `assets/src/routes/offers/offer-discovery-card-data.ts`
- Modify: `assets/src/routes/offers/tracked-commerce-click-data.ts`

**Interfaces:**
- Product community separates review, question/answer, submission, and moderation lifecycles.
- Catalog retains one substantial URL/Decimal filter parser; route/list/form/status-only projections merge into their owners.
- Offer discovery retains one substantial filter/URL policy; card-only and click-only fallback projections merge into their consumers.

- [ ] **Step 1: Move tests to capability names before production moves**

  Preserve every existing assertion. Rename tests after behavior, not old file names, and establish imports from intended public capability files.

- [ ] **Step 2: Split overloaded community lifecycles**

  Move review, question/answer, form submission, and row moderation into files that own their Relay fragment/mutation and UI. Merge one-use copy/result helpers into those owners; retain only substantial list merge/pagination logic separately.

- [ ] **Step 3: Remove generated-data reconstruction**

  Replace `unknown` selected offer/coupon/price/page-info fields with indexed generated data types. Delete record/array/string guards that only revalidate successful Relay data. Keep Decimal parsing for custom scalars and transport-error normalization at their boundaries. Price-watch mutation typing belongs to the auth-continuity cohort.

- [ ] **Step 4: Finish catalog and offer organization**

  Move by capability, add a leaf `index.ts` only where at least two consumers import at least two public siblings, and verify no cycles or eager route-chunk pull-in.

- [ ] **Step 5: Run focused and structural checks**

  ```bash
  cd assets && pnpm run relay:check && pnpm run typecheck && pnpm run lint && pnpm run test:unit -- test/routes/products test/routes/catalog test/routes/offers
  rg -n 'readonly .*: unknown|ts-chart-' src/routes/products src/routes/catalog src/routes/offers --glob '!**/price-watch-data.ts' --glob '!**/PriceWatchControl.tsx'
  ```

  Expected: no GraphQL-selected scalar widened to `unknown` and no authored TanStack class coupling in product/catalog/offer files other than the separately owned price-watch boundary.

- [ ] **Step 6: Commit**

  ```bash
  git add assets/src/routes/products assets/src/routes/catalog assets/src/routes/offers assets/test/routes
  git commit -m "refactor: organize product discovery capabilities"
  ```

---

### Task 6: Verify and close product discovery and evaluation

**Files:**
- Modify: `assets/tests/e2e/production-ui-discovery.spec.ts`
- Update after inspection: `assets/tests/e2e/production-ui-discovery.spec.ts-snapshots/**`
- Modify: `docs/work/product-discovery-evaluation.md`

**Interfaces:**
- Produces: desktop/tablet/mobile evidence for decision header, three tabs, two-spec drawer filtering, all chart modes/currencies, offer pagination independence, keyboard/touch/focus behavior, axe, reduced motion, and no overflow.

- [ ] **Step 1: Run deterministic browser acceptance**

  Exercise selecting enum plus numeric specs, editing Same to At least, browser back/forward restoration, chart merchant crossover, currency switching, offer pagination, and community lazy loading at all three widths.

- [ ] **Step 2: Run complete gates**

  ```bash
  cd assets && pnpm run check
  mix format --check-formatted
  mix typecheck
  mix quality
  mix test
  mix work_queue.validate
  git diff --check
  ```

- [ ] **Step 3: Commit closure**

  Record exact test counts, query-count evidence, screenshots inspected, remaining intentional validators, and file-count reduction in the lane doc.

  ```bash
  git add assets lib test docs/work/product-discovery-evaluation.md
  git commit -m "feat: complete product discovery and evaluation"
  ```
