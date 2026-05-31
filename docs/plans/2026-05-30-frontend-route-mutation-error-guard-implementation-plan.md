# Frontend Route Mutation Error Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Share typed GraphQL mutation error entry validation across route mutation feedback and browser auth mutation normalization.

**Architecture:** `route-errors.ts` already owns route mutation fallback behavior and now has the correct typed mutation error shape check. This batch exports that guard and type, then routes browser auth error normalization through it to remove duplicate payload validation logic.

**Tech Stack:** Bun, TypeScript, React Router route helpers, Relay, Vitest.

---

## File Structure

- `assets/src/routes/route-errors.ts`: shared route error fallback, top-level GraphQL error detection, and typed mutation error guard.
- `assets/src/routes/auth/errors.ts`: browser auth mutation payload normalization.
- `assets/src/routes/__tests__/route-errors.test.ts`: focused shared route error helper coverage.
- `assets/src/routes/auth/__tests__/errors.test.ts`: focused browser auth mutation normalization coverage.
- `assets/src/routes/auth/__tests__/session.route.test.tsx`: browser auth session mutation route coverage.
- `assets/src/routes/auth/__tests__/recovery.route.test.tsx`: browser auth recovery mutation route coverage.
- `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`: compare save mutation feedback coverage.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx`: compare route integration coverage.
- `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`: saved-comparison delete mutation feedback coverage.
- `docs/work/frontend-route-mutation-error-guard.md`: source-of-truth work record for this batch.

## Task 1: Route Mutation Error Guard

**Files:**
- Modify: `assets/src/routes/route-errors.ts`
- Modify: `assets/src/routes/auth/errors.ts`
- Modify: `assets/src/routes/__tests__/route-errors.test.ts`
- Verify: `assets/src/routes/auth/__tests__/errors.test.ts`
- Verify: `assets/src/routes/auth/__tests__/session.route.test.tsx`
- Verify: `assets/src/routes/auth/__tests__/recovery.route.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-route-mutation-error-guard.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing shared guard coverage**

Add focused coverage proving `isRouteMutationError(...)` is exported and accepts/rejects the typed GraphQL mutation error shape.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts
```

Expected: FAIL because `isRouteMutationError(...)` is currently private.

- [x] **Step 3: Export the shared guard and type**

Export `RouteMutationError` and `isRouteMutationError(...)` from `route-errors.ts`.

- [x] **Step 4: Replace auth-local mutation error validation**

In `assets/src/routes/auth/errors.ts`, import the shared type and guard, alias `MutationError` to `RouteMutationError`, and remove the private duplicate `isMutationError(...)` guard.

- [x] **Step 5: Run focused route/auth/compare verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
```

Expected: PASS.

- [x] **Step 6: Run final verification**

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
