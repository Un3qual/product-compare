# Product Detail Decision Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/products/:slug` clearly guide a shopper from product inspection into compare and offer review.

**Architecture:** Keep this frontend-only and reuse the existing product-detail Relay data, active-offer pagination, compare link, and offer-discovery link. Reorganize the rendered detail route into a decision-action block without changing GraphQL fields, loaders, or generated Relay artifacts.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** done. This plan completed in the 2026-06-29 usable-product queue.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/products/detail.tsx`
- `assets/test/routes/products/detail.route.test.tsx`
- `docs/work/frontend-product-detail.md`

Do not edit `assets/src/routes/products/loader.ts`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `lib/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Promote compare and offer actions into a compact decision block near the product summary.
- Preserve current attribute rendering, offer rows, active-offer pagination, and missing/error states.
- Add a browse-return affordance if it can be implemented with static links only.
- Keep new data fields, offer sorting, saved-comparison mutation changes, and backend resolver work out of scope.

## Tasks

- [x] Add failing route coverage for the decision block and its compare, offer, and browse destinations.
- [x] Add or preserve route coverage for active-offer pagination links after the layout change.
- [x] Update `ProductDetailRoute` markup to make next actions prominent while preserving existing data requirements.
- [x] Update `docs/work/frontend-product-detail.md` with implementation evidence and verification output.
- [x] Run `cd assets && bun x vitest run test/routes/products/detail.route.test.tsx`.
- [x] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when `/products/:slug` makes compare and offer review obvious, existing offer pagination still passes, and no GraphQL or loader changes are required.
