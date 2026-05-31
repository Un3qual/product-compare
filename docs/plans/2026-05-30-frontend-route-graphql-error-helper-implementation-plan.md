# Frontend Route GraphQL Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize route-level top-level Relay GraphQL error presence checks.

**Architecture:** `assets/src/routes/route-errors.ts` already owns route mutation fallback messages and compare-route top-level GraphQL error detection. This batch adds a generic `hasRouteGraphQLErrors(...)` helper there and routes auth mutation result normalization through it so browser auth and compare mutation flows share the same top-level Relay error semantics.

**Tech Stack:** Bun, TypeScript, React Router route helpers, Relay, Vitest.

---

## File Structure

- `assets/src/routes/route-errors.ts`: shared route error fallback constants and top-level GraphQL error helpers.
- `assets/src/routes/auth/errors.ts`: browser auth mutation payload and top-level GraphQL error normalization.
- `assets/src/routes/__tests__/route-errors.test.ts`: focused shared route error helper coverage.
- `assets/src/routes/auth/__tests__/errors.test.ts`: focused browser auth mutation normalization coverage.
- `assets/src/routes/auth/__tests__/session.route.test.tsx`: browser auth session mutation route coverage.
- `assets/src/routes/auth/__tests__/recovery.route.test.tsx`: browser auth recovery mutation route coverage.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx`: compare save mutation route coverage.
- `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`: saved-comparison delete mutation route coverage.
- `docs/work/frontend-route-graphql-error-helper.md`: source-of-truth work record for this batch.

## Task 1: Route GraphQL Error Helper

**Files:**
- Modify: `assets/src/routes/route-errors.ts`
- Modify: `assets/src/routes/auth/errors.ts`
- Modify: `assets/src/routes/__tests__/route-errors.test.ts`
- Verify: `assets/src/routes/auth/__tests__/errors.test.ts`
- Verify: `assets/src/routes/auth/__tests__/session.route.test.tsx`
- Verify: `assets/src/routes/auth/__tests__/recovery.route.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-route-graphql-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing route helper coverage**

Add focused coverage proving `hasRouteGraphQLErrors(...)` returns true only for non-empty top-level GraphQL error arrays.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts
```

Expected: FAIL because `hasRouteGraphQLErrors(...)` is not exported yet.

- [x] **Step 3: Implement the shared helper**

Add `hasRouteGraphQLErrors(...)` to `route-errors.ts` and make `hasRouteMutationGraphQLErrors(...)` delegate to it for compatibility with existing compare route imports.

- [x] **Step 4: Replace auth-local top-level GraphQL error detection**

Import `hasRouteGraphQLErrors(...)` in `assets/src/routes/auth/errors.ts` and use it in `relayGraphQLError(...)` instead of duplicating the `Array.isArray(errors) && errors.length > 0` check.

- [x] **Step 5: Run focused route/auth verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
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
