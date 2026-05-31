# Frontend Route Loader Thrown Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-relay-route-data.md`
  - `docs/work/frontend-route-loader-error-helper.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-loader-thrown-error-helper-implementation-plan.md`
- Objective:
  - Centralize route-loader thrown-error normalization for non-`Error` rejection reasons.

## Verified Current State

- `assets/src/routes/loader-errors.ts` owns shared route-loader abort detection and recoverable fallback logging.
- `assets/src/routes/loader-errors.ts` now also owns thrown-error normalization for loaders that must rethrow failed preload work.
- `assets/src/routes/compare/loader.ts` now delegates non-`Error` rejection wrapping to the shared route-loader helper.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - `docs/plans/NOW.md` has no queued frontend or backend batch.
  - Product data ingestion remains blocked on live provider credentials, quota evidence, account-scoped sample payloads, and compliance signoff.
  - Review found compare route loader thrown-error normalization still local after recoverable route-loader error handling moved into `assets/src/routes/loader-errors.ts`.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/loader-errors.ts`, `assets/src/routes/__tests__/loader-errors.test.ts`, `assets/src/routes/compare/loader.ts`, `assets/src/routes/compare/__tests__/compare.route.test.tsx`, this file, and `docs/plans/2026-05-30-frontend-route-loader-thrown-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Route Loader Thrown Error Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused `normalizeRouteLoaderThrownError(...)` coverage for abort-like values, `Error` objects, and non-`Error` rejection reasons.
  - Added `normalizeRouteLoaderThrownError(...)` to `assets/src/routes/loader-errors.ts`.
  - Replaced compare route loader-local thrown-error normalization with the shared helper.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts src/routes/compare/__tests__/compare.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
