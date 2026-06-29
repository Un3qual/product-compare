# Affiliate Setup Merchant Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/affiliate/setup` show the selected merchant context consistently across program, link, and coupon forms.

**Architecture:** Keep this frontend-only and use the merchant choices already loaded by `AffiliateSetupRouteQuery`. Add route-local selected merchant summary and helper text that updates when form merchant selections change.

**Tech Stack:** React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/affiliate/setup/index.tsx`
- `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- `docs/work/frontend-affiliate-setup-demo-parity.md`

Do not edit `lib/**`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Show selected merchant name and domain beside program, link, and coupon forms.
- Update the context as each form's merchant selection changes.
- Keep mutation variables and backend affiliate contracts unchanged.
- Do not add merchant search or pagination in this row.

## Tasks

- [ ] Add failing route tests for selected merchant summaries on program, link, and coupon forms.
- [ ] Add route-local state or derived helpers for merchant id to merchant display lookup.
- [ ] Render a concise selected-merchant summary for each affected form.
- [ ] Ensure empty merchant lists keep the existing unavailable or empty behavior.
- [ ] Run `cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when affiliate setup forms visibly reflect the selected merchant context without changing any GraphQL mutation contract.
