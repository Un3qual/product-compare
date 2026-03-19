# Frontend Saved Comparisons UI Work Doc

## Snapshot

- Status: active
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-18 at `821067e` + working tree
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - `docs/work/saved-comparisons-backend.md`
- Definition of done:
  - The compare route can save a ready-state selection through the GraphQL saved-comparison mutation.
  - The frontend exposes a saved-comparisons route for authenticated users.
  - Saved sets can be reopened into `/compare` using repeated `slug` query params and deleted from the UI.
  - Focused frontend tests cover save, list, reopen, and delete states without reopening unrelated route work.

## Verified Current State

- `assets/src/routes/compare/api.ts` only loads compared products by repeated `slug` query params and has no saved-comparison query or mutation helper.
- `assets/src/routes/compare/index.tsx` only renders compare-ready and fallback states; it has no save action or saved-set link.
- `assets/src/router.tsx` mounts `/compare` only; there is no `/compare/saved` route.
- `assets/src/routes/root.tsx` links to `/compare` but not to any saved-set surface.
- The backend now exposes `mySavedComparisonSets`, `createSavedComparisonSet`, and `deleteSavedComparisonSet`, so the frontend contract is unblocked.

## Next Batch

- Status: ready
- Batch: Task 1 from `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
- Why this batch:
  - The compare route is the existing entrypoint for selected slugs, so saving from there is the smallest user-visible frontend increment on top of the new backend contract.
  - Adding the save action first gives the following saved-set route a real persisted state to render.
  - The work stays contained to the compare route module and its focused frontend tests.

## Planned Follow-Up

- Task 2 from the same implementation plan adds the `/compare/saved` route plus reopen/delete UI.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/api.ts`
- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `sed -n '1,240p' assets/src/router.tsx`
- `sed -n '1,240p' assets/src/routes/root.tsx`
