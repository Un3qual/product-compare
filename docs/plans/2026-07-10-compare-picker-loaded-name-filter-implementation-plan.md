# Compare Picker Loaded-Name Filter Implementation Plan

**Status:** complete

**Goal:** Help shoppers find a product by name among the products already
loaded in the compare picker.

**Architecture:** Add local component state and a case-insensitive name filter
to the existing picker. Filtering remains explicitly limited to loaded pages;
the current Relay pagination, selected-product exclusion, and compare URL
construction remain unchanged.

## Global Constraints

- Do not add backend search, query variables, or eager cursor traversal.
- Preserve selected-product exclusion and the three-product comparison limit.
- Keep `Show more products` available when a loaded-page filter has no match.

## Owned Paths

- `assets/src/routes/compare/CompareProductPickerBoundary.tsx`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/frontend-product-comparison-demo-parity.md`

## Batches

- [ ] Add RED coverage for case-insensitive loaded-product filtering, clearing,
  no-match copy, and unchanged pagination availability.
- [ ] Add the local name filter and explicit loaded-product scope label.
- [ ] Run the full focused compare suite, TypeScript, and diff checks; record
  evidence.
- [ ] Commit code, tests, and lane evidence together.

## Verification

- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx -t "product picker.*filter|loaded products"`
- `cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx`
- `cd assets && bun run typecheck`
- `git diff --check`

## Exit Condition

The compare picker can filter already-loaded product names without changing
pagination, selection, or compare-link behavior.
