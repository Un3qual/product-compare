# Offer Discovery Filter Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible filter controls to `/offers` for existing product, merchant, active-only, and page-size URL parameters.

**Architecture:** Use the existing `OfferDiscoveryFilters` and loader normalization. This row only renders route-local controls and preserves current filters in pagination; it does not change the backend `merchantProducts(input:)` contract.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/offers/index.tsx`
- `assets/test/routes/offers/offer-discovery.route.test.tsx`
- `assets/test/routes/offers/offer-discovery-loader.test.ts`
- `docs/work/frontend-offer-discovery-demo-parity.md`

Do not edit `lib/**`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Render a GET form with product id, merchant id, active-only, and page-size controls.
- Keep the current missing-product state for URLs without `productId`.
- Preserve `productId`, `merchantId`, `activeOnly`, and `first` in first/next pagination links.
- Do not add product or merchant pickers in this row.

## Tasks

- [ ] Add failing route tests for filter form values, inactive-offer toggle, and pagination link preservation.
- [ ] Add loader regression coverage for `activeOnly=false`, `first`, `merchantId`, and cursor normalization if gaps remain.
- [ ] Update `OfferDiscoveryRoute` to render `OfferDiscoveryFilterForm` before route states.
- [ ] Update `offerDiscoveryPath` to preserve `first` and `activeOnly=false`.
- [ ] Run `cd assets && bun x vitest run test/routes/offers/offer-discovery-loader.test.ts test/routes/offers/offer-discovery.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when `/offers` exposes its existing URL filters through visible controls and preserves them across pagination.
