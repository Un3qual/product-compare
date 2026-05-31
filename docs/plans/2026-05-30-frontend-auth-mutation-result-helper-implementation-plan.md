# Frontend Auth Mutation Result Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize Relay auth mutation result normalization so auth routes stop repeating top-level GraphQL error and payload normalization logic.

**Architecture:** Keep transport-error formatting in `assets/src/routes/auth/errors.ts`, and add small result helpers that compose Relay top-level GraphQL error handling with the existing session/action payload normalizers. Route components remain responsible for form state and navigation, while the shared helper owns the result boundary.

**Tech Stack:** Bun, React, React Router, Relay mutations, TypeScript, Vitest.

---

## File Structure

- `assets/src/routes/auth/errors.ts`: shared auth mutation error, payload, and result normalization.
- `assets/src/routes/auth/__tests__/errors.test.ts`: focused unit coverage for shared auth result helpers.
- `assets/src/routes/auth/login.tsx`: login route Relay mutation completion handling.
- `assets/src/routes/auth/register.tsx`: registration route Relay mutation completion handling.
- `assets/src/routes/auth/forgot-password.tsx`: forgot-password route Relay mutation completion handling.
- `assets/src/routes/auth/reset-password.tsx`: reset-password route Relay mutation completion handling.
- `assets/src/routes/auth/verify-email.tsx`: verify-email token consumption Relay mutation completion handling.
- `docs/work/frontend-auth-mutation-results.md`: source-of-truth work record for this batch.

## Task 1: Auth Mutation Result Helper

**Files:**
- Modify: `assets/src/routes/auth/errors.ts`
- Modify: `assets/src/routes/auth/__tests__/errors.test.ts`
- Modify: `assets/src/routes/auth/login.tsx`
- Modify: `assets/src/routes/auth/register.tsx`
- Modify: `assets/src/routes/auth/forgot-password.tsx`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Create: `docs/work/frontend-auth-mutation-results.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing shared-result coverage**

Add tests that call `resolveSessionMutationResult(...)` and `resolveActionMutationResult(...)`. The session test should prove top-level Relay GraphQL errors become a session failure with the shared transport fallback message. The action test should prove a successful action payload is preserved when no top-level GraphQL errors are present.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts
```

Expected: FAIL because `resolveSessionMutationResult` and `resolveActionMutationResult` are not exported yet.

- [x] **Step 3: Implement the result helpers**

Add these helper shapes in `assets/src/routes/auth/errors.ts`:

```ts
export function resolveSessionMutationResult(
  payload: unknown,
  graphQLErrors: readonly unknown[] | null | undefined
): AuthSessionResult {
  const graphQLError = relayGraphQLError(graphQLErrors);

  if (graphQLError) {
    return { viewer: null, errors: [graphQLError] };
  }

  return normalizeSessionPayload(payload);
}

export function resolveActionMutationResult(
  payload: unknown,
  graphQLErrors: readonly unknown[] | null | undefined
): AuthActionResult {
  const graphQLError = relayGraphQLError(graphQLErrors);

  if (graphQLError) {
    return { ok: false, errors: [graphQLError] };
  }

  return normalizeActionPayload(payload);
}
```

- [x] **Step 4: Run the helper test to verify green**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts
```

Expected: PASS.

- [x] **Step 5: Route auth mutations through the helpers**

Replace local `relayGraphQLError(...)` plus payload-normalizer composition in login, register, forgot-password, reset-password, and verify-email with `resolveSessionMutationResult(...)` or `resolveActionMutationResult(...)`.

- [x] **Step 6: Run focused auth route verification**

Run:

```bash
cd assets && bun x vitest run src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx
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
