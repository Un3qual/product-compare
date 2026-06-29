# Product Detail Offer Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL-driven active-offer pagination to `/products/:slug` using the existing product-offers Relay query.

**Architecture:** Keep this route-local and frontend-only. The product detail loader already preloads active offers with `ProductOffersRouteQuery`; extend it to accept `offersAfter`, and render next/first offer links inside the product detail offer section.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/products/loader.ts`
- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-detail.md`

Do not edit `lib/**`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `assets/src/routes/offers/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Support `offersAfter` on product detail URLs.
- Preserve product not-found and product-unavailable behavior.
- Render `Next offers` and `First offers` links for active offers on the product detail page.
- Keep top-level `/offers` unchanged.

## Tasks

- [ ] Add failing loader coverage proving `offersAfter` is forwarded to `ProductOffersRouteQuery` as `after`.
- [ ] Add failing route coverage for `Next offers` and `First offers` links on `/products/:slug`.
- [ ] Update `productDetailLoader` and `preloadProductOffers` to accept the normalized `offersAfter` cursor.
- [ ] Update `ProductOffers` rendering to receive the current product slug and current offer cursor, then build URL-safe pagination links.
- [ ] Run `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when product detail offer pagination is URL-driven, reload-safe, and covered by focused route tests.
