# Product Detail Price Observation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Status:** completed on 2026-07-09. Completion evidence lives in
`docs/work/frontend-product-detail.md`.

**Goal:** Show the observation date for each visible latest price on
`/products/:slug`.

**Architecture:** Extend the existing product-offers Relay query with
`latestPrice.observedAt`, normalize it beside the visible price row, and render
semantic date context only when the timestamp is usable. This plan does not
depend on `MerchantProduct.lastSeenAt`.

**Tech Stack:** React, TypeScript, Relay, Vitest, Bun.

## Global Constraints

- Keep the batch frontend/Relay-query only.
- Do not add freshness thresholds or change price, coupon, history, pagination,
  compare-selection, or tracked-click behavior.
- Offers with a missing or malformed observation timestamp still render their
  latest price.
- Do not edit the offer-discovery route or its lane doc.

## Owned Paths

- `assets/src/routes/products/queries/ProductOffersRouteQuery.ts`
- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `assets/src/__generated__/ProductOffersRouteQuery.graphql.ts`
- `docs/work/frontend-product-detail.md`

## Interfaces

- `ProductOffersRouteQuery.latestPrice` selects `id`, `price`, and
  `observedAt`.
- The visible product-offer shape carries nullable `priceObservedAt` and its
  formatted calendar date.
- A valid date renders `Price observed <time dateTime="...">YYYY-MM-DD</time>`;
  missing or invalid values render no observation claim.

## Batches

- [x] **1. Add failing query and route coverage.** Assert the Relay query
  includes `observedAt`, then cover valid, missing, and malformed timestamps
  while confirming latest price and offer actions remain visible.
- [x] **2. Extend and generate the query.** Select `observedAt` and run Relay to
  refresh the generated product-offers artifact.
- [x] **3. Render price observation context.** Reuse the route's existing safe
  observed-date formatting and semantic time markup; do not derive relative
  freshness.
- [x] **4. Verify and record completion.** Run Relay, the focused detail suite,
  and TypeScript, then replace the ready section in the product-detail lane doc
  with red/green evidence.
- [x] **5. Commit the milestone.** Commit query, generated artifact, UI, tests,
  and lane evidence together with `feat: add product price observation dates`.

## Verification

- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

Visible latest prices on `/products/:slug` show their supported observation
date, and missing/malformed dates do not hide prices or regress the route.

## Blocker And Fallback

If the existing schema snapshot lacks `PricePoint.observedAt`, stop and record
the snapshot mismatch in the product-detail lane doc. Do not add a second query
or infer the observation date from offer or ingestion timestamps.
