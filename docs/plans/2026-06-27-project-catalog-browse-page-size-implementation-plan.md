# Catalog Browse Page Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `/products` users choose a bounded catalog page size while preserving cursor pagination.

**Architecture:** Keep this frontend-only and reuse the existing Relay `products(first:, after:)` contract. Parse `first` from the URL in the route loader, render a small page-size form in the browse route, and preserve `first` when building next/first pagination links.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/catalog/loader.ts`
- `assets/src/routes/catalog/browse.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `docs/work/frontend-catalog-browse.md`

Do not edit `lib/**`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Support URL param `first` on `/products`, default `12`, max `48`, invalid values fall back to `12`.
- Render a compact page-size selector with options `12`, `24`, and `48`.
- Preserve `first` in `Next products` and `First products` links.
- Keep product filtering, backend GraphQL schema, and generated Relay artifacts out of scope.

## Tasks

- [ ] Add failing loader tests covering default, supported, oversized, and malformed `first` values.
- [ ] Add failing route tests covering selected page size and pagination links that preserve `first`.
- [ ] Update `browseLoader` to normalize `first` from `request.url`.
- [ ] Update `BrowseRoute` helpers to render the page-size form and include `first` in pagination link builders.
- [ ] Run `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when `/products?first=24` preloads 24 products, renders the selected control state, and carries `first=24` through browse pagination links.
