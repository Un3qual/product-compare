# Frontend Saved Comparisons UI Work Doc

## Snapshot

- Status: blocked on frontend Relay route-data adoption
- Priority: P2
- Source of truth: this file
- Last verified: 2026-03-19 at `83a267a` + working tree
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - `docs/work/frontend-relay-route-data.md`
  - `docs/work/saved-comparisons-backend.md`
- Definition of done:
  - The compare route can save a ready-state selection through the GraphQL saved-comparison mutation.
  - The frontend exposes a saved-comparisons route for authenticated users.
  - Saved sets can be reopened into `/compare` using repeated `slug` query params and deleted from the UI.
  - Focused frontend tests cover save, list, reopen, and delete states without reopening unrelated route work.

## Verified Current State

- `assets/src/routes/compare/api.ts` still loads compared products by repeated `slug` query params and now also exposes a compare-local `createSavedComparisonSet(...)` helper for the GraphQL save mutation.
- `assets/src/routes/compare/index.tsx` now renders a ready-state `Save comparison` action that submits the current product relay IDs with a derived saved-set name and reports local success/error feedback.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` now covers the save-action mutation wiring alongside the existing compare loader and render states.
- `assets/src/router.tsx` still mounts `/compare` only; there is no `/compare/saved` route yet.
- `assets/src/routes/root.tsx` still links to `/compare` but not to any saved-set surface.
- The repo now has an active queue rebaseline in `docs/work/frontend-relay-route-data.md` so new compare-route work does not deepen the manual route-local GraphQL helper pattern.

## Next Batch

- Status: blocked by queue rebaseline
- Batch: Resume Task 2 from `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md` after `docs/work/frontend-relay-route-data.md` is complete
- Why this batch:
  - The compare route now persists ready-state selections, so the saved-set route still has real frontend-created data to render once resumed.
  - User-directed reprioritization moved Relay route-data adoption ahead of new compare-route surfaces so the saved-set route can land on the new Relay query/mutation path instead of the current manual helpers.
  - The backend contract remains ready; this is a frontend sequencing change, not a backend blocker.

## Planned Follow-Up

- Re-open this work item as the next frontend feature slice after the Relay adoption work doc closes.
- When resumed, rebaseline Task 2 onto the compare route's Relay query/mutation modules before adding `/compare/saved`.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/api.ts`
- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `sed -n '1,240p' assets/src/router.tsx`
- `sed -n '1,240p' assets/src/routes/root.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`
