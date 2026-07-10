# Frontend Saved Comparisons UI Work Doc

## Snapshot

- Status: ready (saved product labels; prior batches complete)
- Priority: P2
- Source of truth: this file
- Last verified: 2026-06-29 after saved-comparisons return-flow verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/plans/INDEX.md`
  - `docs/plans/2026-03-05-frontend-fullstack-design.md`
  - `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
  - `docs/work/frontend-relay-route-data.md`
  - `docs/work/frontend-compare-saved-hardening.md`
  - `docs/work/saved-comparisons-backend.md`
- Recently completed implementation plan:
  - `docs/plans/2026-06-27-project-saved-comparisons-client-filter-implementation-plan.md`
- Recently completed usable-product plan:
  - `docs/plans/2026-06-29-saved-comparisons-return-flow-implementation-plan.md`
- Definition of done:
  - The compare route can save a ready-state selection through the GraphQL saved-comparison mutation.
  - The frontend exposes a saved-comparisons route for authenticated users.
  - Saved sets can be reopened into `/compare` using repeated `slug` query params and deleted from the UI.
  - Focused frontend tests cover save, list, reopen, and delete states without reopening unrelated route work.

## Ready Saved Product Labels Follow-Up

- Status: ready.
- Plan:
  `docs/plans/2026-07-10-saved-comparison-product-labels-implementation-plan.md`.
- Verified gap: `SavedComparisonsRouteQuery` selects product slugs but not names,
  and saved-set cards render the raw comma-separated slug list as shopper copy.
- Owned paths:
  - `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts`
  - `assets/src/routes/compare/saved-data.ts`
  - `assets/src/routes/compare/saved.tsx`
  - `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts`
  - `assets/test/routes/compare/compare.route.test.tsx`
  - `docs/work/frontend-saved-comparisons-ui.md`
- Verification:
  - `cd assets && bun run relay`
  - `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "saved comparison.*product|stored position order"`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: saved comparison cards display ordered product names and
  reopen the exact stored slug order with current auth, pagination, filtering,
  sorting, and delete behavior intact.

## Current Usable Product Batch

- Status: done.
- Plan:
  `docs/plans/2026-06-29-saved-comparisons-return-flow-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/saved.tsx`
  - `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `docs/work/frontend-saved-comparisons-ui.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/compare/saved` makes reopen, delete, browse, and compare
  return paths clear while preserving existing auth and delete behavior.
- Completed implementation:
  - Saved-set cards now show singular/plural product counts derived from the
    saved slug list.
  - Reopen and delete controls remain on each card, with scoped action grouping
    while preserving the existing reopen URL and delete mutation behavior.
  - Empty and filtered no-match states now link back to product browsing and a
    fresh comparison start.
- Completed verification:
  - RED:
    `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
    - 20 tests, 4 expected failures, 16 passed. The failures showed missing
    product-count summaries, scoped reopen/delete actions, and empty/no-match
    return links.
  - GREEN:
    `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
    - 20 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Completed Product-Facing Batch

- Status: done.
- Plan:
  `docs/plans/2026-07-02-saved-comparisons-sort-controls-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/saved.tsx`
  - `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `assets/test/routes/compare/saved-comparisons-test-helpers.ts`
  - `docs/work/frontend-saved-comparisons-ui.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/compare/saved` can sort loaded saved sets by current order,
  name, and product count without changing backend saved-comparison contracts.

### Saved Comparisons Sort Controls Evidence

- Completed implementation:
  - `/compare/saved` now renders an authenticated sort control for loaded saved
    comparison sets.
  - Saved sets can be sorted by current order, name A-Z, product count
    high-to-low, and product count low-to-high after local deletion and filter
    matching.
  - Sorting is applied to the merged loaded saved-set summary, not page-by-page
    Relay render output, so multi-page loaded results sort as one list.
  - Reopen URLs and row-scoped delete pending state remain tied to the saved set
    after sort changes.
- Completed verification:
  - RED:
    `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
    - 25 tests, 5 expected failures, 20 passed. The failures showed the missing
      `Sort saved comparisons` combobox.
  - GREEN:
    `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
    - 26 tests, 0 failures, including a Relay-backed multi-page sort
      regression.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `cd assets && bun run --bun typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Current Cross-Project Batch

- Status: done.
- Plan: `docs/plans/2026-06-27-project-saved-comparisons-client-filter-implementation-plan.md`.
- Owned paths:
  - `assets/src/routes/compare/saved.tsx`
  - `assets/test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `assets/test/routes/compare/saved-comparisons-test-helpers.ts`
  - `docs/work/frontend-saved-comparisons-ui.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: `/compare/saved` can filter loaded saved sets by name or product slug without backend changes.
- Completed verification:
  - `cd assets && bun x vitest run test/routes/compare/saved-comparisons-route-state.test.tsx` - 15 tests, 0 failures.
  - `cd assets && bun run typecheck` - completed with exit 0.
  - `git diff --check` - completed with exit 0.

## Verified Current State

- `assets/src/routes/compare/api.ts` has been removed. `/compare` now loads selected products through Relay preloaded route queries and saves ready selections through `CreateSavedComparisonSetMutation`.
- `assets/src/routes/compare/saved-data.ts` now owns saved-route loader orchestration, pagination guards, unauthorized detection, and Relay page summarization without raw saved-comparison GraphQL strings.
- `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts` and `assets/src/routes/compare/mutations/DeleteSavedComparisonSetMutation.ts` define the saved-list query and delete mutation Relay sources.
- `assets/src/routes/compare/index.tsx` renders a ready-state `Save comparison` action that submits the current product relay IDs with a derived saved-set name and reports local success/error feedback.
- `assets/src/routes/compare/saved.tsx` renders `/compare/saved`, reads saved-set rows from Relay preloaded query data with loader summaries as fallback, reopens sets back into `/compare`, deletes owned sets through `useMutation(DeleteSavedComparisonSetMutation)`, and prompts unauthenticated users to sign in.
- `assets/src/routes/compare/saved.tsx` now filters loaded saved sets client-side by saved-set name or product slug and renders a distinct no-match state.
- `assets/src/routes/compare/saved.tsx` now summarizes saved-set product counts,
  scopes reopen/delete actions per card, and gives empty or filtered no-match
  states direct return links to `/products` and `/compare`.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx` covers the compare save action plus saved-set loader, reopen, delete, unauthorized, and error-boundary states.
- `assets/test/routes/compare/saved-comparisons-route-state.test.tsx` covers saved-set name filtering, slug filtering, no-match state, and delete behavior after filtering.
- `assets/src/router.tsx` mounts both `/compare` and `/compare/saved` with compare-scoped route error boundaries.
- `assets/src/routes/root.tsx` links to `Saved comparisons` from both the primary navigation and home actions.

## Previous Batch

- Status: completed
- Batch: Task 2 from `docs/plans/2026-03-18-frontend-saved-comparisons-ui-implementation-plan.md`
- Why this batch:
  - The compare route persists ready-state selections, so the saved-set route has real frontend-created data to render.
  - The authenticated list, reopen, and delete flow ships on top of the existing GraphQL contract.
  - The work stayed contained to the compare route modules, router/root registration, and focused frontend tests.

## Planned Follow-Up

- Follow-on route hardening moved to `docs/work/frontend-compare-saved-hardening.md`.
- Relay route-data adoption completed its queued transport-helper cleanup in `docs/work/frontend-relay-route-data.md`.
- The saved-route Relay migration completed in `docs/work/frontend-saved-comparisons-relay-migration.md`; no additional saved-comparisons UI follow-up is queued from this completed work item.
- The 2026-06-27 saved-comparison client filter follow-up is complete.

## Verification Commands

- `sed -n '1,260p' assets/src/routes/compare/index.tsx`
- `sed -n '1,260p' assets/src/routes/compare/saved-data.ts`
- `sed -n '1,260p' assets/src/routes/compare/saved.tsx`
- `sed -n '1,260p' assets/src/routes/compare/__tests__/compare.route.test.tsx`
- `sed -n '1,240p' assets/src/router.tsx`
- `sed -n '1,240p' assets/src/routes/root.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run src/routes/compare/__tests__/compare.route.test.tsx src/routes/__tests__/root.route.test.tsx`
- `cd assets && /opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`
