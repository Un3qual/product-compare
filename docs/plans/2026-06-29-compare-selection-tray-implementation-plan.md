# Compare Selection Tray Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/compare` easier to use by showing the active selected-product set and the next add/remove actions.

**Architecture:** Keep `/compare` URL-driven with repeated `slug` params and reuse the existing Relay route query, picker data, save action, and remove-link helpers. Add a compact selection tray and clearer add/remove affordances without introducing persistence outside the saved-comparison flow.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-29 usable-product queue.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/compare/index.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`

Do not edit `assets/src/routes/compare/saved.tsx`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `lib/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Render a stable selected-product tray/header for ready compare states.
- Keep remove controls URL-safe and preserve selected slug order.
- Make the add-another-product path visible when fewer than three products are selected.
- Preserve the current product picker, compare cards, attributes, and save action behavior.
- Keep browser storage, cross-route persistent tray work, saved-set schema changes, and backend work out of scope.

## Tasks

- [ ] Add failing route coverage for the selected-product tray and each selected product's remove link.
- [ ] Add or preserve route coverage for add-another-product links and save-comparison behavior.
- [ ] Update `CompareRoute` markup/helpers without changing Relay variables or generated artifacts.
- [ ] Update `docs/work/frontend-product-comparison-demo-parity.md` with implementation evidence and verification output.
- [ ] Run `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when `/compare` shows the active selection, supports clear remove/add actions, and preserves URL-driven compare state.
