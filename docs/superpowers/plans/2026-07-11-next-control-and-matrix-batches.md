# Next Control, Matrix, And Offer Card Batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Isolate four remaining cohesive frontend presentation boundaries
without changing route-owned mutations, Relay reads, URL state, filter
serialization, comparison semantics, or accessible behavior.

**Architecture:** Route owners keep data and mutation orchestration. New sibling
components receive typed values and callbacks, use direct imports, and own only
the controls, tables, disclosures, and field markup already characterized by
the focused route suites.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, StyleX, Radix UI,
Vitest.

## Global Constraints

- Browser data remains GraphQL/Relay-based.
- Preserve accessible names, link destinations, form field names, mutation
  variables, filter serialization, comparison row ordering, and empty states.
- Do not move route-owned Relay hooks, mutation commits, loader state, or URL
  construction into presentation components.
- Use direct imports; do not add barrel files or memoization for simple values.

---

### Task 1: API Token Control Presentation Extraction

**Files:**

- Create: `assets/src/routes/account/api-tokens/ApiTokenControls.tsx`
- Modify: `assets/src/routes/account/api-tokens/ApiTokensRoute.tsx`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `docs/work/frontend-api-token-management-demo-parity.md`

**Interface:** `ApiTokenControls` owns the status-filter navigation, create
dialog, create form, expiration presets, and create-error presentation.
`OneTimeApiToken` owns the one-time secret disclosure. `ApiTokensRoute` keeps
dialog/pending/error/secret state, refs, form submission, mutation commits,
token merging, Relay boundaries, rotation/revocation, and pagination paths.

- [x] Add direct render assertions for status links, create controls, expiration
  presets, pending copy, error presentation, and one-time disclosure; verify RED
  against the missing component.
- [x] Create typed `ApiTokenControls` and `OneTimeApiToken` exports by moving the
  existing presentation and StyleX rules without changing field names or copy.
- [x] Pass route-owned state, refs, and callbacks into the new boundary; keep all
  mutation and token lifecycle logic in `ApiTokensRoute`.
- [x] Run `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx`.
- [x] Run `cd assets && bun run typecheck` and `git diff --check`.
- [x] Record lane evidence and commit `refactor(frontend): extract api token controls`.

---

### Task 2: Compare Specification Matrix Extraction

**Files:**

- Create: `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
- Modify: `assets/src/routes/compare/CompareProductList.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

**Interface:** `CompareSpecificationMatrix` receives `products` and `specMode`
and owns matrix titles, empty states, horizontal scrolling, table markup, row
construction, stable ordering, first-code handling, and exact typed numeric,
boolean, text, missing-value, and unit comparison semantics.
`CompareProductList` retains decision summary and individual-card presentation.

- [x] Add a direct matrix render assertion covering ordered rows, missing cells,
  and the selected mode label; verify RED against the missing component.
- [x] Move the matrix component, styles, row builders, and exact normalization
  helpers into `CompareSpecificationMatrix.tsx` without semantic changes.
- [x] Import the matrix through a direct sibling import and leave product-card
  and decision-summary ownership in `CompareProductList`.
- [x] Run `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`.
- [x] Run `cd assets && bun run typecheck` and `git diff --check`.
- [x] Record lane evidence and commit `refactor(frontend): extract compare specification matrix`.

---

### Task 3: Catalog Advanced Filter Presentation Extraction

**Files:**

- Create: `assets/src/routes/catalog/CatalogAdvancedFilters.tsx`
- Modify: `assets/src/routes/catalog/CatalogFilterForm.tsx`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `docs/work/frontend-catalog-browse.md`

**Interface:** `CatalogAdvancedFilters` receives current `filters` and Relay
`metadata` and owns use-case, numeric, boolean, and enum fieldsets plus selected
value resolution. `CatalogFilterForm` retains search, sort, page size, compare
slug fields, product-type/descendant state, collapsible state, form submission,
and active-filter summaries.

- [x] Add direct render assertions for use-case, numeric, boolean, and enum
  field names and selected values; verify RED against the missing component.
- [x] Move the four advanced fieldset families and selected-value helpers into
  the typed sibling component without changing serialization names.
- [x] Render the new component inside the existing Radix collapsible while
  keeping form and primary-control state in `CatalogFilterForm`.
- [x] Run `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`.
- [x] Run `cd assets && bun run typecheck` and `git diff --check`.
- [x] Record lane evidence and commit `refactor(frontend): extract catalog advanced filters`.

---

### Task 4: Offer Discovery Card Presentation Extraction

**Files:**

- Create: `assets/src/routes/offers/OfferDiscoveryCard.tsx`
- Modify: `assets/src/routes/offers/OfferDiscoveryList.tsx`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `docs/work/frontend-offer-discovery-demo-parity.md`

**Interface:** `OfferDiscoveryCard` receives one `OfferNode` plus its nullable
price-sort highlight label. It owns the offer article, status and product
heading, tracked or safe direct merchant action, observation context, current
price, price-history summary, and coupon summary. `OfferDiscoveryList` retains
page-local renderable-offer normalization and ordering, mixed-currency price
comparison decisions, visible-page snapshot, list markup, merchant quick
filters, empty state, and pagination.

- [x] Add a direct card render assertion covering active tracked action,
  observation labels, current price, price history, and coupon validity; verify
  RED against the missing component.
- [x] Create the typed `OfferDiscoveryCard` export by moving the existing
  per-offer markup, formatting helpers, connection fallbacks, and StyleX rules
  without changing accessible labels, copy, link safety, or click tracking.
- [x] Render the new component from the existing `DataListItem` mapping while
  keeping ordering, highlights, snapshot, filters, and pagination in
  `OfferDiscoveryList`.
- [x] Run `cd assets && bun x vitest run test/routes/offers/offer-discovery.route.test.tsx`.
- [x] Run `cd assets && bun run typecheck` and `git diff --check`.
- [x] Record lane evidence and commit `refactor(frontend): extract offer discovery card`.
