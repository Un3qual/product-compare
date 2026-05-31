# Frontend Saved Comparisons Auth-Code Cleanup Implementation Plan

> **For agentic workers:** This was a narrow completed follow-up after the backend GraphQL auth contract cleanup. Use this plan as the implementation record, not as a queued batch.

**Goal:** Align `/compare/saved` loader auth-state detection with the current GraphQL contract by accepting `UNAUTHENTICATED` and `FORBIDDEN` auth failures while rejecting the legacy `UNAUTHORIZED` extension code.

**Architecture:** Keep `savedComparisonsLoader` responsible for route-level auth-state detection after Relay route preloads fail. Treat the backend `extensions.code` value as the contract source instead of broad error-message matching.

**Tech Stack:** Bun, React Router v7 SSR, Relay route preload, TypeScript, Vitest, GraphQL over `/api/graphql`.

---

## File Structure

- `assets/src/routes/compare/saved-data.ts`: saved-route loader, pagination, parse guards, and GraphQL auth-error classification.
- `assets/src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`: focused saved-route auth-error classification coverage.
- `docs/work/frontend-saved-comparisons-relay-migration.md`: source-of-truth frontend lane doc for the completed `/compare/saved` Relay migration and follow-up cleanup.

## Task 1: Saved-Route Auth-Code Contract Cleanup

**Files:**
- Modify: `assets/src/routes/compare/saved-data.ts`
- Modify: `assets/src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts`
- Modify: `docs/work/frontend-saved-comparisons-relay-migration.md`
- Modify: `docs/work/index.md`
- Modify: `docs/plans/NOW.md`
- Modify: `docs/plans/INDEX.md`

- [x] **Step 1: Add failing legacy-code regression coverage**

Add focused coverage proving `isUnauthorizedSavedComparisonsResponse(...)` does not classify a legacy `extensions.code: "UNAUTHORIZED"` saved-comparisons response as the route's unauthenticated state.

- [x] **Step 2: Run the focused failing test**

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts
```

Expected: FAIL because the saved-route loader still accepts `UNAUTHORIZED` as an auth-state code.

- [x] **Step 3: Tighten saved-route auth-code handling**

Update `SAVED_COMPARISONS_AUTH_ERROR_CODES` to accept only `FORBIDDEN` and `UNAUTHENTICATED`.

- [x] **Step 4: Run focused frontend verification**

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/compare.route.test.tsx src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx
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
