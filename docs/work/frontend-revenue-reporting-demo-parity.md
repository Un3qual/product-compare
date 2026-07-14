# Frontend Revenue Reporting Demo Parity

## Snapshot

- Status: done (revenue summary view-data contract)
- Priority: P1
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after revenue summary view-data extraction (29
  focused tests and TypeScript)
- Implementation plan: `docs/plans/2026-06-01-frontend-revenue-reporting-demo-parity-implementation-plan.md`
- Recently completed implementation plan: `docs/plans/2026-06-27-project-revenue-date-presets-implementation-plan.md`
- Objective: make the existing public-safe `revenueSummary` GraphQL contract demoable from the browser UI without adding REST endpoints.

## Hydration-Safe Local Date Presets

- Status: done on 2026-07-12.
- Server rendering and the first hydration render now share a stable null date
  snapshot. After hydration, the route acquires the browser-local date and
  builds the existing last-7-days, last-30-days, and month-to-date links.
- The local-calendar contract remains intact both behind and ahead of UTC;
  preset query ordering and preserved network/currency filters are unchanged.
- RED: a UTC server render hydrated in Los Angeles or Tokyo retained the wrong
  day and emitted a hydration mismatch; the feed review timestamp also varied
  with the host time zone.
- GREEN: revenue route and loader suites passed 24 tests, including both time-
  zone offsets; the combined compare, ingestion, offer, revenue, and SSR run
  passed 207 tests. `bun run typecheck` and `git diff --check` passed.

## Batch Status

- [x] Task 1: add the Relay route query and loader for `/commerce/revenue`.
- [x] Task 2: render the revenue reporting route.
- [x] Task 3: wire navigation and close the lane.
- [x] Task 4: add deterministic revenue date preset links (last 7 days, last 30 days, month to date, clear dates) that preserve `network` and `currency`.

## Revenue Summary View-Data Contract

- Status: done on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-12-post-stack-ready-batches.md`.
- Next action: isolate framework-free active-filter, date-preset, and display-
  metric derivation while preserving route-owned loader, Relay, boundary,
  fallback, and currency behavior.
- Owned paths:
  - `assets/src/routes/commerce/revenue/revenue-summary-view-data.ts`
  - `assets/src/routes/commerce/revenue/RevenueSummaryRoute.tsx`
  - `assets/src/routes/commerce/revenue/RevenueSummaryView.tsx`
  - `assets/test/routes/commerce/revenue/revenue-summary-view-data.test.ts`
  - `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
  - `docs/work/frontend-revenue-reporting-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary-view-data.test.ts test/routes/commerce/revenue/revenue-summary.route.test.tsx test/routes/commerce/revenue/revenue-summary-loader.test.ts`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: pure controls and metric contracts preserve local dates,
  query ordering, suppression, null, and empty-string display semantics.
- Completed: framework-free `buildRevenueSummaryControls()` now derives active
  filters and hydration-safe date-preset links, while
  `buildRevenueSummaryMetrics()` derives the five display metrics. The route
  retains loader and Relay reads, Suspense/error boundaries, status fallbacks,
  hydration timing, and currency fallback selection; the view retains form,
  control, and metric presentation.
- Completed evidence:
  - Baseline: the route and loader suites passed 24 tests before extraction.
  - RED: the focused command retained those 24 passes and failed the new pure
    suite because `revenue-summary-view-data` did not exist.
  - GREEN: the focused data, route, and loader suites passed 29 tests, including
    local-calendar URL ordering, invalid-range display, hydration-safe null
    dates, suppression, nulls, and intentional empty-string amounts.
  - The pure module has no React, Relay, router, or StyleX imports.
  - `cd assets && bun run typecheck` completed with exit 0.
  - `git diff --check` completed with exit 0.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-revenue-date-presets-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/commerce/revenue/index.tsx`
  - `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
  - `docs/work/frontend-revenue-reporting-demo-parity.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/commerce/revenue` has deterministic date presets that preserve network and currency filters.
- Completed verification:
  - `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx` - 12 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Verification

- Plan creation verified the existing backend contract by reading `lib/product_compare_web/resolvers/commerce_attribution_resolver.ex`, `test/product_compare_web/graphql/commerce_revenue_summary_test.exs`, and the current local `assets/schema.graphql` snapshot.
- Task 1 RED verification: `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` failed because `../loader` did not exist.
- Task 1 implementation verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts`, and `cd assets && bun run typecheck`.
- Task 2 RED verification: `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx` failed because `../index` did not exist.
- Task 2 implementation verification passed with `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts` and `cd assets && bun run typecheck`.
- Task 3 RED verification:
  - `cd assets && bun x vitest run src/__tests__/router.test.tsx` failed because `commerce/revenue` was not registered.
  - `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx` failed because the `Revenue` links were not present.
  - After code review, `cd assets && bun x vitest run src/routes/__tests__/root.route.test.tsx` failed because the home actions did not yet have an accessible `Home actions` group.
- Task 3 implementation verification passed with `cd assets && bun run relay`, `cd assets && bun x vitest run src/routes/commerce/revenue/__tests__/revenue-summary-loader.test.ts src/routes/commerce/revenue/__tests__/revenue-summary.route.test.tsx src/routes/__tests__/root.route.test.tsx src/__tests__/router.test.tsx`, `cd assets && bun run typecheck`, and `mix test test/product_compare_web/graphql/commerce_revenue_summary_test.exs test/product_compare/commerce_attribution/commerce_attribution_test.exs`.

## Blockers

- None.
