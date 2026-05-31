# Frontend Route Loader Context Invariants Implementation Plan

> **For agentic workers:** This was a narrow review-driven cleanup selected after the active frontend/backend queues were complete. Use this plan as the implementation record, not as an ongoing queued batch.

**Goal:** Keep Relay route-loader configuration failures visible by making the catalog browse loader fail fast when the Relay router context is missing, matching the product, compare, and saved-comparisons loaders.

**Architecture:** React Router loaders receive the request-scoped Relay environment through `createRelayRouterContext(...)`. Recoverable network/query preload failures can render route-local unavailable states, but missing router context is an application wiring invariant and should not be hidden as a user-facing catalog outage.

**Tech Stack:** Bun, React Router v7 SSR, Relay route preload, TypeScript, Vitest.

---

## File Structure

- `assets/src/routes/catalog/loader.ts`: catalog browse route loader and Relay preload orchestration.
- `assets/src/routes/catalog/__tests__/browse.route.test.tsx`: focused catalog loader and route rendering coverage.
- `docs/work/frontend-route-loader-invariants.md`: source-of-truth work record for the completed invariant cleanup.

## Task 1: Catalog Loader Context Invariant Cleanup

**Files:**
- Modify: `assets/src/routes/catalog/loader.ts`
- Modify: `assets/src/routes/catalog/__tests__/browse.route.test.tsx`
- Create: `docs/work/frontend-route-loader-invariants.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing invariant coverage**

Add a catalog loader test proving a missing Relay router context rejects with the route-preload invariant error, does not call `preloadRouteQuery(...)`, and does not log a recoverable catalog-preload failure.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx
```

Expected: FAIL because `browseLoader` still catches the missing Relay context error and returns `{status: "error"}`.

- [x] **Step 3: Move the context lookup outside the recoverable preload block**

Resolve the Relay environment before the `try` block that handles recoverable preload failures.

- [x] **Step 4: Run focused frontend verification**

Run:

```bash
cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx
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
