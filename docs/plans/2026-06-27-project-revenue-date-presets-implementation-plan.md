# Revenue Date Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add quick date-range preset links to `/commerce/revenue` without changing the revenue summary GraphQL contract.

**Architecture:** Build route-local preset links that set existing `from` and `to` URL params. The loader already validates date ranges and currency requirements, so this row only improves navigation around the existing filters.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/commerce/revenue/index.tsx`
- `assets/test/routes/commerce/revenue/revenue-summary.route.test.tsx`
- `docs/work/frontend-revenue-reporting-demo-parity.md`

Do not edit `lib/**`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Add links for last 7 days, last 30 days, month to date, and clear dates.
- Preserve existing `network` and `currency` params in preset links.
- Use a route-local date helper that accepts an optional current date for deterministic tests.
- Do not add backend date logic or new GraphQL fields.

## Tasks

- [ ] Add failing route tests for preset link URLs with preserved network/currency filters.
- [ ] Add deterministic helper tests by exporting or colocating a pure preset builder.
- [ ] Update `RevenueSummaryRoute` to render `RevenueDatePresetLinks` near the filter form.
- [ ] Ensure preset links do not render invalid date ranges.
- [ ] Run `cd assets && bun x vitest run test/routes/commerce/revenue/revenue-summary.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when revenue users can apply common date ranges through tested links that preserve the other active filters.
