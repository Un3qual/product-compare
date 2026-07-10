# Offer Observation And Coupon Validity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Status:** completed on 2026-07-09. Completion evidence lives in
`docs/work/frontend-offer-discovery-demo-parity.md`.

**Goal:** Show when each visible offer and latest price were observed and when
an active coupon expires, using existing GraphQL data only.

**Architecture:** Refresh the checked-in frontend schema snapshot for the
backend's existing nullable `MerchantProduct.lastSeenAt` field, extend the
current Relay selection, and render calendar-date context with semantic time
markup. Missing or malformed timestamps omit the associated claim.

**Tech Stack:** React, TypeScript, Relay, GraphQL schema snapshot, Vitest, Bun.

## Global Constraints

- Do not add resolvers, database queries, ingestion behavior, providers, eBay,
  dashboards, operator surfaces, credentials, scraping, or CSV export.
- Do not introduce fresh, aging, or stale thresholds.
- Preserve product context, filters, page-local sorting, merchant quick filters,
  pagination, safe URL handling, price history, coupons, and tracked clicks.
- Render coupon validity only when `validTo` is a usable timestamp.

## Owned Paths

- `assets/schema.graphql`
- `assets/src/routes/offers/queries/OfferDiscoveryRouteQuery.ts`
- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `assets/src/__generated__/OfferDiscoveryRouteQuery.graphql.ts`
- `docs/work/frontend-offer-discovery-demo-parity.md`

## Interfaces

- `OfferDiscoveryRouteQuery` selects nullable `lastSeenAt`, existing
  `latestPrice.observedAt`, and existing coupon `validTo`.
- A route-local date formatter accepts `unknown` and returns either
  `{dateTime: string, dateLabel: string}` or `null`.
- Offer rows render `Offer checked <time>` and `Price observed <time>` only for
  valid values.
- Coupon rows render `Valid through <time>` only for valid `validTo` values.

## Batches

- [x] **1. Add failing route and query coverage.** Assert the query selects
  `lastSeenAt`, and cover valid, missing, and malformed offer/price timestamps
  plus coupon validity rendering without regressing existing coupon details.
- [x] **2. Refresh the schema selection.** Add nullable `lastSeenAt` to the
  checked-in `MerchantProduct` SDL, select it from the offer query, and run
  Relay generation so the generated operation and types agree.
- [x] **3. Render exact date context.** Add semantic time markup using the
  existing calendar-date style. Keep price, coupon, and merchant content visible
  when a date is absent or invalid.
- [x] **4. Verify and record completion.** Run Relay, the focused offer route
  suite, and TypeScript, then replace the ready observation section in the
  offer-discovery lane doc with red/green evidence.
- [x] **5. Commit the milestone.** Commit schema snapshot, query, generated
  artifact, UI, tests, and lane evidence together with
  `feat: add offer observation context`.

## Verification

- `cd assets && bun run relay`
- `cd assets && bun x vitest run test/routes/offers/offer-discovery.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

Every visible `/offers` row renders only supported offer-check, price-observed,
and coupon-validity dates while all missing/malformed timestamp fallbacks and
existing route behaviors remain green.

## Blocker And Fallback

If Relay rejects `lastSeenAt`, verify the checked-in snapshot against the
existing backend field in `lib/product_compare_web/schema.ex`. Stop and record a
schema-snapshot blocker instead of adding a duplicate backend field or a second
request.
