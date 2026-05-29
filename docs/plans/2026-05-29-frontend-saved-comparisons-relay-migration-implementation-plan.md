# Frontend Saved Comparisons Relay Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/compare/saved` off manual GraphQL fetch helpers and onto the existing Relay route preload and mutation path.

**Architecture:** Keep React Router loaders responsible for route orchestration, pagination guards, unauthorized-state detection, and Relay preloading. Keep UI state local to `SavedComparisonsRoute`, but render saved-set rows from Relay route query records and later commit deletes through a Relay mutation.

**Tech Stack:** Bun, React 19, React Router v7 SSR, Relay, TypeScript, Vitest, GraphQL over `/api/graphql`.

---

## File Structure

- `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts`: new Relay query source for paginated `mySavedComparisonSets`.
- `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts`: generated Relay artifact from `bun run relay`.
- `assets/src/routes/compare/saved-data.ts`: retained during Task 1 for saved-route loader data types, pagination logic, unauthorized detection, and the still-manual delete helper.
- `assets/src/routes/compare/saved.tsx`: reads saved-set pages through Relay preloaded query descriptors while preserving current local delete feedback behavior.
- `assets/src/router.tsx`: continues mounting `/compare/saved` through `savedComparisonsLoader`.
- `assets/src/routes/compare/__tests__/compare-relay-migration.test.tsx`: focused route-data migration tests for the saved-list Relay query path.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx`: existing saved-route regression coverage updated to the Relay loader contract.
- `assets/src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`: unauthorized-loader coverage updated to the Relay error path.
- `docs/work/frontend-saved-comparisons-relay-migration.md`: source-of-truth lane doc for this follow-up.

## Task 1: Saved-Set List Query Relay Migration

**Files:**
- Create: `assets/src/routes/compare/queries/SavedComparisonsRouteQuery.ts`
- Generate: `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts`
- Modify: `assets/src/routes/compare/saved-data.ts`
- Modify: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare-relay-migration.test.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Modify: `assets/src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`
- Modify: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Modify: `docs/plans/NOW.md`

- [x] **Step 1: Write the failing Relay loader/render tests**

Add saved-route coverage that expects `savedComparisonsLoader` to call `fetchRouteQuery` with the router Relay environment and expects `SavedComparisonsRoute` to render saved-set rows from `useRoutePreloadedQuery` plus `usePreloadedQuery`.

- [x] **Step 2: Run the focused failing test**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx`

Expected: FAIL because `/compare/saved` still calls `fetchGraphQL(...)` directly and does not expose saved-route Relay query descriptors.

- [x] **Step 3: Add the Relay query source and generated artifact**

Create `SavedComparisonsRouteQuery` with `first` and `after` variables and fetch each saved set's `id`, `name`, ordered `items.position`, and `items.product.slug`.

Run: `cd assets && bun run relay`

Expected: PASS and create `assets/src/__generated__/SavedComparisonsRouteQuery.graphql.ts`.

- [x] **Step 4: Move saved-set list loading onto Relay route fetches**

Update `savedComparisonsLoader` to read the Relay environment from router context, page through `fetchRouteQuery`, retain pagination limits and cursor validation, return unauthorized status for auth failures, and include `savedSetQueries` descriptors in ready/empty loader data.

- [x] **Step 5: Render saved-set rows from Relay route query records**

Update `SavedComparisonsRoute` to wrap the ready state in `Suspense` and a resettable error boundary, render page rows from `useRoutePreloadedQuery` and `usePreloadedQuery`, and keep `loaderData.savedSets` as the fallback summary if the Relay read fails.

- [x] **Step 6: Run focused frontend verification**

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
cd assets && bun run typecheck
```

Expected: PASS.

## Task 2: Saved-Set Delete Mutation Relay Migration

**Files:**
- Create: `assets/src/routes/compare/mutations/DeleteSavedComparisonSetMutation.ts`
- Generate: `assets/src/__generated__/DeleteSavedComparisonSetMutation.graphql.ts`
- Modify: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/routes/compare/saved-data.ts`
- Modify: `assets/src/routes/compare/__tests__/compare-relay-migration.test.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Modify: `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- Modify: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Modify: `docs/plans/NOW.md`

- [ ] **Step 1: Write the failing delete mutation test**

Add coverage that clicks a saved-set delete button and expects `useMutation(DeleteSavedComparisonSetMutation)` to receive `savedComparisonSetId`, then verify success and typed error behavior still update the route UI.

- [ ] **Step 2: Run the focused failing delete test**

Run: `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`

Expected: FAIL because delete still calls the manual `deleteSavedComparisonSet(...)` helper.

- [ ] **Step 3: Add the Relay delete mutation source and generated artifact**

Create a Relay mutation for `deleteSavedComparisonSet(savedComparisonSetId:)` returning `savedComparisonSet.id` and typed `errors`.

Run: `cd assets && bun run relay`

Expected: PASS and create `assets/src/__generated__/DeleteSavedComparisonSetMutation.graphql.ts`.

- [ ] **Step 4: Commit deletes through Relay**

Update `SavedComparisonsRoute` to call `useMutation(DeleteSavedComparisonSetMutation)`, preserve duplicate-click suppression, per-row pending state, stale error clearing, successful local removal, and typed GraphQL error display.

- [ ] **Step 5: Remove the manual saved-data helper**

Delete the manual `fetchGraphQL(...)` mutation helper and any remaining raw saved-comparison GraphQL strings from `saved-data.ts`. If the file only holds loader types and helpers, keep it named until a later small cleanup would avoid churn.

- [ ] **Step 6: Run focused frontend verification**

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
cd assets && bun run typecheck
```

Expected: PASS.

## Task 3: Queue Handoff And Full Frontend Check

**Files:**
- Modify: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Modify: `docs/work/frontend-relay-route-data.md`
- Modify: `docs/work/frontend-saved-comparisons-ui.md`
- Modify: `docs/work/frontend-compare-saved-hardening.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`
- Modify: `ARCHITECTURE.md`

- [ ] **Step 1: Mark the saved-route Relay migration complete**

Record that `/compare/saved` uses Relay query/mutation APIs and no longer depends on raw saved-comparison GraphQL strings.

- [ ] **Step 2: Re-open or close dependent compare/saved follow-up docs**

If no additional compare/saved polish is queued, keep the lane complete. If a concrete UI hardening batch remains, add it as a separate next batch with owned paths and verification commands.

- [ ] **Step 3: Run full frontend verification**

Run:

```bash
cd assets && bun run relay
cd assets && bun run typecheck
cd assets && bun run test:unit
git diff --check
```

Expected: PASS.
