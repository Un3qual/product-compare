# Post-Stack Ready Batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task.

**Goal:** Preserve three source-backed ready batches after the current eight-PR
stack completes, without reviving deferred work or manufacturing wrapper-only
components.

**Architecture:** Route owners retain Relay, loader, navigation, URL, and
fallback orchestration. Presentation components retain markup. New data modules
own cohesive, framework-free derivation policies behind explicit typed
contracts.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, Vitest.

## Global Constraints

- Preserve GraphQL, URL, pagination, comparison, currency, date, and accessible
  behavior.
- Do not add barrels, generic helpers, wrapper-only components, render props,
  or speculative reuse points.
- Keep framework-free modules free of React, Relay, and router imports.
- Keep semantic integration coverage while adding focused direct tests for the
  extracted contracts.

---

### Task 1: Product Detail Decision Actions Presentation

**Files:**

- Create: `assets/src/routes/products/ProductDecisionActions.tsx`
- Modify: `assets/src/routes/products/ProductDetailRoute.tsx`
- Test: `assets/test/routes/products/detail.route.test.tsx`
- Modify: `docs/work/frontend-product-detail.md`

**Interface:** The route derives all destinations and passes an explicit compare
state: `{ kind: "add", href }`, `{ kind: "selected" }`, or `{ kind: "full" }`.
`ProductDecisionActions` owns the accessible `Next steps` region, compare-state
copy, and existing offer/browse links. The route retains Relay reads,
location/navigation state, selected-slug parsing, selection limits, and URL
construction.

- [ ] Add direct semantic coverage for add, selected, and full compare states
  plus offer and browse links; verify RED against the missing component.
- [ ] Extract the presentation boundary with a narrow typed contract.
- [ ] Preserve encoded destinations, offer cursors, tab hashes, and tray-return
  URLs in the route-owned path derivation.
- [ ] Run the focused detail suite, TypeScript, and `git diff --check`.
- [ ] Record lane evidence and commit the milestone.

---

### Task 2: Revenue Summary View-Data Contract

**Files:**

- Create: `assets/src/routes/commerce/revenue/revenue-summary-view-data.ts`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
- Modify: `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
- Create: `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
- Test: `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- Modify: `docs/work/frontend-revenue-reporting-demo-parity.md`

**Interface:** Framework-free `buildRevenueSummaryControls(filters,
currentDate?)` returns exact active-filter and preset-link contracts.
`buildRevenueSummaryMetrics(summary, currency)` returns the five display
metrics. The route retains loader data, Relay reads, Suspense/error boundaries,
status fallbacks, and currency fallback ownership.

- [ ] Add pure tests for local-calendar presets, retained filters, invalid
  ranges, suppression, nulls, and empty-string money values; verify RED.
- [ ] Move only controls and metric derivation into the typed data module.
- [ ] Preserve exact query ordering, encoding, date boundaries, and display
  fallbacks.
- [ ] Run focused data, route, and loader suites, TypeScript, and diff checks.
- [ ] Record lane evidence and commit the milestone.

---

### Task 3: Specification Matrix Data Contract

**Files:**

- Create: `assets/src/routes/compare/specification-matrix-data.ts`
- Modify: `assets/src/routes/compare/CompareSpecificationMatrix.tsx`
- Create: `assets/test/routes/compare/specification-matrix-data.test.ts`
- Test: `assets/test/routes/compare/compare.route.test.tsx`
- Modify: `docs/work/frontend-product-comparison-demo-parity.md`

**Interface:** Framework-free `buildSpecificationMatrixRows(products,
specMode)` returns typed rows with display and normalized comparison values.
The component retains titles, empty-state copy, Radix scrolling, and semantic
table markup.

- [ ] Add pure tests for stable ordering, duplicate codes, missing cells, every
  mode, typed values, units, and decimal/exponent normalization; verify RED.
- [ ] Move the cohesive row-construction and comparison policy into the data
  module without framework imports.
- [ ] Preserve first-occurrence duplicate behavior, bounded exponent handling,
  and exact unavailable/mode semantics.
- [ ] Run the focused data and compare suites, TypeScript, and diff checks.
- [ ] Record lane evidence and commit the milestone.

## Validation Evidence

- Fresh source and test audits rejected affiliate workflow composition and
  catalog workspace extraction as wrapper-only or orchestration-blurring.
- Product-detail characterization passed 49 tests on 2026-07-12.
- Revenue route and loader characterization passed 22 tests on 2026-07-12.
- Compare characterization passed 105 tests on 2026-07-12.
- The three rows have non-overlapping owned source, test, and lane-doc paths.
