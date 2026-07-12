# Frontend Shopper Home And Navigation Work Doc

## Snapshot

- Status: ready (root destination presentation extraction)
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-12 after next-boundary validation (200 tests across
  the promoted cohort)
- Active plans:
  - `docs/plans/2026-07-10-shopper-home-content-implementation-plan.md`
  - `docs/plans/2026-07-10-viewer-aware-navigation-implementation-plan.md`
- Objective: make the root route product-oriented and viewer-aware without
  changing its GraphQL viewer contract or direct-route authorization.

## Root Destination Presentation Extraction

- Status: ready on 2026-07-12.
- Plan: `docs/superpowers/plans/2026-07-12-next-presentation-boundaries.md`.
- Next action: Extract primary navigation and home destination presentation
  while preserving route-owned Relay reads, viewer normalization, providers,
  metadata, shell, outlet context, and page copy.
- Owned paths:
  - `assets/src/routes/RootRoute.tsx`
  - `assets/src/routes/RootDestinations.tsx`
  - `assets/test/routes/root.route.test.tsx`
  - `docs/work/frontend-shopper-home-navigation.md`
- Prerequisite: the existing root route suite is green and remains the
  characterization contract.
- Verification:
  - `cd assets && bun x vitest run test/routes/root.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: guest/authenticated destination presentation is isolated
  without changing route data, viewer visibility, active states, labels, paths,
  auth actions, SSR, or hydration.

## Verified Current State

- Public browse, merchant, offer, and compare destinations remain visible to
  guests and authenticated viewers.
- Saved comparisons, affiliate setup, revenue preview, and API tokens appear
  only for authenticated viewers in both primary navigation and home actions.
- Sign in/Create account remain guest-only; Sign out remains
  authenticated-only.

## Ready Batch 1: Shopper-Focused Home Content

Status: done
Plan: `docs/plans/2026-07-10-shopper-home-content-implementation-plan.md`
Owned paths:

- `assets/src/routes/root.tsx`
- `assets/test/routes/root.route.test.tsx`
- `docs/work/frontend-shopper-home-navigation.md`

Verification:

- `cd assets && bun x vitest run test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: The root page communicates and prioritizes the browse, compare,
and offer-review journey without changing route data or authorization.

Completion evidence:

- RED: `cd assets && bun x vitest run test/routes/root.route.test.tsx` failed
  with 1 expected failure because shopper copy and the `Shopper actions` group
  did not exist.
- GREEN: the same focused suite passed 9 tests, `cd assets && bun run
  typecheck` exited 0, and `git diff --check` exited 0.
- The root page now describes finding products, comparing specifications, and
  reviewing current offers, with primary shopper actions separated from
  secondary destinations.

## Ready Batch 2: Viewer-Aware Navigation

Status: done
Plan: `docs/plans/2026-07-10-viewer-aware-navigation-implementation-plan.md`
Owned paths:

- `assets/src/routes/root.tsx`
- `assets/test/routes/root.route.test.tsx`
- `docs/work/frontend-shopper-home-navigation.md`

Verification:

- `cd assets && bun x vitest run test/routes/root.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

Exit condition: Public shopper routes remain visible to guests while saved and
account-oriented destinations appear only for authenticated viewers.

Completion evidence:

- RED: `cd assets && bun x vitest run test/routes/root.route.test.tsx` failed
  with 4 expected failures because guest states still exposed account links and
  authenticated states still used the old `Revenue` label.
- GREEN: the focused suite passed 9 tests, `cd assets && bun run typecheck`
  exited 0, and `git diff --check` exited 0.
- Public and authenticated destination lists are module-scoped and reused by
  the navigation and home action groups without changing route authorization.

## Ownership Note

The two batches share code, test, and lane-doc paths. They are both validated
and ready, but they execute serially under the active-path conflict rule.
