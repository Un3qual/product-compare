# Frontend Compare Shared Attribute Matrix Implementation Plan (2026-06-01)

Execution status lives in `docs/work/frontend-compare-shared-attribute-matrix.md`, `docs/work/index.md`, and `docs/plans/NOW.md`.

Status: completed on 2026-06-01.

## Goal

Render a shared-attribute comparison matrix on `/compare` so selected products can be scanned row-by-row for current attributes they all have in common.

## Architecture

- Keep the backend and Relay query contract unchanged: `ProductDetailRouteQuery` already returns `currentAttributes`.
- Build the matrix entirely from the product detail query results already read by the compare route.
- Match attributes by stable `code`, preserve the first selected product's attribute display order for shared rows, and preserve selected product order for matrix columns.
- Keep existing per-product cards and save-comparison behavior unchanged.

## Task 1: Render Shared Attribute Matrix

Status: completed on 2026-06-01.

### Files

- Update: `assets/src/routes/compare/index.tsx`
- Update: `assets/src/routes/compare/__tests__/compare.route.test.tsx`

### Acceptance Criteria

- Ready `/compare` renders a `Shared specifications` section when at least two products are selected.
- The matrix includes only attributes whose `code` exists on every selected product.
- Matrix rows preserve the first selected product's shared-attribute order.
- Matrix columns preserve the selected product order.
- Non-shared attributes remain visible only in the existing per-product cards.
- When no attributes are shared by all selected products, `/compare` renders `No shared specifications across these products yet.`

### TDD Steps

1. Add a compare route test where two selected products share `refresh-rate` and `panel-type`, while only one product has `brightness`.
2. Run `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`.
   - Expected RED: no `Shared specifications` section or aligned matrix exists.
3. Add a compare route test where selected products have attributes but no shared `code`.
4. Add the minimal matrix rendering logic in `assets/src/routes/compare/index.tsx`.
5. Re-run `cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx`.
   - Expected GREEN.

## Task 2: Final Verification And Queue Closure

Status: completed on 2026-06-01.

### Files

- Update: `docs/work/frontend-compare-shared-attribute-matrix.md`
- Update: `docs/work/index.md`
- Update: `docs/plans/INDEX.md`
- Update: `docs/plans/NOW.md`
- Update: `ARCHITECTURE.md`

### Acceptance Criteria

- Focused compare route tests pass.
- Frontend typecheck and check pass.
- Queue docs record whether any unblocked compare-matrix batch remains.
- `ARCHITECTURE.md` records the shared comparison matrix as delivered only after verification passes.

### Verification

Run:

```bash
cd assets && bun x vitest run src/routes/compare/__tests__/compare.route.test.tsx
cd assets && bun run typecheck
cd assets && bun run check
git diff --check
```

Expected: all pass.
