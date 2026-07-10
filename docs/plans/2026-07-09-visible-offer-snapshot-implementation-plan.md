# Visible Offer Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Status:** ready. This offer-discovery row must not execute concurrently with
the offer observation and coupon validity row because both own the same route,
test, and lane doc.

**Goal:** Summarize the visible `/offers` page with counts and a safe comparable
lowest-price signal derived from the rows the shopper can actually use.

**Architecture:** Compute a route-local snapshot after the existing safe-URL
renderability gate and from the same `RenderableOffer` rows used by the list.
Reuse current decimal parsing and single-currency checks; do not add a request,
schema field, or persisted state.

**Tech Stack:** React, TypeScript, Relay response data, Vitest, Bun.

## Global Constraints

- Label every metric as visible/page-local; do not imply global offer totals or
  global price ranking.
- Do not compare numeric prices across currencies.
- Preserve current filters, page-local sorting/highlights, pagination, merchant
  quick filters, coupons, history, safe URLs, and tracked clicks.
- Empty visible pages omit the snapshot.

## Owned Paths

- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `docs/work/frontend-offer-discovery-demo-parity.md`

## Interfaces

- `buildVisibleOfferSnapshot(offers)` returns `visibleOfferCount`,
  `lowestVisiblePriceText`, `pricesComparable`, `couponAvailabilityCount`, and
  `missingLatestPriceCount`.
- Coupon availability counts an offer when it has a loaded coupon or its coupon
  connection reports `hasNextPage`.
- Lowest price is selected only when every visible numeric price uses the same
  normalized currency; mixed currencies render `Not comparable across currencies`.
- No numeric prices render `No visible prices`.

## Batches

- [ ] **1. Add failing snapshot coverage.** Cover a single-currency page,
  mixed currencies, missing prices, coupon availability, unsafe rows excluded
  by the existing gate, and the empty-page omission.
- [ ] **2. Add the pure summary builder.** Derive all metrics from
  `RenderableOffer` rows and current price/coupon helpers without changing sort
  order or Relay data.
- [ ] **3. Render the accessible summary.** Add a named `Visible offer snapshot`
  region before the list with explicitly visible/page-local metric labels and
  the defined comparable-price fallbacks.
- [ ] **4. Verify and record completion.** Run the focused offer route suite and
  TypeScript, then replace the ready snapshot section in the offer-discovery
  lane doc with red/green evidence.
- [ ] **5. Commit the milestone.** Commit UI, tests, and lane evidence together
  with `feat: add visible offer snapshot`.

## Verification

- `cd assets && bun x vitest run test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

`/offers` shows a page-local snapshot that matches renderable rows, handles
mixed/missing price data without a misleading winner, and preserves all current
offer-list behavior.

## Blocker And Fallback

If current renderability or currency helpers cannot be reused without changing
their behavior, stop and record the specific incompatibility in the offer lane
doc. Do not bypass safe-URL filtering or duplicate currency parsing.
