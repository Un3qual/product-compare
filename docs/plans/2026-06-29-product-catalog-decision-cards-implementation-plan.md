# Product Catalog Decision Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/products` a clearer starting point for choosing products to inspect, compare, or shop.

**Architecture:** Keep this frontend-only and reuse the existing Relay browse query, route loader, page-size controls, and URL-driven pagination. Improve the product-card action hierarchy and accessibility without adding product filters, search, backend fields, or generated Relay artifacts.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-29 usable-product queue.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/catalog/browse.tsx`
- `assets/test/routes/catalog/browse.route.test.tsx`
- `docs/work/frontend-catalog-browse.md`

Do not edit `assets/src/routes/catalog/loader.ts`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `lib/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Make each product card expose clear `View details`, `Compare`, and `View offers` actions.
- Preserve the existing product name, slug, brand display, page-size controls, and pagination behavior.
- Improve card grouping and accessible labels enough that route tests can assert the decision actions reliably.
- Keep backend filtering, free-text search, taxonomy controls, and product query changes out of scope.

## Tasks

- [ ] Add failing route coverage for product cards that expose the three decision actions with stable destinations.
- [ ] Add failing route coverage that confirms page-size and pagination controls still render after the card action changes.
- [ ] Update `BrowseRoute` product-card markup and link labels without changing loader data requirements.
- [ ] Update `docs/work/frontend-catalog-browse.md` with implementation evidence and verification output.
- [ ] Run `cd assets && bun x vitest run test/routes/catalog/browse.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when `/products` cards make detail, compare, and offer paths obvious, route tests cover those links, and no backend or Relay schema changes are needed.
