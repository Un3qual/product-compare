# Frontend Product Attribute Grouping Work Doc

## Snapshot

- Status: ready (product attribute grouping data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after current source and consumer-suite validation
  (164 product-detail and compare route tests).

## Product Attribute Grouping Data Contract

- Status: ready on 2026-07-14.
- Plan: `docs/superpowers/plans/2026-07-14-route-policy-data-contracts.md`.
- Next action: move deterministic product-attribute grouping out of the StyleX
  list component into a framework-free data contract while preserving current
  product-detail and comparison markup.
- Owned paths:
  - `assets/src/routes/products/product-attribute-list-data.ts`
  - `assets/src/routes/products/ProductAttributeList.tsx`
  - `assets/test/routes/products/product-attribute-list-data.test.ts`
  - `docs/work/frontend-product-attribute-grouping.md`
- Verification:
  - `cd assets && bun x vitest run test/routes/products/product-attribute-list-data.test.ts test/routes/products/detail.route.test.tsx test/routes/compare/compare.route.test.tsx`
  - `cd assets && bun run typecheck`
  - `git diff --check`
- Exit condition: one framework-free owner preserves trimmed group labels,
  case-insensitive first-label grouping, first-seen group order, stable
  attribute order within groups, and original ungrouped order.
- Candidate evidence: current source inspection found the deterministic
  grouping loop and normalization helpers embedded in
  `ProductAttributeList.tsx`. The product-detail and compare suites that consume
  the component passed 164 tests.
