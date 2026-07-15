# Frontend Product Attribute Grouping Work Doc

## Snapshot

- Status: complete (product attribute grouping data contract)
- Priority: P2
- Dispatch source of truth: `docs/work/index.md`
- Lane context and status evidence: this file
- Last verified: 2026-07-14 after focused and full frontend verification (169
  focused tests; 72 files and 1,000 tests in the full gate).

## Product Attribute Grouping Data Contract

- Status: complete on `codex/route-policy-data-contracts` as of 2026-07-14.
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

## Completion Evidence

- `product-attribute-list-data.ts` now owns label trimming, case-insensitive
  grouping, first-label retention, first-seen group order, stable attribute
  order, and the ordered ungrouped tail.
- `ProductAttributeList` retains empty-state, section, heading, definition-list,
  and StyleX presentation while preserving its existing item-type export.
- RED failed because the framework-free grouping module did not exist.
- GREEN passed 5 direct tests and 164 unchanged consumer tests (169 focused
  tests total).
- `cd assets && bun run typecheck` passed.
- `cd assets && bun run check` passed Relay validation, TypeScript, 72 test
  files and 1,000 tests, client and SSR production builds, and the client
  bundle budget (181,907 gzip bytes against 200,000).
- The framework-import scan and `git diff --check` passed.
- Independent review found no actionable behavior, reference, mutation,
  type-compatibility, React-performance, test-quality, or queue issue.
