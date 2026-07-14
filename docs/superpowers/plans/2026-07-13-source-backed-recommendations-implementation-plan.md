# Source-Backed Recommendations Implementation Plan

**Goal:** Add deterministic comparison guidance that either identifies a
source-backed winner or clearly explains why current evidence cannot support
one.

**Design:**
`docs/superpowers/specs/2026-07-13-watchlists-sharing-and-recommendations-design.md`

## Safety Contract

- Profiles and algorithm versions are code-defined. No generated prose or
  inferred attribute direction can affect ranking.
- `lowest_current_cost` requires one eligible complete landed price per product
  in one shared currency. `best_value` additionally requires accepted current
  specification evidence for every product.
- Missing/stale offers, mixed currencies, missing accepted evidence, and exact
  top ties return no winner with explicit missing reasons.
- Results cite the exact product claim IDs and price-point IDs used.

## Owned Paths

- `lib/product_compare/recommendations.ex`
- `lib/product_compare_web/resolvers/recommendations_resolver.ex`
- `lib/product_compare_web/schema.ex`
- `test/product_compare/recommendations_test.exs`
- `test/product_compare_web/graphql/recommendations_test.exs`
- `assets/schema.graphql`
- `assets/src/routes/compare/**`
- `assets/test/routes/compare/compare.route.test.tsx`
- `docs/work/product-trust-and-discovery.md`

## Verification

- Focused recommendation context, GraphQL, and compare tests.
- Relay generation, TypeScript, client/SSR builds, backend format/type checks,
  queue validation, and diff hygiene.

Immutable comparison snapshots are next after this evidence contract is green.

## Completion Evidence

- Recommendation context and GraphQL: 4 tests passed.
- Compare route and focused recommendation panel: 112 tests passed.
- Relay: 35 reader, 34 normalization, and 34 operation documents compiled.
- TypeScript, client build, SSR build, bundle contract, backend formatting, and
  warning-free compilation passed.
- Completed 2026-07-13; immutable comparison snapshots promoted next.
