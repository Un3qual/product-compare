# Frontend Route Loader Error Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-route-loader-invariants.md`
  - `docs/work/frontend-relay-route-data.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-loader-error-helper-implementation-plan.md`
- Objective:
  - Centralize recoverable route-loader error handling so Relay-backed loaders share the same abort rethrow, console logging, and fallback-return boundary.

## Verified Current State

- Relay-backed route loaders fail fast when the Relay router context is missing.
- `assets/src/routes/loader-errors.ts` centralizes abort-error detection and recoverable route-loader fallback handling.
- Catalog browse and product detail/offers loaders use `recoverRouteLoaderError(...)` for recoverable preload failures.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found duplicated route-loader error handling after the route-loader invariant cleanup.
  - The recoverable route-loader error helper cleanup is complete and no broader route-loader refactor is queued from this pass.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/**`, this file, and `docs/plans/2026-05-30-frontend-route-loader-error-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Recoverable Loader Error Helper

- Completed: 2026-05-30
- Outcome:
  - Added focused coverage for `recoverRouteLoaderError(...)`.
  - Added a shared helper that rethrows abort errors, logs recoverable loader errors, and returns the route-local fallback.
  - Replaced catalog browse and product detail/offers loader-local recoverable error handling with the shared helper.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/loader-errors.test.ts src/routes/catalog/__tests__/browse.route.test.tsx src/routes/products/__tests__/detail.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
