# Route Policy Data Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep six established frontend route surfaces maintainable by
extracting their deterministic form, summary, path, normalization, and view-
state policy into small, framework-free contracts without changing user
behavior.

**Architecture:** Each task creates one pure TypeScript module beside its React
owner. React components retain Relay reads and mutations, router integration,
local state, effects, boundaries, and semantic presentation.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript 5.8, Vitest, Bun,
StyleX.

## Global Constraints

- Follow test-driven development and verify RED before creating each module.
- Keep data modules free of React, Relay, router, StyleX, and Radix imports.
- Preserve exact field normalization, URL parameters, item ordering, fallback
  copy, mutation nullability, and unavailable/error behavior.
- Keep tests behavioral; do not add source-string assertions.
- Update the owned lane doc and commit code, tests, and evidence together.

---

### Task 1: Affiliate Setup Route Data Contract

**Files:**

- Create: `assets/src/routes/affiliate/setup/affiliate-setup-data.ts`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Create: `assets/test/routes/affiliate/setup/affiliate-setup-data.test.ts`
- Test: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `docs/work/frontend-affiliate-setup-demo-parity.md`

**Interfaces:** The pure module produces merchant choices and summaries plus
network, program, link, and coupon mutation variables from scalar form values.
The route retains Relay operations, request guards, form reset behavior,
selection state, feedback, boundaries, and presentation.

- [x] Write pure tests for invalid merchant nodes, selected summaries, required
  and optional trimming, currency casing, date normalization, invalid dates,
  and every mutation-variable shape; run them and verify the missing-module
  failure.
- [x] Extract the deterministic policy and adapt `FormData` to scalar values at
  the route boundary.
- [x] Run the pure and existing route suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 2: Offer Discovery Filter Data Contract

**Files:**

- Create: `assets/src/routes/offers/offer-discovery-filter-data.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryFilterForm.tsx`
- Modify: `assets/src/routes/offers/loader.ts`
- Modify: `assets/src/routes/offers/paths.ts`
- Create: `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `docs/work/frontend-offer-discovery-demo-parity.md`

**Interfaces:** The pure module returns the form reset key, ordered active-filter
summary items, selected-product detail path, reset visibility, merchant-clear
path, and sort label. The component retains form and semantic list markup,
links, controls, and StyleX.

- [x] Write pure tests for default and selected product summaries, optional
  brand and merchant rows, status/page/sort labels, reset visibility, encoded
  product paths, merchant clearing, and future sort fallbacks; verify RED.
- [x] Extract the cohesive deterministic filter policy without changing form
  defaults or URL construction. Keep page-size defaults, ordered sort options,
  sort types, and unknown-sort normalization in one framework-free owner shared
  by the loader, path builder, and form.
- [x] Run the pure and existing route suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 3: Catalog Browse Route Data Contract

**Files:**

- Create: `assets/src/routes/catalog/browse-route-data.ts`
- Modify: `assets/src/routes/catalog/BrowseRoute.tsx`
- Create: `assets/test/routes/catalog/browse-route-data.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `docs/work/frontend-catalog-browse.md`

**Interfaces:** The pure module derives the canonical browse pathname, product
detail path, add/selected/full compare actions, and selected-item removal paths
from the current filters and compare selection. `BrowseRoute` retains Relay
reads, route location, Suspense and error boundaries, layout, and presentation.

- [x] Write pure tests for root-path normalization, encoded detail paths,
  preserved compare selection, add/selected/full actions, maximum selection,
  and removal ordering; verify RED.
- [x] Extract only deterministic route/path policy and keep Relay-derived
  availability decisions in the route owner.
- [x] Run the pure and existing browse suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 4: Product Detail Route Data Contract

**Files:**

- Create: `assets/src/routes/products/product-detail-route-data.ts`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Create: `assets/test/routes/products/product-detail-route-data.test.ts`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/frontend-product-detail.md`

**Interfaces:** The pure module derives the selected detail tab, overview
summary items, encoded product-detail and compare-selection paths, and the
add/selected/full compare action. `ProductDetailRoute` retains Relay reads,
router location and navigation, Suspense and error boundaries, detail-tab
presentation, layout, and child panels.

- [ ] Write pure tests for explicit and fallback tabs, offer-cursor fallback,
  overview counts, encoded product paths, preserved unrelated search and hash
  state, compare selection order, add/selected/full states, maximum selection,
  and selected-item removal; verify RED.
- [ ] Extract only deterministic route policy and keep Relay-derived product
  availability and router side effects in the route owner.
- [ ] Run the pure and existing detail suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 5: Compare Picker Data Contract

**Files:**

- Create: `assets/src/routes/compare/compare-picker-data.ts`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Create: `assets/test/routes/compare/compare-picker-data.test.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-compare-saved-hardening.md`

**Interfaces:** The pure module derives picker reset identity, stable unique
page accumulation, available options, next cursor, empty-state copy, and
compare paths. `CompareProductPickerBoundary` retains Relay reads, effects,
state transitions, Suspense and error boundaries, while
`CompareProductPickerView` retains presentation and loaded-option filtering.

- [ ] Write pure tests for reset identity, duplicate page rows, selected-item
  exclusion, unknown-brand fallback, next-cursor rules, empty copy, maximum
  selection, encoded paths, and specification mode; verify RED.
- [ ] Extract only deterministic picker policy and preserve existing state and
  Relay request timing.
- [ ] Run the pure and existing compare suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 6: Product Offer Panel Data Contract

**Files:**

- Create: `assets/src/routes/products/product-offer-panel-data.ts`
- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`
- Modify: `assets/src/routes/products/ProductOfferList.tsx`
- Create: `assets/test/routes/products/product-offer-panel-data.test.ts`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/frontend-product-offers.md`

**Interfaces:** The pure module derives visible offer rows, coupon and price-
history rows, snapshot display values, and first/next pagination paths from a
transport-neutral offer connection. `ProductOfferPanel` retains error, empty,
snapshot, list, and pagination markup; `ProductOfferList` retains offer-row
presentation and tracked commerce actions.

- [ ] Write pure tests for unsafe URL exclusion, merchant fallback, numeric and
  currency validation, coupon discount/date semantics, price-history filtering,
  mixed-currency snapshots, compare-slug ordering, and first/next pagination;
  verify RED.
- [ ] Extract only deterministic offer-panel data and path policy while keeping
  React identifiers, markup, accessibility, and tracked commerce presentation
  in the component owners.
- [ ] Run the pure and existing detail suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

## Validation Evidence

- The existing affiliate setup, offer discovery, catalog browse, product
  detail, and compare route suites passed 304 tests on 2026-07-14.
- Current source inspection found the named deterministic policies in five
  separate React owners with no code, test, or lane-doc ownership overlap.
- The compare picker candidate is distinct from its completed presentation
  extraction: the view owns markup and loaded-option filtering, while the new
  contract owns route reset, page accumulation, option, cursor, empty-state,
  and path policy.
- The product-offer panel candidate is distinct from its completed offer-list
  presentation extraction: the list owns markup and tracked commerce actions,
  while the new contract owns connection normalization, snapshot values, and
  pagination policy. Its existing route characterization passed 55 tests on
  2026-07-14.
