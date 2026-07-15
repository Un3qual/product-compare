# Route Policy Data Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep six established frontend route surfaces maintainable by
extracting their deterministic form, summary, path, normalization, and view-
state policy into small, framework-free contracts without changing user
behavior, and directly characterize the shared external-destination safety
boundary used by offer and merchant surfaces.

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
- Modify: `assets/src/routes/compare/paths.ts`
- Modify: `assets/src/routes/compare/loader.ts`
- Create: `assets/test/routes/catalog/browse-route-data.test.ts`
- Test: `assets/test/routes/catalog/browse.route.test.tsx`
- Modify: `docs/work/frontend-catalog-browse.md`
- Review fix docs: `docs/work/index.md`, `docs/plans/INDEX.md`, and
  `docs/work/frontend-product-offers.md`

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
- [x] Review fix: centralize compare slug normalization, addition, and path
  serialization in the framework-free `compare/paths.ts` owner; preserve
  loader exports for existing route consumers and add direct whitespace, blank,
  duplicate, ordering, and maximum-selection coverage.
- [x] Review fix verification: RED failed because `normalizedCompareSlugs` was
  not exported; GREEN passed 69 catalog tests and 109 compare-route tests,
  TypeScript, the `browse-route-data.ts` -> `compare/paths.ts` framework scan,
  and `git diff --check`. `mix work_queue.validate` was sandbox-blocked by
  Mix PubSub TCP permission (`:eperm`).
- [x] Final branch-review fix: remove false maximum configurability from
  `createBrowseRouteData` and use `compare/paths.ts`'s canonical
  `MAX_COMPARE_PRODUCTS` for normalization, actions, and serialization.
- [x] Final branch-review verification: the pure and browse route suites passed
  69 tests, TypeScript and the transitive framework scan passed, and the
  reactivated product-offers lane now points only to current source and tests.

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

- [x] Write pure tests for explicit and fallback tabs, offer-cursor fallback,
  overview counts, encoded product paths, preserved unrelated search and hash
  state, compare selection order, add/selected/full states, maximum selection,
  and selected-item removal; verify RED.
- [x] Extract only deterministic route policy and keep Relay-derived product
  availability and router side effects in the route owner.
- [x] Run the pure and existing detail suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Review fix: remove the falsely configurable detail compare maximum and
  use `compare/paths.ts`'s canonical `MAX_COMPARE_PRODUCTS` for selection,
  actions, compare links, browse links, and removal links.
- [x] Review fix verification: the pure and existing detail suites passed 67
  tests, TypeScript and the transitive framework scan passed, and independent
  re-review found no remaining actionable issues.

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

- [x] Write pure tests for reset identity, duplicate page rows, selected-item
  exclusion, unknown-brand fallback, next-cursor rules, empty copy, maximum
  selection, encoded paths, and specification mode; verify RED.
- [x] Extract only deterministic picker policy and preserve existing state and
  Relay request timing.
- [x] Run the pure and existing compare suites, TypeScript, the framework-
  import scan, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.
- [x] Task review verification: the pure and existing compare suites passed 116
  tests, TypeScript and the transitive framework scan passed, and independent
  review found no actionable correctness, lifecycle, purity, or test issues.

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

---

### Task 7: External Destination Safety Contract

**Files:**

- Modify: `assets/src/routes/external-links.ts`
- Create: `assets/test/routes/external-links.test.ts`
- Create: `docs/work/frontend-external-destination-safety.md`

**Interfaces:** The existing framework-free module remains the single owner of
external HTTP URL and bare website-domain normalization. The batch adds direct
behavioral coverage and changes production code only where that contract
reveals duplicated or unsafe behavior; offer, product, and merchant consumers
remain unchanged.

- [ ] Write direct tests for trimming and exact href preservation, safe public
  HTTP(S), bare-domain HTTPS promotion, credentials, malformed authorities,
  unsupported schemes, hostname and port validation, localhost, reserved IPv4
  ranges, and reserved or IPv4-embedded IPv6 destinations; verify the current
  behavior before changing production code.
- [ ] Simplify or correct the policy only where direct evidence requires it,
  without weakening consumer safety or introducing runtime dependencies.
- [ ] Run the direct contract and existing offer-discovery and merchant
  consumer suites, TypeScript, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 8: Trust-Surface Date Presentation Contract

**Files:**

- Modify: `assets/src/routes/product-formatting.ts`
- Modify: `assets/src/routes/merchants/detail/MerchantDetailRoute.tsx`
- Modify: `assets/src/routes/compare/shared/SharedComparisonRoute.tsx`
- Create: `assets/test/routes/product-formatting.test.ts`
- Test: `assets/test/routes/merchants/merchant-detail.route.test.tsx`
- Test: `assets/test/routes/compare/comparison-snapshots.test.tsx`
- Create: `docs/work/frontend-trust-date-presentation.md`

**Interfaces:** The framework-free product formatter adds separate string-input
UTC date-only and date-time label functions. Merchant detail consumes the
date-only function; public comparison snapshots consume the date-time function.
Both preserve the original source string as the fallback for malformed values,
while the React owners retain semantic `<time dateTime>` markup and layout.

- [ ] Write direct tests for UTC date-only and date-time labels, offset
  normalization across a day boundary, malformed-string fallback, and the
  existing `Date`-input formatter; verify RED for the missing string helpers.
- [ ] Replace the two route-local date formatters without changing semantic
  `dateTime` attributes, captured recommendation copy, or merchant-summary
  fallback behavior.
- [ ] Run the direct formatter and existing merchant-detail and comparison-
  snapshot suites, TypeScript, the framework-import scan, and `git diff
  --check`.
- [ ] Record lane evidence and commit the milestone.

## Validation Evidence

- The existing affiliate setup, offer discovery, catalog browse, product
  detail, and compare route suites passed 299 tests on 2026-07-14.
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
- The external-destination candidate is a non-overlapping safety hardening
  batch over the existing 410-line framework-free policy. Offer-discovery and
  merchant consumer suites passed 80 tests on 2026-07-14, while source and test
  inspection found no direct contract suite for its HTTP(S), credential,
  hostname, port, localhost, or reserved-address decisions.
- The completed product-detail contract and route characterization passed 67
  focused tests on 2026-07-14. The contract shares the canonical compare limit
  and path utilities, and independent re-review found no actionable issues.
- The trust-surface date candidate is non-overlapping with the three earlier
  ready contracts. Current source inspection found duplicate UTC date parsing
  and formatting in merchant detail and public comparison snapshots around the
  existing framework-free product formatter; their focused suites passed 8
  tests on 2026-07-14.
- The completed compare-picker contract and existing route characterization
  passed 116 focused tests on 2026-07-14; independent task review found no
  actionable issues.
