# Frontend Shopper Home And Navigation Work Doc

## Snapshot

- Status: ready
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

- The home introduction says `GraphQL-backed browser auth flows now live
  alongside the frontend routes`, which exposes implementation status rather
  than the shopper outcome.
- Home actions and primary navigation currently show Saved comparisons,
  Affiliate setup, Revenue, and API tokens to guests even though those surfaces
  use authenticated contracts or account-oriented workflows.
- Existing tests explicitly lock the viewer-agnostic links, so both batches
  start with focused RED coverage before behavior changes.

## Ready Batch 1: Shopper-Focused Home Content

Status: ready
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
