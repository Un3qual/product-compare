# Frontend Compare And Saved Routes Hardening Work Doc

## Snapshot

- Status: active
- Priority: P2
- Source of truth: this file
- Last verified: 2026-03-19 at `53cfe47` + working tree
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
  - `docs/work/frontend-saved-comparisons-ui.md`
- Definition of done:
  - `/compare` and `/compare/saved` share a responsive route shell rather than ad-hoc markup.
  - Save/delete feedback is exposed through accessible route-local status messaging.
  - Compare and saved-comparisons routes register route-level error boundaries for unexpected loader/render failures.
  - Focused frontend tests cover the hardened shell and error-boundary fallbacks without reopening unrelated route work.

## Verified Current State

- `assets/src/routes/compare/compare-shell.tsx` provides a shared responsive shell for both compare routes.
- `assets/src/routes/compare/index.tsx` uses the shared shell and exposes save-success feedback through a polite `role="status"` region.
- `assets/src/routes/compare/saved.tsx` uses the shared shell, exposes a named saved-set list plus polite status messaging, and keeps overlapping delete state race-safe with per-row pending tracking.
- `assets/src/router.tsx` still mounts both `/compare` and `/compare/saved`, but neither route registers a compare-scoped `errorElement` yet.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` covers the shared-shell accessibility semantics, compare save status messaging, and overlapping delete regressions, but it does not yet cover route-level error boundaries.

## Next Batch

- Status: ready
- Batch: Task 2 from `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
- Why this batch:
  - The shared shell and accessibility semantics are now in place, so the remaining hardening gap is unexpected-failure handling at the route boundary.
  - Task 2 keeps the work tightly scoped to the compare route surface, router registration, and focused compare route tests.
  - Advancing to Task 2 keeps this work item moving without reopening unrelated route/UI scope.

## Planned Follow-Up

- Close this work doc after Task 2 verification unless new compare/saved UI scope is opened.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/compare-shell.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/router.tsx`
- `sed -n '1,360p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`
