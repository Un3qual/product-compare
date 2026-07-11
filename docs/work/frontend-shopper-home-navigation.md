# Frontend Shopper Home And Navigation Work Doc

## Snapshot

- Status: ready (viewer-aware navigation; shopper home content complete)
- Priority: P1
- Source of truth: this file
- Last verified: 2026-07-10 against `assets/src/routes/root.tsx` and
  `assets/test/routes/root.route.test.tsx`
- Active plans:
  - `docs/plans/2026-07-10-shopper-home-content-implementation-plan.md`
  - `docs/plans/2026-07-10-viewer-aware-navigation-implementation-plan.md`
- Objective: make the root route product-oriented and viewer-aware without
  changing its GraphQL viewer contract or direct-route authorization.

## Verified Current Gaps

- Home actions and primary navigation currently show Saved comparisons,
  Affiliate setup, Revenue, and API tokens to guests even though those surfaces
  use authenticated contracts or account-oriented workflows.
- Existing tests still lock viewer-agnostic destination visibility, so the
  remaining batch starts with focused RED coverage before behavior changes.

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

Status: ready
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

## Ownership Note

The two batches share code, test, and lane-doc paths. They are both validated
and ready, but they execute serially under the active-path conflict rule.
