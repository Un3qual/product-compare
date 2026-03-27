# Frontend Compare And Saved Routes Hardening Work Doc

## Snapshot

- Status: blocked on frontend Relay route-data adoption
- Priority: P2
- Source of truth: this file
- Last verified: 2026-03-22 after merge-conflict review
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
- `assets/src/router.tsx` mounts both `/compare` and `/compare/saved` with a shared `CompareErrorBoundary` as the `errorElement` for each route.
- `assets/src/routes/compare/error-boundary.tsx` provides differentiated error messages based on route error response status codes and network-related error signatures.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` covers the shared-shell accessibility semantics, compare save status messaging, overlapping delete regressions, and loader-level regression tests for unauthorized, parse-failure, truncation, and cursor-safety paths.

## Next Batch

- Status: blocked by queue rebaseline
- Batch: Resume Task 2 from `docs/plans/2026-03-19-frontend-compare-saved-hardening-implementation-plan.md` after `docs/work/frontend-relay-route-data.md` is complete
- Why this batch:
  - Task 1 already landed the shared shell plus route-local status semantics, so the remaining hardening gap is compare-scoped route-boundary failure handling.
  - `/compare` and `/compare/saved` still depend on the manual `assets/src/routes/compare/api.ts` helper path, so deferring Task 2 avoids polishing a route surface that will soon change data-layer shape.
  - Once Relay adoption re-establishes the compare routes on the long-term path, Task 2 can stay tightly scoped to compare-scoped `errorElement` wiring and focused regression tests.

## Planned Follow-Up

- Re-open this work item as the next compare-route polish slice once the compare and saved-comparisons routes stop depending on the manual helper path.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/compare-shell.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/router.tsx`
- `sed -n '1,360p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun run typecheck`
