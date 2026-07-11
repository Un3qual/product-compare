# Viewer-Aware Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:test-driven-development` and either
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task.

**Status:** complete

**Goal:** Keep public shopper routes visible to guests while showing saved and
account-oriented destinations only to authenticated viewers.

**Architecture:** Reuse the existing root `viewer` value as the sole visibility
signal. Extract shared public and authenticated link groups inside
`assets/src/routes/root.tsx`; do not introduce a second auth source or change
direct-route authorization.

**Tech Stack:** React, TypeScript, React Router, StyleX, Vitest, Bun.

## Global Constraints

- Public links remain Product Compare, Browse products, Merchants, Offers, and
  Compare products.
- Guest auth links remain Sign in and Create account.
- Authenticated-only navigation links are Saved comparisons, Affiliate setup,
  Revenue, and API tokens, followed by Sign out.
- Visibility is presentation only; route loaders and GraphQL authorization stay
  unchanged.

## Owned Paths

- `assets/src/routes/root.tsx`
- `assets/test/routes/root.route.test.tsx`
- `docs/work/frontend-shopper-home-navigation.md`

## Interfaces

- `RootLayoutShell({viewer})` remains the navigation owner.
- `RootRoute` continues to receive the same `RootOutletContext`.
- The existing `AuthLinks` behavior remains the source for sign-in, register,
  and sign-out visibility.

## Batches

- [x] **1. Add RED viewer-state coverage.** Prove guest navigation and home
  actions omit Saved comparisons, Affiliate setup, Revenue, and API tokens while
  retaining public routes plus Sign in/Create account. Prove authenticated state
  exposes the four authenticated destinations plus Sign out.
- [x] **2. Implement viewer-aware groups.** Render public destinations for all
  viewers and authenticated destinations only when `viewer` exists, reusing the
  same link definitions in navigation and home actions.
- [x] **3. Verify and record the lane.** Run the focused root suite, TypeScript,
  and diff checks; record RED/GREEN evidence without changing direct-route
  behavior.
- [x] **4. Commit the milestone.** Commit code, tests, and lane evidence with
  `feat: make navigation viewer aware`.

## Verification

- `cd assets && bun x vitest run test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

Guest and authenticated root states expose the correct public, account, and auth
destinations while direct routes retain their existing authorization behavior.

## Blocker And Fallback

If a destination is proven public despite its current authenticated GraphQL
contract, keep it public and record the evidence in the lane doc. Do not infer
roles or add authorization fields to `viewer` in this batch.
