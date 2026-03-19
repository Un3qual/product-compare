# Frontend Saved Comparisons UI Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-03-19 at `a194ef0` + working tree
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

- `assets/src/routes/compare/api.ts` still loads compared products by repeated `slug` query params and now also exposes a compare-local `createSavedComparisonSet(...)` helper for the GraphQL save mutation.
- `assets/src/routes/compare/index.tsx` now renders a ready-state `Save comparison` action that submits the current product relay IDs with a derived saved-set name and reports local success/error feedback.
- `assets/src/routes/compare/saved.tsx` now renders `/compare/saved`, loads `mySavedComparisonSets`, reopens sets back into `/compare`, deletes owned sets, and prompts unauthenticated users to sign in.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` now covers the compare save action plus saved-set loader, reopen, delete, and unauthorized states.
- `assets/src/router.tsx` now mounts both `/compare` and `/compare/saved`.
- `assets/src/routes/root.tsx` now links to `Saved comparisons` from both the primary navigation and home actions.

## Next Batch

- Status: completed
- Batch: Task 2 from `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
- Why this batch:
  - The compare route now persists ready-state selections, so the saved-set route has real frontend-created data to render.
  - The authenticated list, reopen, and delete flow now ships on top of the existing GraphQL contract.
  - The work stayed contained to the compare route modules, router/root registration, and focused frontend tests.

## Planned Follow-Up

- Follow-on quality hardening moved to `docs/work/frontend-compare-saved-hardening.md`.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/api.ts`
- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `sed -n '1,240p' assets/src/router.tsx`
- `sed -n '1,240p' assets/src/routes/root.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`
