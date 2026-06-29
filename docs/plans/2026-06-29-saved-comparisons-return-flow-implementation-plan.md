# Saved Comparisons Return Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/compare/saved` a stronger return point for reopening saved sets or continuing product exploration.

**Architecture:** Keep the existing saved-comparison Relay route query, client-side filter, reopen links, and delete mutation. Improve card summaries, empty states, filtered no-match states, and return links without changing backend pagination, auth, or mutation contracts.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** done. This plan completed in the 2026-06-29 usable-product queue.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/compare/saved.tsx`
- `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- `docs/work/frontend-saved-comparisons-ui.md`

Do not edit `assets/src/routes/compare/index.tsx`, `assets/src/routes/compare/saved-data.ts`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `lib/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Make saved-set cards summarize product count and reopen/delete actions clearly.
- Add empty-state and filtered no-match actions that lead to `/products` or `/compare`.
- Preserve authenticated, unauthorized, delete, and filter behavior.
- Keep saved-set backend schema, pagination, save mutation, and route-loader changes out of scope.

## Tasks

- [x] Add failing route coverage for saved-set card summaries and clear reopen/delete actions.
- [x] Add failing route coverage for empty and no-match return actions.
- [x] Update `SavedComparisonsRoute` markup/helpers without changing Relay query or mutation inputs.
- [x] Update `docs/work/frontend-saved-comparisons-ui.md` with implementation evidence and verification output.
- [x] Run `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`.
- [x] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when `/compare/saved` makes reopen, delete, browse, and compare return paths clear while preserving existing auth and delete behavior.
