# Frontend Route Record Guards Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-saved-comparisons-relay-migration.md`
  - `docs/work/frontend-auth-mutation-results.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-record-guards-implementation-plan.md`
- Objective:
  - Centralize route-level unknown object/record guards so Relay route payload parsing and auth mutation normalization do not duplicate the same shape check.

## Verified Current State

- Browser auth and saved-comparison routes normalize unknown GraphQL/Relay payloads at the route boundary.
- `assets/src/routes/route-records.ts` owns the shared `isRouteRecord(...)` unknown-object guard.
- `assets/src/routes/auth/errors.ts` and `assets/src/routes/compare/saved-data.ts` use the shared route record guard instead of local duplicate helpers.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found duplicated unknown-object guard logic in Relay-backed route payload normalization.
  - A shared helper keeps route payload parsing behavior consistent as more routes normalize GraphQL responses locally.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/**`, this file, and `docs/plans/2026-05-30-frontend-route-record-guards-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Route Record Guard Helper

- Completed: 2026-05-30
- Outcome:
  - Added `isRouteRecord(...)` for route-level unknown-object guards.
  - Replaced duplicated local `isRecord(...)` helpers in browser auth mutation normalization and saved-comparison route data parsing.
  - Added focused helper coverage for object-shaped payloads plus nullish, primitive, array, and function rejection cases.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/route-records.test.ts src/routes/auth/__tests__/errors.test.ts src/routes/compare/__tests__/saved-comparisons-loader-auth.test.ts src/routes/compare/__tests__/saved-comparisons-route-state.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
