# Frontend Route Form Data Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize repeated string form-value extraction in frontend route submit handlers.

**Architecture:** Relay-backed auth routes own browser UX and submit GraphQL mutations. Shared route helpers should carry repeated route-level plumbing so each route handler stays focused on mutation-specific variables and result handling.

**Tech Stack:** TypeScript, React Router, Relay, Vitest.

---

## File Structure

- `assets/src/routes/form-data.ts`: shared route form-data helpers.
- `assets/src/routes/__tests__/form-data.test.ts`: focused helper coverage.
- `assets/src/routes/auth/login.tsx`: login submit variables.
- `assets/src/routes/auth/register.tsx`: register submit variables.
- `assets/src/routes/auth/forgot-password.tsx`: forgot-password submit variables.
- `assets/src/routes/auth/reset-password.tsx`: reset-password submit variables.
- `docs/work/frontend-route-form-data-helper.md`: source-of-truth work record for this batch.

## Task 1: Route Form Data Helper Adoption

**Files:**
- Create: `assets/src/routes/form-data.ts`
- Create: `assets/src/routes/__tests__/form-data.test.ts`
- Modify: `assets/src/routes/auth/login.tsx`
- Modify: `assets/src/routes/auth/register.tsx`
- Modify: `assets/src/routes/auth/forgot-password.tsx`
- Modify: `assets/src/routes/auth/reset-password.tsx`
- Create: `docs/work/frontend-route-form-data-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `routeFormValue/2` returns string values, defaults missing values to an empty string, and avoids stringifying `File` values.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/form-data.test.ts
```

Expected: FAIL because the new helper file is not implemented yet.

- [x] **Step 3: Implement the shared form-data helper**

Add `routeFormValue/2` to `assets/src/routes/form-data.ts`.

- [x] **Step 4: Replace auth route-local form string extraction**

Update login, register, forgot-password, and reset-password submit handlers to use `routeFormValue(...)`.

- [x] **Step 5: Run focused auth route verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/form-data.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx
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
