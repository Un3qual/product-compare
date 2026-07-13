# Next Presentation Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Isolate four cohesive presentation boundaries that remain mixed with
Relay, route, URL, and lifecycle orchestration after the completed route-level
decompositions.

**Architecture:** Data owners keep Relay hooks, page accumulation, mutation
orchestration, URL construction, normalization, filtering, snapshots, and
pagination. New sibling components receive small typed view contracts and own
only existing accessible markup and local presentation state.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, StyleX, Radix UI,
Vitest.

## Global Constraints

- Preserve GraphQL, mutation, URL, cursor, date, price, status, and empty-state
  behavior exactly.
- Do not move Relay hooks, mutation commits, URL construction, normalization,
  or page accumulation into presentation components.
- Prefer one explicit view contract per seam; do not add barrels, wrapper-only
  components, generic render-prop APIs, or speculative reuse.
- Keep behavior tests semantic and accessible rather than coupled to source
  strings or DOM text concatenation.

---

### Task 1: API Token Item Presentation Extraction

**Files:**

- Create: `assets/src/routes/account/api-tokens/ApiTokenItem.tsx`
- Modify: `assets/src/routes/account/api-tokens/ApiTokenList.tsx`
- Test: `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- Modify: `docs/work/frontend-api-token-management-demo-parity.md`

**Interface:** `ApiTokenItem` receives one `ApiTokenSummary`, its pending and
error values, and rotate/revoke callbacks. It owns token details, status,
rotation form and presets, lifecycle errors, and revoke action. `ApiTokenList`
keeps Relay page reads, local/remote list composition, update merging, status
filtering, query keys, and list markup.

- [x] Add direct item assertions for details, status, rotation presets,
  lifecycle errors, pending copy, and revoke behavior; verify RED against the
  missing component.
- [x] Move only per-token presentation and date/status formatting into the
  typed sibling component.
- [x] Keep update merging, status filtering, Relay reads, and list composition
  in `ApiTokenList`.
- [x] Run the focused API-token suite, TypeScript, and `git diff --check`.
- [x] Record lane evidence and commit the milestone.

---

### Task 2: Product Detail Offer List Presentation Extraction

**Files:**

- Create: `assets/src/routes/products/ProductOfferList.tsx`
- Modify: `assets/src/routes/products/ProductOfferPanel.tsx`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/frontend-product-detail.md`

**Interface:** `ProductOfferList` receives normalized visible-offer view models
and owns the active-offer list, merchant action, current price and observation,
price-history rows, and coupon rows. `ProductOfferPanel` keeps GraphQL
normalization, safe URL and numeric handling, visible-page snapshot,
mixed-currency decisions, pagination, and route URL construction.

- [ ] Add direct list assertions for merchant actions, prices, observation
  times, history, coupons, and bounded-more messages; verify RED.
- [ ] Extract the list and per-offer presentation behind one exported view-model
  contract without duplicating GraphQL response types.
- [ ] Keep normalization, snapshot calculation, and pagination in the panel.
- [ ] Run the focused product-detail suite, TypeScript, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 3: Root Destination Presentation Extraction

**Files:**

- Create: `assets/src/routes/RootDestinations.tsx`
- Modify: `assets/src/routes/RootRoute.tsx`
- Test: `assets/test/routes/root.route.test.tsx`
- Modify: `docs/work/frontend-shopper-home-navigation.md`

**Interface:** `RootDestinations` exports the primary navigation and home
destination presentation for a nullable viewer. It owns destination catalogs,
active-link styling, shopper path cards, secondary actions, and auth actions.
`RootRoute` keeps loader/query reads, viewer normalization, providers, shell,
metadata, outlet context, and page copy.

- [ ] Add direct destination assertions for guest/authenticated visibility,
  active links, shopper paths, and auth actions; verify RED.
- [ ] Move destination constants and presentation into the typed sibling
  without changing labels, paths, or responsive styles.
- [ ] Keep route data, providers, metadata, shell, and outlet ownership in
  `RootRoute`.
- [ ] Run the focused root suite, TypeScript, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 4: Compare Product Picker View Extraction

**Files:**

- Create: `assets/src/routes/compare/CompareProductPickerView.tsx`
- Modify: `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

**Interface:** `CompareProductPickerView` receives route-resolved option view
models plus the next cursor callback and owns loaded-product filter state,
picker headings, option markup, no-match copy, and the show-more control.
`CompareProductPickerBoundary` keeps Relay/error/suspense ownership, page
accumulation, selected-product exclusion, empty-data decisions, and compare URL
construction.

- [ ] Add direct view assertions for filtering, clearing, no-match behavior,
  option links, and show-more behavior; verify RED.
- [ ] Build route-resolved option view models in the boundary and move only
  presentation plus local filter state into the sibling.
- [ ] Keep Relay reads, page accumulation, selected-product exclusion, empty
  dataset handling, and path construction in the boundary.
- [ ] Run the focused compare suite, TypeScript, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

## Validation Evidence

- Current seams were inspected in the source rather than promoted from a stale
  catalog.
- The four existing characterization suites passed 200 tests together on
  2026-07-12 before promotion.
- Owned source, test, and lane paths do not overlap across the four rows.
