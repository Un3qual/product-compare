# Frontend Route Mutation Error Shape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make route mutation error-message extraction trust only typed GraphQL mutation error payload entries.

**Architecture:** `routeMutationErrorMessage(...)` already owns route mutation error fallback behavior and uses `isRouteRecord(...)` to reject non-record entries. This batch tightens the local typed-error guard so route-level compare mutations only surface messages from entries matching the GraphQL typed mutation error contract.

**Tech Stack:** Bun, TypeScript, React Router route helpers, Relay, Vitest.

---

## File Structure

- `assets/src/routes/route-errors.ts`: shared route mutation error fallback and typed error entry validation.
- `assets/src/routes/__tests__/route-errors.test.ts`: focused shared route error helper coverage.
- `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`: compare save mutation feedback coverage.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx`: compare route integration coverage.
- `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`: saved-comparison delete mutation feedback coverage.
- `docs/work/frontend-route-mutation-error-shape.md`: source-of-truth work record for this batch.

## Task 1: Route Mutation Error Shape

**Files:**
- Modify: `assets/src/routes/route-errors.ts`
- Modify: `assets/src/routes/__tests__/route-errors.test.ts`
- Verify: `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Verify: `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-route-mutation-error-shape.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing typed-error shape coverage**

Add focused coverage proving `routeMutationErrorMessage(...)` rejects message-only records and records with non-string `field` values.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts
```

Expected: FAIL because the current guard accepts any route record with a string `message`.

- [x] **Step 3: Tighten route mutation error validation**

Update `isRouteMutationError(...)` in `route-errors.ts` to require:
- `code` is a string
- `message` is a string
- `field` is undefined, null, or a string

- [x] **Step 4: Run focused compare mutation verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
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
