# Frontend Route Mutation GraphQL Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make compare route mutation feedback handle Relay top-level GraphQL errors before trusting partial mutation payloads.

**Architecture:** `/compare` and `/compare/saved` are Relay-backed frontend mutation surfaces. Shared route helpers should own common mutation error-shaping behavior so routes do not drift from auth mutation transport semantics.

**Tech Stack:** TypeScript, React Router, Relay, Vitest.

---

## File Structure

- `assets/src/routes/route-errors.ts`: shared route error helpers.
- `assets/src/routes/__tests__/route-errors.test.ts`: focused helper coverage.
- `assets/src/routes/compare/index.tsx`: compare save mutation feedback.
- `assets/src/routes/compare/saved.tsx`: saved comparison delete mutation feedback.
- `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`: compare save feedback coverage.
- `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`: saved comparisons delete feedback coverage.
- `docs/work/frontend-route-mutation-graphql-errors.md`: source-of-truth work record for this batch.

## Task 1: Compare Route Mutation GraphQL Error Handling

**Files:**
- Modify: `assets/src/routes/route-errors.ts`
- Modify: `assets/src/routes/__tests__/route-errors.test.ts`
- Modify: `assets/src/routes/compare/index.tsx`
- Modify: `assets/src/routes/compare/saved.tsx`
- Modify: `assets/src/routes/compare/__tests__/compare-save-feedback.test.tsx`
- Modify: `assets/src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- Create: `docs/work/frontend-route-mutation-graphql-errors.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper and route coverage**

Add tests proving top-level Relay GraphQL errors force the generic route mutation error message even when typed payload errors or success payload IDs are present.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
```

Expected: FAIL because compare mutation helpers and routes ignore top-level Relay GraphQL errors.

- [x] **Step 3: Extend the route mutation error helper**

Update `routeMutationErrorMessage(...)` to accept optional Relay GraphQL errors and return the generic fallback whenever top-level errors are present.

- [x] **Step 4: Route compare mutations through the helper semantics**

Update `/compare` save and `/compare/saved` delete completion handlers to check top-level GraphQL errors before treating payload IDs as success.

- [x] **Step 5: Run focused verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-errors.test.ts src/routes/compare/__tests__/compare-save-feedback.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
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
