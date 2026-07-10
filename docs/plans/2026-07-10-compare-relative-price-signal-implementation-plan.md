# Compare Relative Loaded Price Signal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:test-driven-development` and either
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task.

**Status:** ready

**Goal:** Help shoppers identify the lowest already-loaded comparable price in
the comparison decision summary without making unsafe cross-currency claims.

**Architecture:** Derive a display-only relative signal from the existing
`bestCurrentPrice` summaries. Compare decimal strings only after validating a
shared currency and at least two usable prices; add no query, loader, schema, or
backend work.

**Tech Stack:** React, TypeScript, Vitest, Bun.

## Global Constraints

- Use only the already-loaded `bestCurrentPrice` values.
- Do not subtract prices or display savings amounts.
- Do not compare mixed currencies, malformed prices, missing prices, or
  unavailable offer contexts.
- Preserve all current decision-summary rows and offer links.

## Owned Paths

- `assets/src/routes/compare/decision-summary.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`

## Interfaces

- `DecisionSummary` continues to consume `products` and `offerContexts`.
- A new `Relative loaded price` row labels a unique minimum `Lowest loaded
  price`, equal minima `Tied for lowest loaded price`, other comparable values
  `Above lowest loaded price`, and unsafe cells `Not comparable`.

## Batches

- [ ] **1. Add RED decision-summary cases.** Cover distinct same-currency
  prices, a tied minimum, mixed currencies, malformed or missing prices, and an
  unavailable context.
- [ ] **2. Implement the safe relative signal.** Parse comparable decimal
  strings without floating-point arithmetic, require one shared currency and at
  least two usable values, and render the new row without altering loader data.
- [ ] **3. Verify and record the lane.** Run the focused named cases, full
  compare route suite, TypeScript, and diff checks; append RED/GREEN evidence to
  the comparison lane doc.
- [ ] **4. Commit the milestone.** Commit code, tests, and lane evidence with
  `feat: add relative comparison price signal`.

## Verification

- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "relative loaded price|lowest loaded price|not comparable"`
- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

The decision summary identifies a safe lowest loaded price for comparable
same-currency values and explicitly declines every unsafe comparison.

## Blocker And Fallback

If exact decimal ordering cannot reuse a current decimal helper without
changing its contract, add a focused compare-local string comparator with unit
coverage. Do not coerce money through JavaScript `Number`.
