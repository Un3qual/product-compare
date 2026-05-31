# Frontend Route Mutation Promise Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize promise-based Relay route mutation handling for routes that need to await one-shot mutation completion.

**Architecture:** Browser auth flows use Relay mutations over `/api/graphql`, and route-level helpers should carry repeated transport plumbing while routes own UX state and payload interpretation.

**Tech Stack:** TypeScript, React Router, Relay, Vitest.

---

## File Structure

- `assets/src/routes/relay-mutations.ts`: shared route Relay mutation helpers.
- `assets/src/routes/__tests__/relay-mutations.test.ts`: focused helper coverage.
- `assets/src/routes/auth/verify-email.tsx`: verify-email single-use token flow.
- `docs/work/frontend-route-mutation-promise-helper.md`: source-of-truth work record for this batch.

## Task 1: Route Mutation Promise Helper Adoption

**Files:**
- Modify: `assets/src/routes/relay-mutations.ts`
- Modify: `assets/src/routes/__tests__/relay-mutations.test.ts`
- Modify: `assets/src/routes/auth/verify-email.tsx`
- Create: `docs/work/frontend-route-mutation-promise-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving a promise-returning route mutation helper resolves completed Relay responses with GraphQL errors, rejects Relay `onError` failures, and rejects synchronous commit failures.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts
```

Expected: FAIL because the promise helper is not implemented yet.

- [x] **Step 3: Implement the shared promise helper**

Add the promise-returning helper beside `commitRouteMutation(...)` and route synchronous commit failures through rejection.

- [x] **Step 4: Replace verify-email route-local promise plumbing**

Update `verifyEmailOnce(...)` to use the shared helper while preserving request caching, failed-result eviction, and transport error handling.

- [x] **Step 5: Run focused auth route verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/relay-mutations.test.ts src/routes/auth/__tests__/recovery.route.test.tsx
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
