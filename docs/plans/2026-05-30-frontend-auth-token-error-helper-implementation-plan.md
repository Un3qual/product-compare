# Frontend Auth Token Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize route-specific missing auth token mutation error construction in `assets/src/routes/auth/errors.ts`.

**Architecture:** Browser auth routes use Relay over `/api/graphql`, and `assets/src/routes/auth/errors.ts` owns shared auth mutation error/result normalization. Token-link routes should share the typed `INVALID_TOKEN` error shape while preserving route-local copy and request behavior.

**Tech Stack:** Bun, React, React Router, Relay mutations, TypeScript, Vitest.

---

## File Structure

- `assets/src/routes/auth/errors.ts`: shared auth mutation error, payload, result, transport-error, action-success, and token-error helpers.
- `assets/src/routes/auth/__tests__/errors.test.ts`: focused unit coverage for shared auth error/result helpers.
- `assets/src/routes/auth/reset-password.tsx`: reset-password missing-token handling.
- `assets/src/routes/auth/verify-email.tsx`: verify-email missing-token handling and single-use token cache behavior.
- `docs/work/frontend-auth-token-error-helper.md`: source-of-truth work record for this batch.

## Task 1: Auth Token Error Helper

**Files:**
- Modify: `assets/src/routes/auth/errors.ts`
- Modify: `assets/src/routes/auth/__tests__/errors.test.ts`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Create: `docs/work/frontend-auth-token-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving `invalidTokenMutationError(message)` returns the shared typed `INVALID_TOKEN` error shape with `field: "token"` and the caller-provided route message.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts
```

Expected: FAIL because `invalidTokenMutationError` is not exported yet.

- [x] **Step 3: Implement the helper**

Add `invalidTokenMutationError(message: string): MutationError` in `assets/src/routes/auth/errors.ts`.

- [x] **Step 4: Replace route-local token error literals**

Use `invalidTokenMutationError(...)` in reset-password and verify-email while preserving route-specific messages, token guards, and verify-email request-cache behavior.

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
