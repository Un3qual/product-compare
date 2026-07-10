# Shopper Home Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:test-driven-development` and either
> `superpowers:subagent-driven-development` or `superpowers:executing-plans` to
> implement this plan task-by-task.

**Status:** ready

**Goal:** Make the home route explain the shopper journey and prioritize product
browse, comparison, and offer review instead of exposing implementation-status
copy.

**Architecture:** Keep the batch inside the existing root route. Rework only
the home content hierarchy and action grouping; do not change the root viewer
query, router, route authorization, or destination behavior.

**Tech Stack:** React, TypeScript, React Router, StyleX, Vitest, Bun.

## Global Constraints

- Keep the existing root viewer preload and auth-link behavior unchanged.
- Do not add data fetching, schema changes, backend work, or new routes.
- Keep all current destinations reachable from the home route.
- Use product language, not GraphQL, Relay, or auth-migration status, in the
  shopper-facing introduction.

## Owned Paths

- `assets/src/routes/root.tsx`
- `assets/test/routes/root.route.test.tsx`
- `docs/work/frontend-shopper-home-navigation.md`

## Interfaces

- `RootRoute` continues to consume `RootOutletContext.viewer`.
- Primary shopper actions link to `/products`, `/compare`, and `/offers`.
- Secondary actions retain their existing paths and button primitives.

## Batches

- [ ] **1. Add RED home-content coverage.** Assert the rendered home route
  describes finding products, comparing specifications, and reviewing offers;
  assert the technical `GraphQL-backed browser auth flows` sentence is absent;
  and assert the three primary shopper links keep their current paths.
- [ ] **2. Implement the shopper hierarchy.** Replace the technical
  introduction with outcome-focused copy, render a labeled primary shopper
  action group, and keep secondary destinations in a separate labeled group.
- [ ] **3. Verify and record the lane.** Run the focused root suite, TypeScript,
  and diff checks; record RED/GREEN evidence in the lane work doc.
- [ ] **4. Commit the milestone.** Commit code, tests, and lane evidence with
  `feat: focus home on shopper journey`.

## Verification

- `cd assets && bun x vitest run test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

The home route communicates the browse, compare, and offer-review journey,
prioritizes those actions, preserves every current destination, and has green
focused tests.

## Blocker And Fallback

If the current root component cannot separate primary and secondary actions
without changing viewer or router behavior, stop and record the exact coupling
in `docs/work/frontend-shopper-home-navigation.md`. Do not add a new route or
duplicate root-loader state.
