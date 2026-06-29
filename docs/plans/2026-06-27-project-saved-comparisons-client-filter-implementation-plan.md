# Saved Comparisons Client Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side saved-comparison filter to `/compare/saved` for narrowing visible saved sets by name or product slug.

**Architecture:** Keep this frontend-only and use the saved sets already loaded by `savedComparisonsLoader`. Filtering applies after loader summaries and Relay page summaries are built; no GraphQL query or backend mutation changes are needed.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/compare/saved.tsx`
- `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
- `assets/test/routes/compare/saved-comparisons-test-helpers.ts`
- `docs/work/frontend-saved-comparisons-ui.md`

Do not edit `lib/**`, `assets/src/routes/compare/index.tsx`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Add a text input labelled `Filter saved comparisons`.
- Filter by saved-set name and product slug, case-insensitive.
- Show a distinct empty message when saved sets exist but none match the filter.
- Preserve existing delete behavior and unauthorized sign-in CTA.

## Tasks

- [ ] Add failing route tests for name filtering, slug filtering, no-match message, and delete behavior after filtering.
- [ ] Add a small pure helper for filtering saved-set summaries.
- [ ] Update `SavedComparisonsRoute` state and rendering to apply the filter to fallback summaries and Relay summaries.
- [ ] Ensure filter changes do not clear pending delete state or delete errors.
- [ ] Run `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when saved comparison filtering works entirely client-side and existing delete/unauthorized flows remain covered.
