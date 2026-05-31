# Frontend Route Mutation Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize route-local Relay mutation error message fallback handling for compare routes.

**Architecture:** Keep route components responsible for success/failure state transitions, but move first typed mutation error message extraction into `assets/src/routes/route-errors.ts` beside the default route fallback message. Compare save and saved-set delete flows call the shared helper for typed payload failures while keeping transport errors on the default fallback.

**Tech Stack:** Bun, React, React Router, Relay mutations, TypeScript, Vitest.

---

## File Structure

- `assets/src/routes/route-errors.ts`: shared route-level fallback message and typed mutation error message helper.
- `assets/src/routes/__tests__/route-errors.test.ts`: focused helper coverage.
- `assets/src/routes/compare/index.tsx`: compare save mutation feedback.
- `assets/src/routes/compare/saved.tsx`: saved-set delete mutation feedback.
- `docs/work/frontend-route-mutation-error-helper.md`: source-of-truth work record for this batch.

## Task 1: Route Mutation Error Message Helper

**Files:**
- Modify: `assets/src/routes/route-errors.ts`
- Create: `assets/src/routes/__tests__/route-errors.test.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/saved.tsx`
- Create: `docs/work/frontend-route-mutation-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `routeMutationErrorMessage(...)` returns the first typed mutation error message and falls back to `DEFAULT_ROUTE_ERROR_MESSAGE` when errors are missing, empty, malformed, or message-less.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts
```

Expected: FAIL because `routeMutationErrorMessage` is not exported yet.

- [x] **Step 3: Implement the shared helper**

Add `routeMutationErrorMessage(errors)` to `assets/src/routes/route-errors.ts`. It should accept unknown input, return the first object-shaped string `message`, and otherwise return `DEFAULT_ROUTE_ERROR_MESSAGE`.

- [x] **Step 4: Run helper test to verify green**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts
```

Expected: PASS.

- [x] **Step 5: Replace route-local mutation error fallback duplication**

Update `assets/src/routes/compare/index.tsx` and `assets/src/routes/compare/saved.tsx` to use `routeMutationErrorMessage(payload?.errors)` for typed mutation payload failures.

- [x] **Step 6: Run focused compare verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
```

Expected: PASS.

- [x] **Step 7: Run final verification**

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
