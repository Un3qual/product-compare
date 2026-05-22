# Frontend Saved Comparisons UI Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-21 after Relay route-data Task 6 handoff
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - `docs/work/frontend-relay-route-data.md`
  - `docs/work/frontend-compare-saved-hardening.md`
  - `docs/work/saved-comparisons-backend.md`
- Definition of done:
  - The compare route can save a ready-state selection through the GraphQL saved-comparison mutation.
  - The frontend exposes a saved-comparisons route for authenticated users.
  - Saved sets can be reopened into `/compare` using repeated `slug` query params and deleted from the UI.
  - Focused frontend tests cover save, list, reopen, and delete states without reopening unrelated route work.

## Verified Current State

- `assets/src/routes/compare/api.ts` has been removed. `/compare` now loads selected products through Relay preloaded route queries and saves ready selections through `CreateSavedComparisonSetMutation`.
- `assets/src/routes/compare/saved-data.ts` explicitly owns the remaining manual saved-comparisons query/delete helper used by `/compare/saved`.
- `assets/src/routes/compare/index.tsx` renders a ready-state `Save comparison` action that submits the current product relay IDs with a derived saved-set name and reports local success/error feedback.
- `assets/src/routes/compare/saved.tsx` renders `/compare/saved`, loads `mySavedComparisonSets` through `saved-data.ts`, reopens sets back into `/compare`, deletes owned sets, and prompts unauthenticated users to sign in.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` covers the compare save action plus saved-set loader, reopen, delete, unauthorized, and error-boundary states.
- `assets/src/router.tsx` mounts both `/compare` and `/compare/saved` with compare-scoped route error boundaries.
- `assets/src/routes/root.tsx` links to `Saved comparisons` from both the primary navigation and home actions.

## Next Batch

- Status: completed
- Batch: Task 2 from `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
- Why this batch:
  - The compare route persists ready-state selections, so the saved-set route has real frontend-created data to render.
  - The authenticated list, reopen, and delete flow ships on top of the existing GraphQL contract.
  - The work stayed contained to the compare route modules, router/root registration, and focused frontend tests.

## Planned Follow-Up

- Follow-on route hardening moved to `docs/work/frontend-compare-saved-hardening.md`.
- Relay route-data adoption completed its queued transport-helper cleanup in `docs/work/frontend-relay-route-data.md`.
- `/compare/saved` still uses the explicit `saved-data.ts` manual helper; track any future saved-route Relay migration as a new route-data cleanup rather than as part of this completed saved-comparisons UI batch.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved-data.ts`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `sed -n '1,240p' assets/src/router.tsx`
- `sed -n '1,240p' assets/src/routes/root.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`
