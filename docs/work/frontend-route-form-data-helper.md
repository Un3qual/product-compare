# Frontend Route Form Data Helper Work Doc

## Snapshot

- Status: completed
- Priority: P2
- Source of truth: this file
- Last verified: 2026-05-30 after full frontend/backend verification
- Historical context:
  - `ARCHITECTURE.md`
  - `docs/work/frontend-auth-mutation-results.md`
  - `docs/work/frontend-route-record-guards.md`
- Current implementation plan:
  - `docs/plans/2026-05-30-frontend-route-form-data-helper-implementation-plan.md`
- Objective:
  - Centralize repeated auth route string form-value extraction.

## Verified Current State

- Login, register, forgot-password, and reset-password routes each construct `FormData` in submit handlers and manually coerce named values to strings.
- Auth mutation result handling is already centralized, but form-value extraction remains route-local duplication.
- `assets/src/routes/form-data.ts` now owns string form-value extraction for route submit handlers.
- The helper returns an empty string for missing and non-string values instead of leaking object stringification into mutation variables.

## Next Batch

- Status: completed
- Batch: none queued
- Why this batch was selected:
  - The active queue has no unblocked frontend or backend implementation batch.
  - Review found repeated form-value extraction across the Relay-backed browser auth mutation routes.
  - A shared route form helper keeps auth route submit handlers smaller and avoids ad hoc `String(...)` coercion.

## Verification Commands

- `cd assets && bun x vitest run src/routes/__tests__/form-data.test.ts`
- `cd assets && bun x vitest run src/routes/__tests__/form-data.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
- `cd assets && bun run check`
- `mix test`
- `mix format --check-formatted`
- `mix compile --warnings-as-errors`
- `mix typecheck`
- `git diff --check`

## Parallel Lane Ownership

- Lane: frontend
- Owned paths: `assets/src/routes/**`, this file, and `docs/plans/2026-05-30-frontend-route-form-data-helper-implementation-plan.md`
- Coordinator-owned docs: `docs/work/index.md`, `docs/plans/NOW.md`, `docs/plans/INDEX.md`, and `ARCHITECTURE.md`

## Completed Batches

### Task 1, Route Form Data Helper Adoption

- Completed: 2026-05-30
- Outcome:
  - Added `routeFormValue(formData, name)` for string route form-value extraction.
  - Added focused helper coverage for string values, missing values, and non-string `File` values.
  - Replaced repeated auth route submit-handler `FormData` string coercion in login, register, forgot-password, and reset-password routes.
- Verification:
  - `cd assets && bun x vitest run src/routes/__tests__/form-data.test.ts`
  - `cd assets && bun x vitest run src/routes/__tests__/form-data.test.ts src/routes/auth/__tests__/session.route.test.tsx src/routes/auth/__tests__/recovery.route.test.tsx`
  - `cd assets && bun run check`
  - `mix test`
  - `mix format --check-formatted`
  - `mix compile --warnings-as-errors`
  - `mix typecheck`
  - `git diff --check`
