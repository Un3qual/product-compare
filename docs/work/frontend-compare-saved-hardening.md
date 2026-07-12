# Frontend Compare And Saved Routes Hardening Work Doc

## Snapshot

- Status: completed (saved comparison view-state extraction)
- Priority: P2
- Source of truth: this file
- Last verified: 2026-07-12 after saved comparison view-state extraction (42
  focused saved-comparison tests)
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

## Saved Comparison View-State Extraction

- Status: completed on 2026-07-12.
- Plan: `docs/superpowers/plans/2026-07-12-next-stack-follow-up-batches.md`.
- Completed: `saved-view-state.ts` now owns deleted-id hiding,
  case-insensitive name/product/slug filtering, sorting, and status precedence.
  `SavedComparisonsRoute` retains React state, Relay retainers and mutations,
  pagination, and comparison URL construction.
- Owned paths:
  - `assets/src/routes/compare/SavedComparisonsRoute.tsx`
  - `assets/src/routes/compare/saved-view-state.ts`
  - `assets/test/routes/compare/saved-comparisons-view-state.test.ts`
  - `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `docs/work/frontend-compare-saved-hardening.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-view-state.test.ts` - 11 tests, 0 failures.
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx` - 31 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with no output.
- Exit condition met: the route consumes one pure view-state contract with exact
  deleted/filter/sort/status behavior and no Relay, mutation, URL, or UI changes.

## Completed Saved Comparison Set Presentation Extraction

- Status: done on 2026-07-11.
- Plan: `docs/superpowers/plans/2026-07-11-next-presentation-reserve-batches.md`
- `SavedComparisonSetList` now owns saved-set controls, list and item markup,
  reopen/delete actions, and pagination presentation.
- `SavedComparisonsRoute` retains loader and Relay reads, mutation commits and
  completion/error handling, query retainers, local filter/sort/delete state,
  return/error branches, and every route-built URL.
- Owned paths:
  - `assets/src/routes/compare/SavedComparisonsRoute.tsx`
  - `assets/src/routes/compare/SavedComparisonSetList.tsx`
  - `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `docs/work/frontend-compare-saved-hardening.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx` - 29 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with no output.
- Exit condition met: saved-set presentation is isolated while mutation,
  query-retention, filtering, sorting, and pagination behavior remain green.

## Historical Completed Hardening And Relay Migration

The following records describe the completed shared-shell, error-boundary, and
Relay-migration work that preceded the completed saved comparison set
presentation-extraction section above.

- `assets/src/routes/compare/compare-shell.tsx` provides a shared responsive shell for both compare routes.
- `assets/src/routes/compare/index.tsx` uses the shared shell and exposes save-success feedback through a polite `role="status"` region.
- `assets/src/routes/compare/saved.tsx` uses the shared shell, exposes a named saved-set list plus polite status messaging, and keeps overlapping delete state race-safe with per-row pending tracking.
- `/compare` and `/compare/saved` now both sit on the Relay data path; `/compare/saved` renders saved-set pages from `SavedComparisonsRouteQuery` descriptors and deletes through `DeleteSavedComparisonSetMutation`.
- `assets/src/router.tsx` mounts both `/compare` and `/compare/saved` with a shared `CompareErrorBoundary` as the `errorElement` for each route.
- `assets/src/routes/compare/error-boundary.tsx` provides differentiated error messages based on route error response status codes and network-related error signatures.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` covers the shared-shell accessibility semantics, compare save status messaging, overlapping delete regressions, and loader-level regression tests for unauthorized, parse-failure, truncation, and cursor-safety paths.

## Historical Completed Batch Closure Record

- Status: completed (historical)
- Completed prior batch:
  - Task 1 already landed the shared shell plus route-local status semantics.
  - Task 2 already landed compare-scoped `errorElement` wiring and focused regression tests.
  - Relay route-data Task 6 closed the former queue-rebaseline blocker.

## Historical Follow-Up Record

At the time of the prior hardening closure, the `/compare/saved` Relay migration
had completed in `docs/work/frontend-saved-comparisons-relay-migration.md`.
That closure is historical; the current active lane state is the ready Saved
Comparison Set Presentation Extraction batch in `## Ready Next Batch`.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/compare-shell.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/router.tsx`
- `sed -n '1,360p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun run typecheck`
