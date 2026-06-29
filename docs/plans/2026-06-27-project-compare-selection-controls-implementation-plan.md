# Compare Selection Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add remove controls to `/compare` so users can adjust the selected product set without manually editing query params.

**Architecture:** Keep this route-local and URL-driven. The compare route already builds selections from repeated `slug` params; add link helpers that remove one slug while preserving order for the remaining products.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/compare/index.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`

Do not edit `lib/**`, `assets/src/routes/compare/saved.tsx`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Render `Remove <product name>` links for each selected compare card.
- Preserve the order of remaining selected slugs.
- Link to `/compare` with no query string when the last product is removed.
- Keep save-comparison mutation behavior unchanged.

## Tasks

- [ ] Add failing route tests for removing the first, middle, last, and only selected product.
- [ ] Add a pure helper that builds a compare URL after removing one selected slug by index.
- [ ] Render remove links near each ready-state product card.
- [ ] Ensure removing a product clears stale save success/error state through the existing selection key flow.
- [ ] Run `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when compare selections can be edited with URL-safe remove links and focused route coverage.
