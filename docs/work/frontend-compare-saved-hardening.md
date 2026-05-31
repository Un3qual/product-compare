# Frontend Compare And Saved Routes Hardening Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after saved-comparisons Relay migration handoff verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md`
  - `docs/work/frontend-relay-route-data.md`
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
- `/compare` and `/compare/saved` now both sit on the Relay data path; `/compare/saved` renders saved-set pages from `SavedComparisonsRouteQuery` descriptors and deletes through `DeleteSavedComparisonSetMutation`.
- `assets/src/router.tsx` mounts both `/compare` and `/compare/saved` with a shared `CompareErrorBoundary` as the `errorElement` for each route.
- `assets/src/routes/compare/error-boundary.tsx` provides differentiated error messages based on route error response status codes and network-related error signatures.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` covers the shared-shell accessibility semantics, compare save status messaging, overlapping delete regressions, and loader-level regression tests for unauthorized, parse-failure, truncation, and cursor-safety paths.

## Next Batch

- Status: completed
- Batch: none queued in this work item
- Why this batch:
  - Task 1 already landed the shared shell plus route-local status semantics.
  - Task 2 already landed compare-scoped `errorElement` wiring and focused regression tests.
  - Relay route-data Task 6 closed the queue rebaseline blocker; no additional compare/saved hardening batch is queued from this work item.

## Planned Follow-Up

- Keep this work item closed. The `/compare/saved` Relay migration completed in `docs/work/frontend-saved-comparisons-relay-migration.md`; track any additional compare polish as a new active work item.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/compare-shell.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/router.tsx`
- `sed -n '1,360p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun run typecheck`
