# API Token Expiry Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add expiration preset controls to `/account/api-tokens` for creating and rotating API tokens.

**Architecture:** Keep this frontend-only and continue using the existing `createApiToken` and `rotateApiToken` mutations. Presets populate the existing `expiresAt` form value; the mutation variable shape stays unchanged.

**Tech Stack:** React, Relay generated types, Testing Library, Vitest, Bun.

**Status:** ready. This plan is part of the 2026-06-27 cross-project parallel work-item batch.

---

## Parallel Ownership

Owned paths:

- `assets/src/routes/account/api-tokens/index.tsx`
- `assets/test/routes/account/api-tokens/api-tokens.route.test.tsx`
- `docs/work/frontend-api-token-management-demo-parity.md`

Do not edit `lib/**`, `assets/src/router.tsx`, `assets/schema.graphql`, `assets/src/__generated__/**`, `docs/work/index.md`, or `docs/plans/INDEX.md`.

## Scope

- Add preset buttons for `30 days`, `90 days`, `1 year`, and `No expiration` to create-token and rotate-token forms.
- Keep generated ISO datetime strings compatible with the current mutation variables.
- Preserve the one-time token display, revoke flow, rotate flow, and status filters.
- Do not change API token backend rules.

## Tasks

- [ ] Add failing route tests for create-form presets and rotate-form presets.
- [ ] Add a pure helper that converts a preset and a test-injected current date into an `expiresAt` input value.
- [ ] Render preset controls in create and rotate forms.
- [ ] Ensure `No expiration` clears the form value so the mutation omits or sends nil according to current form behavior.
- [ ] Run `cd assets && bun x vitest run test/routes/account/api-tokens/api-tokens.route.test.tsx`.
- [ ] Run `cd assets && bun run typecheck` and `git diff --check`.

## Exit Condition

The work item is complete when token expiration presets are tested on create and rotate flows without backend changes.
