# Frontend Route Loader Thrown Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize route-loader thrown-error normalization in `assets/src/routes/loader-errors.ts`.

**Architecture:** `loader-errors.ts` already owns shared route-loader abort detection and recoverable fallback behavior. This batch adds a small helper for loaders that must rethrow failed preload work, preserving abort and `Error` objects while wrapping non-`Error` rejection reasons with a stable message and cause.

**Tech Stack:** React Router route loaders, Relay route preloading, Vitest, TypeScript.

---

## File Structure

- `assets/src/routes/loader-errors.ts`: shared route-loader error helpers.
- `assets/src/routes/__tests__/loader-errors.test.ts`: focused helper coverage.
- `assets/src/routes/compare/loader.ts`: compare route loader that rethrows parallel product fetch failures.
- `assets/src/routes/compare/__tests__/compare.route.test.tsx`: compare loader behavior coverage.
- `docs/work/frontend-route-loader-thrown-error-helper.md`: source-of-truth work record for this batch.

## Task 1: Route Loader Thrown Error Helper

**Files:**
- Modify: `assets/src/routes/loader-errors.ts`
- Modify: `assets/src/routes/__tests__/loader-errors.test.ts`
- Modify: `assets/src/routes/compare/loader.ts`
- Verify: `assets/src/routes/compare/__tests__/compare.route.test.tsx`
- Create: `docs/work/frontend-route-loader-thrown-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing helper coverage**

Add focused coverage proving the shared helper returns abort-like values unchanged, returns `Error` instances unchanged, and wraps non-`Error` rejection reasons with the provided message and original cause.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts
```

Expected: FAIL because the shared thrown-error helper is not implemented yet.

- [x] **Step 3: Implement the shared helper**

Add `normalizeRouteLoaderThrownError(error, message)` to `assets/src/routes/loader-errors.ts`.

- [x] **Step 4: Replace compare-loader local normalization**

Use `normalizeRouteLoaderThrownError(...)` in `assets/src/routes/compare/loader.ts` and remove the route-local helper/import dependency that only supported that helper.

- [x] **Step 5: Run focused route-loader verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx
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
