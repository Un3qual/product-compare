# Offer Discovery Product Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/offers` easier to understand when a shopper arrives from a product card or product detail page.

**Architecture:** Keep the existing `merchantProducts(input:)` Relay route query and URL filter model. Add route-local filter summaries, clear/reset links, and product-selection guidance without resolving slugs, adding backend fields, or changing the GraphQL contract.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** done. This plan completed in the 2026-06-29 usable-product queue.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery-loader.test.ts`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `docs/work/frontend-offer-discovery-demo-parity.md`

Do not edit `assets/src/routes/offers/loader.ts`, `assets/src/routes/catalog/browse.tsx`, `assets/src/routes/products/detail.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `lib/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Show a compact active-filter summary for product, merchant, active-only, and page-size filters.
- Add clear-filter or reset links that preserve route-local behavior and avoid manual URL editing.
- Improve the missing-product state with a path back to `/products`.
- Preserve existing form controls, cursor pagination, and offer row rendering.
- Keep product slug resolution, product picker searches, backend query changes, and generated Relay changes out of scope.

## Tasks

- [ ] Add failing route coverage for active-filter summaries and clear/reset links.
- [ ] Add failing route coverage for the missing-product guidance link back to `/products`.
- [ ] Preserve existing loader normalization tests; add loader coverage only if URL helper behavior changes.
- [ ] Update `OfferDiscoveryRoute` markup/helpers without changing Relay variables or backend input shape.
- [ ] Update `docs/work/frontend-offer-discovery-demo-parity.md` with implementation evidence and verification output.
- [ ] Run `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when `/offers` clearly states which filters are active, lets users reset them, and points unfiltered users back to product selection without backend changes.
