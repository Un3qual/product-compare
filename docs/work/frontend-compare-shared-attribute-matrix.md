# Frontend Compare Shared Attribute Matrix Work Doc

## Snapshot

- Status: completed
- Priority: P1
- Source of truth: this file
- Last verified: 2026-06-01 during Task 2 final verification
- Implementation plan:
  - `docs/plans/2026-06-01-frontend-compare-shared-attribute-matrix-implementation-plan.md`
- Objective:
  - Make `/compare` easier to scan by aligning selected products' shared current attributes in a matrix while preserving the existing per-product compare cards.

## Verified Current State

- Product data ingestion remains blocked pending live provider validation and source onboarding compliance signoff.
- `/compare` already preloads selected products with `ProductDetailRouteQuery`.
- `ProductDetailRouteQuery` already includes `currentAttributes { code displayName dataType valueText }`.
- `/compare` now renders a `Shared specifications` matrix for selected products with overlapping current-attribute codes.
- Non-shared current attributes remain visible in the existing per-product compare cards.

## Next Batch

- Status: completed
- Batch: none queued.
- Scope:
  - No unblocked shared-attribute matrix batch remains.
  - Product data ingestion remains blocked pending live provider validation and source onboarding compliance signoff.
  - The next demo-parity frontend candidate requires a fresh product/backend priority decision.

## Verification Commands

- `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`
- `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx`
- `cd assets && bun run typecheck`
- `cd assets && bun run check`
- `git diff --check`

## Just Completed

- Task 1:
  - Added a `Shared specifications` matrix on ready `/compare` pages when at least two products are selected.
  - Matrix rows include only attribute codes present on every selected product.
  - Matrix rows preserve the first selected product's shared-attribute order, and columns preserve selected product order.
  - Added an empty shared-attribute state when no attribute codes overlap across the selected products.
  - Added duplicate-code coverage and first-write-wins handling for repeated attribute codes.
  - Verified `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx` and `cd assets && bun run typecheck`.

- Task 2:
  - Ran focused compare route and compare Relay migration verification.
  - Ran `cd assets && bun x vitest run src/routes/compare/__tests__/compare-relay-migration.test.tsx`.
  - Ran `cd assets && bun run typecheck`.
  - Ran `cd assets && bun run check`.
