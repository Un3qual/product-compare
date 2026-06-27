# Merchant Directory Page Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add page-size controls to `/merchants` while preserving the existing merchant connection contract.

**Architecture:** The merchant loader already normalizes `first`; this row renders the missing control and ensures first/next pagination links keep that value. No backend schema or Relay query change is required.

**Tech Stack:** React Router, React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/merchants/index.tsx`
- `assets/src/routes/merchants/pagination.ts`
- `assets/test/routes/merchants/merchant-directory-loader.test.ts`
- `assets/test/routes/merchants/merchant-directory.route.test.tsx`
- `docs/work/frontend-merchant-discovery-demo-parity.md`

Do not edit `lib/**`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Render a page-size selector for `20`, `35`, and `50`.
- Preserve `first` in `Next merchants` and `First merchants` links.
- Keep merchant search, backend sorting, and GraphQL schema changes out of scope.

## Tasks

- [ ] Add failing route tests for selected page size and pagination links preserving `first`.
- [ ] Add loader tests for supported, blank, malformed, and oversized `first` values if not already covered.
- [ ] Export a URL-param helper from `pagination.ts` if needed to avoid duplicate link-building logic.
- [ ] Update `MerchantDirectoryRoute` to render a GET form and pass normalized pagination to link builders.
- [ ] Run `cd assets && bun x vitest run test/routes/merchants/merchant-directory-loader.test.ts test/routes/merchants/merchant-directory.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when merchant directory page size is visible, reload-safe, and preserved through pagination.
