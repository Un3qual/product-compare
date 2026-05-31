# Frontend Route Mutation Record Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make route mutation error entry validation use the shared route record guard.

**Architecture:** Route payload normalization already centralizes unknown-object checks in `assets/src/routes/route-records.ts`. This batch routes `routeMutationErrorMessage(...)` through that helper so malformed array-shaped error entries are rejected consistently with the rest of route payload parsing.

**Tech Stack:** Bun, TypeScript, React Router route helpers, Vitest.

---

## File Structure

- `assets/src/routes/route-errors.ts`: shared route mutation error-message fallback handling.
- `assets/src/routes/route-records.ts`: shared route-level unknown-object guard.
- `assets/src/routes/__tests__/route-errors.test.ts`: focused mutation error-message normalization coverage.
- `assets/src/routes/__tests__/route-records.test.ts`: focused route record guard coverage.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx`: compare route mutation behavior coverage.
- `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`: saved-comparison delete mutation behavior coverage.
- `docs/work/frontend-route-mutation-record-guard.md`: source-of-truth work record for this batch.

## Task 1: Route Mutation Error Record Guard

**Files:**
- Modify: `assets/src/routes/route-errors.ts`
- Modify: `assets/src/routes/__tests__/route-errors.test.ts`
- Verify: `assets/src/routes/__tests__/route-records.test.ts`
- Verify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-route-mutation-record-guard.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing route error coverage**

Add focused coverage proving `routeMutationErrorMessage(...)` rejects array-shaped payload entries even when they carry a string `message` property.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts
```

Expected: FAIL because the route mutation error guard still accepts any object with a string `message`, including arrays with extra properties.

- [x] **Step 3: Use the shared route record guard**

Import `isRouteRecord` from `./route-records` in `route-errors.ts` and make `isRouteMutationError(...)` return true only for route records with a string `message`.

- [x] **Step 4: Run focused route verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/__tests__/route-records.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
```

Expected: PASS.

- [x] **Step 5: Run final verification**

Run:

```bash
cd assets && bun run check
mix test
mix format --check-formatted
mix compile --warnings-as-errors
mix typecheck
git diff --check
```

Expected: PASS.
