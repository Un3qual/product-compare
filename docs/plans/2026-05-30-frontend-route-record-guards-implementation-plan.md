# Frontend Route Record Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize route-level unknown-object guards used by Relay route payload parsing.

**Architecture:** Add a small `isRouteRecord(...)` helper under `assets/src/routes/` for route boundary payload normalization. Auth mutation result normalization and saved-comparison route data parsing should import it instead of carrying local duplicate `isRecord(...)` helpers.

**Tech Stack:** Bun, TypeScript, React Router route loaders, Relay, Vitest.

---

## File Structure

- `assets/src/routes/route-records.ts`: shared route payload record guard.
- `assets/src/routes/__tests__/route-records.test.ts`: focused helper coverage.
- `assets/src/routes/auth/errors.ts`: browser auth mutation payload normalization.
- `assets/src/routes/compare/saved-data.ts`: saved-comparison route query response parsing and auth error detection.
- `docs/work/frontend-route-record-guards.md`: source-of-truth work record for this batch.

## Task 1: Route Record Guard Helper

**Files:**
- Create: `assets/src/routes/route-records.ts`
- Create: `assets/src/routes/__tests__/route-records.test.ts`
- Modify: `assets/src/routes/auth/errors.ts`
- Modify: `assets/src/routes/compare/saved-data.ts`
- Create: `docs/work/frontend-route-record-guards.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add tests proving `isRouteRecord(...)` accepts object-shaped route payloads and rejects nullish values, primitives, arrays, and functions.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts
```

Expected: FAIL because `route-records.ts` does not exist yet.

- [x] **Step 3: Implement the shared helper**

Add `isRouteRecord(value)` to `assets/src/routes/route-records.ts` using the current route-local semantics: truthy object and not an array.

- [x] **Step 4: Run helper test to verify green**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts
```

Expected: PASS.

- [x] **Step 5: Replace route-local record guard duplication**

Update `assets/src/routes/auth/errors.ts` and `assets/src/routes/compare/saved-data.ts` to import `isRouteRecord(...)`, use it for unknown payload checks, and remove their local duplicate `isRecord(...)` helpers.

- [x] **Step 6: Run focused route payload verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
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
