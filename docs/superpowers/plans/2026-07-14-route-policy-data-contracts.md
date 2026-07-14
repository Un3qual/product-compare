# Route Policy Data Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep three established frontend routes maintainable by extracting
their deterministic form, summary, path, and view-state policy into small,
framework-free contracts without changing user behavior.

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

- [ ] Write pure tests for invalid merchant nodes, selected summaries, required
  and optional trimming, currency casing, date normalization, invalid dates,
  and every mutation-variable shape; run them and verify the missing-module
  failure.
- [ ] Extract the deterministic policy and adapt `FormData` to scalar values at
  the route boundary.
- [ ] Run the pure and existing route suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 2: Offer Discovery Filter Data Contract

**Files:**

- Create: `assets/src/routes/offers/offer-discovery-filter-data.ts`
- Modify: `assets/src/routes/offers/OfferDiscoveryFilterForm.tsx`
- Create: `assets/test/routes/offers/offer-discovery-filter-data.test.ts`
- Test: `assets/test/routes/offers/offer-discovery.route.test.tsx`
- Modify: `docs/work/frontend-offer-discovery-demo-parity.md`

**Interfaces:** The pure module returns the form reset key, ordered active-filter
summary items, selected-product detail path, reset visibility, merchant-clear
path, and sort label. The component retains form and semantic list markup,
links, controls, and StyleX.

- [ ] Write pure tests for default and selected product summaries, optional
  brand and merchant rows, status/page/sort labels, reset visibility, encoded
  product paths, merchant clearing, and future sort fallbacks; verify RED.
- [ ] Extract the cohesive deterministic filter policy without changing form
  defaults or URL construction.
- [ ] Run the pure and existing route suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

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

- [ ] Write pure tests for root-path normalization, encoded detail paths,
  preserved compare selection, add/selected/full actions, maximum selection,
  and removal ordering; verify RED.
- [ ] Extract only deterministic route/path policy and keep Relay-derived
  availability decisions in the route owner.
- [ ] Run the pure and existing browse suites, TypeScript, the framework-import
  scan, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

## Validation Evidence

- The existing affiliate setup, offer discovery, and catalog browse route
  suites passed 135 tests on 2026-07-14.
- Current source inspection found the named deterministic policies in three
  separate React owners with no code, test, or lane-doc ownership overlap.
