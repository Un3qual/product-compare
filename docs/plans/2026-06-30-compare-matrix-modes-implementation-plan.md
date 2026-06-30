# Compare Matrix Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/compare` support real specification review modes: shared specs, differences only, and all specs with explicit missing values.

**Architecture:** Keep the first slice frontend-only by using existing `Product.currentAttributes` display values. Add a URL-backed `specs=shared|differences|all` mode, build a union matrix from selected products, and preserve mode through add/remove links.

**Tech Stack:** React Router, React, Relay-generated types, TypeScript, Vitest, Testing Library, Bun.

**Status:** planned product-facing follow-up.

---

## Ownership

Owned paths:

- Modify `assets/src/routes/compare/loader.ts`
- Modify `assets/src/routes/compare/paths.ts`
- Modify `assets/src/routes/compare/index.tsx`
- Modify `assets/src/routes/compare/product-list.tsx`
- Modify `assets/src/routes/compare/product-picker.tsx`
- Modify `assets/test/routes/compare/compare.route.test.tsx`
- Modify `docs/work/frontend-product-comparison-demo-parity.md`

Do not modify GraphQL schema, saved-comparison persistence, product limits, or
offer queries in this row.

## URL Contract

- Default mode: `shared`.
- Supported modes: `shared`, `differences`, `all`.
- Invalid or blank `specs` values normalize to `shared`.
- Add/remove/product-picker links preserve the current `specs` value.
- Saving a comparison still saves only product IDs in this row.

## Matrix Semantics

- `shared`: rows whose attribute code exists on every selected product.
- `all`: union of attribute codes across selected products, ordered by the first selected product's attributes first, then additional product-only attributes by display name and code.
- `differences`: union rows where at least one product is missing the attribute or at least two products have different `valueText` values.
- Missing cells render `Not available`.
- Duplicate attribute codes inside one product use first-write-wins, matching the existing helper behavior.

## Tasks

- [ ] Add failing tests for parsing `specs=all`, `specs=differences`, default mode, and invalid-mode fallback in `compareLoader`.
- [ ] Add `CompareSpecMode` and `compareSpecModeFromUrl` to `assets/src/routes/compare/loader.ts`; include `specMode` in ready, empty, too-many, and not-found loader states.
- [ ] Update `buildComparePathFromSlugs` and `buildComparePathAfterRemovingSlugIndex` to accept `{specMode}` and preserve it when it is not `shared`.
- [ ] Add a small `CompareSpecModeControls` component in `index.tsx` with links for Shared, Differences, and All.
- [ ] Update product picker append links to preserve `specs`.
- [ ] Replace `SharedAttributeMatrix` with a mode-aware `CompareSpecificationMatrix`.
- [ ] Add tests for all-spec union rows, missing cells, differences-only rows, no-differences empty state, and preserved mode in remove/add links.
- [ ] Update lane evidence in `docs/work/frontend-product-comparison-demo-parity.md`.

## Verification

Run these commands:

```bash
cd assets && bun x vitest run test/routes/compare/compare.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected result: all commands exit 0. Existing save, add, remove, and selected
tray behavior must remain unchanged except for mode preservation.

## Exit Condition

This row is complete when `/compare` can show shared specs, all specs, and only
meaningful differences through stable URL state.
