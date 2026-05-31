# Frontend Auth Action Success Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize the successful auth action mutation predicate in `assets/src/routes/auth/errors.ts`.

**Architecture:** `assets/src/routes/auth/errors.ts` owns auth mutation result normalization. Route components should ask the shared helper whether an action result is successful instead of repeating the `ok` plus empty-error-list contract.

**Tech Stack:** Bun, React, React Router, Relay mutations, TypeScript, Vitest.

---

## File Structure

- `assets/src/routes/auth/errors.ts`: shared auth mutation error, payload, result, and transport-error normalization.
- `assets/src/routes/auth/__tests__/errors.test.ts`: focused unit coverage for shared auth error/result helpers.
- `assets/src/routes/auth/forgot-password.tsx`: forgot-password action success handling.
- `assets/src/routes/auth/reset-password.tsx`: reset-password action success handling.
- `assets/src/routes/auth/verify-email.tsx`: verify-email action success handling and single-use token cache eviction.
- `docs/work/frontend-auth-action-success.md`: source-of-truth work record for this batch.

## Task 1: Auth Action Success Helper

**Files:**
- Modify: `assets/src/routes/auth/errors.ts`
- Modify: `assets/src/routes/auth/__tests__/errors.test.ts`
- Modify: `assets/src/routes/auth/forgot-password.tsx`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Create: `docs/work/frontend-auth-action-success.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving `isSuccessfulActionResult(result)` returns true only when `result.ok` is true and the typed error list is empty.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts
```

Expected: FAIL because `isSuccessfulActionResult` is not exported yet.

- [x] **Step 3: Implement the helper**

Add `isSuccessfulActionResult(result: AuthActionResult): boolean` in `assets/src/routes/auth/errors.ts`.

- [x] **Step 4: Replace route-local action success predicates**

Use `isSuccessfulActionResult(result)` in forgot-password, reset-password, and verify-email, including verify-email request-cache eviction logic.

- [x] **Step 5: Run focused auth route verification**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/recovery.route.test.tsx
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
