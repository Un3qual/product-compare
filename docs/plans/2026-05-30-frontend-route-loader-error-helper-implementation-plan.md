# Frontend Route Loader Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize recoverable route-loader error handling for Relay-backed frontend loaders.

**Architecture:** Keep route-specific fallback data in each loader, but move the common abort-error rethrow and recoverable preload logging into `assets/src/routes/loader-errors.ts`. Catalog and product loaders call the shared helper from their catch blocks while preserving their current return shapes and console messages.

**Tech Stack:** Bun, React Router, Relay route loaders, TypeScript, Vitest.

---

## File Structure

- `assets/src/routes/loader-errors.ts`: shared route-loader abort and recoverable error helpers.
- `assets/src/routes/__tests__/loader-errors.test.ts`: focused helper coverage.
- `assets/src/routes/catalog/loader.ts`: catalog browse loader recoverable preload fallback.
- `assets/src/routes/products/loader.ts`: product detail and offers loader recoverable preload fallbacks.
- `docs/work/frontend-route-loader-error-helper.md`: source-of-truth work record for this batch.

## Task 1: Recoverable Loader Error Helper

**Files:**
- Modify: `assets/src/routes/loader-errors.ts`
- Modify: `assets/src/routes/__tests__/loader-errors.test.ts`
- Modify: `assets/src/routes/catalog/loader.ts`
- Modify: `assets/src/routes/products/loader.ts`
- Create: `docs/work/frontend-route-loader-error-helper.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing shared helper coverage**

Add tests proving `recoverRouteLoaderError(...)` returns the fallback and logs a recoverable error for ordinary errors, while rethrowing abort errors without logging.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts
```

Expected: FAIL because `recoverRouteLoaderError` is not exported yet.

- [x] **Step 3: Implement the shared helper**

Add `recoverRouteLoaderError<TFallback>(error, message, fallback)` to `assets/src/routes/loader-errors.ts`. It should rethrow abort errors, log `console.error(message, { error })` for other failures, and return the fallback.

- [x] **Step 4: Run helper test to verify green**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts
```

Expected: PASS.

- [x] **Step 5: Replace loader-local recoverable error handling**

Update `browseLoader`, `productDetailLoader`, and `preloadProductOffers` to use the shared helper from their catch blocks.

- [x] **Step 6: Run focused route-loader verification**

Run:

```bash
cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx
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
