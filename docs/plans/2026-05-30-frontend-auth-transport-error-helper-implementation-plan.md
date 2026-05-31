# Frontend Auth Transport Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize auth route transport-error array construction in `assets/src/routes/auth/errors.ts`.

**Architecture:** Auth routes own route-local form state, redirects, request-version guards, and success messages. The shared auth helper module owns mutation payload/result normalization and should also own the standard transport-error list shape used by those routes.

**Tech Stack:** Bun, React, React Router, Relay mutations, TypeScript, Vitest.

---

## File Structure

- `assets/src/routes/auth/errors.ts`: shared auth mutation error, payload, result, and transport-error normalization.
- `assets/src/routes/auth/__tests__/errors.test.ts`: focused unit coverage for shared auth error helpers.
- `assets/src/routes/auth/login.tsx`: login route transport failure handling.
- `assets/src/routes/auth/register.tsx`: registration route transport failure handling.
- `assets/src/routes/auth/forgot-password.tsx`: forgot-password route transport failure handling.
- `assets/src/routes/auth/reset-password.tsx`: reset-password route transport failure handling.
- `assets/src/routes/auth/verify-email.tsx`: verify-email token consumption transport failure handling.
- `docs/work/frontend-auth-transport-errors.md`: source-of-truth work record for this batch.

## Task 1: Auth Transport Error List Helper

**Files:**
- Modify: `assets/src/routes/auth/errors.ts`
- Modify: `assets/src/routes/auth/__tests__/errors.test.ts`
- Modify: `assets/src/routes/auth/login.tsx`
- Modify: `assets/src/routes/auth/register.tsx`
- Modify: `assets/src/routes/auth/forgot-password.tsx`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Create: `docs/work/frontend-auth-transport-errors.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add a focused test proving `transportMutationErrors(error)` returns the single shared transport mutation error list.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts
```

Expected: FAIL because `transportMutationErrors` is not exported yet.

- [x] **Step 3: Implement the helper**

Add `transportMutationErrors(error: unknown): MutationError[]` in `assets/src/routes/auth/errors.ts`, implemented through the existing `transportMutationError(error)` helper.

- [x] **Step 4: Replace route-local array construction**

Replace repeated `[transportMutationError(error)]` in login, register, forgot-password, reset-password, and verify-email with `transportMutationErrors(error)`.

- [x] **Step 5: Run focused auth route verification**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx
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
