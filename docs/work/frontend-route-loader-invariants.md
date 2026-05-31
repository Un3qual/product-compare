# Frontend Route Loader Invariants Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-relay-route-data.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-loader-context-invariants-implementation-plan.md`
- Objective:
  - Keep Relay route-loader configuration failures visible by failing fast when router context is missing, while preserving route-local unavailable states for recoverable preload failures.

## Verified Current State

- Product, compare, and saved-comparisons route loaders resolve the request-scoped Relay environment before their recoverable network/query handling.
- `browseLoader` now follows the same invariant boundary: missing Relay router context rejects with the shared `Relay environment is missing from the route loader context` error instead of rendering the catalog unavailable fallback.
- Catalog preload failures and aborts keep their existing behavior: non-abort preload failures render `status: "error"`, while aborts are rethrown.

## Next Batch

- Status: completed
- Batch: none queued in this lane
- Why this batch:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found one inconsistent route-loader invariant boundary in the catalog browse loader.
  - The invariant cleanup is complete and no broader route-loader rework is queued from this pass.

## Verification Commands

- `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/**`, this file, and `docs/plans/2026-05-30-frontend-route-loader-context-invariants-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1: Catalog Loader Context Invariant Cleanup

- Completed: 2026-05-30
- Outcome:
  - Added a catalog loader regression proving missing Relay router context rejects before any route query preload is attempted.
  - Moved `getRelayEnvironmentFromRouterContext(...)` outside the browse loader's recoverable preload-error block.
  - Preserved catalog unavailable rendering for real preload failures and abort rethrow behavior.
- Verification:
  - `cd assets && bun x vitest run src/routes/catalog/__tests__/browse.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
