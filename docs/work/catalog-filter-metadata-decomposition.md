# Catalog Filter Metadata Decomposition

## Snapshot

- Status: complete
- Priority: P3
- Dispatch source of truth: `docs/work/index.md`
- Plan:
  `docs/superpowers/plans/2026-07-23-catalog-filter-metadata-decomposition-implementation-plan.md`
- Last verified: 2026-07-23 against the direct catalog filter-metadata
  characterization path.

## Target Outcome

`ProductCompare.Catalog.FilterMetadata.metadata/1` remains the stable
catalog-facing boundary while filtered-product query construction, taxonomy
facets, selected attribute-filter normalization, and attribute-facet
aggregation live in focused internal modules with unchanged queries, counts,
ordering, selection, disabled-state, units, and result shapes.

## Ready Evidence

- `lib/product_compare/catalog/filter_metadata.ex` is 482 lines and combines
  four concrete implementation responsibilities behind one public function.
- `ProductCompare.Catalog` is the only production caller and already owns the
  stable public context boundary.
- The direct characterization gate passed 10 tests on 2026-07-23.
- Taxonomy and attribute facets form one metadata response and remain internal
  slices rather than separate queue batches.
- The implementation and test paths are disjoint from the three currently
  selected decomposition rows and the other replenished successors.

## Internal Slices

1. Filtered-product query construction and result count.
2. Primary-type and use-case taxonomy facet counts and presentation.
3. Selected numeric, boolean, and enum filter normalization.
4. Numeric ranges, boolean counts, enum counts, and facet presentation.
5. Stable metadata facade and exact result parity.

## Boundaries

- Preserve `metadata/1`, non-map fallback behavior, keys, values, ordering,
  selected state, disabled state, counts, ranges, units, and empty-facet
  behavior.
- Preserve `Filtering.apply_filters_except/2`, omitted-group behavior, query
  budgets, accepted-claim selection, taxonomy closure semantics, and distinct
  product counts.
- Keep callers dependent only on `ProductCompare.Catalog.filter_metadata/1`
  and the stable `FilterMetadata.metadata/1` owner.
- Do not change schemas, migrations, filter inputs, catalog policy, taxonomy,
  specification truth, GraphQL, Relay, or frontend behavior.

## Verification

- `mix test test/product_compare/catalog/filter_metadata_test.exs`
- `mix typecheck`
- `mix format --check-formatted`
- `mix work_queue.validate`
- `mix ci`
- `git diff --check`

## Completion Evidence

- Completed on 2026-07-23 on the aggregate detached-worktree commit stack.
- The stable facade is 34 lines.
- `Query` is 23 lines, `TaxonomyFacets` is 101 lines,
  `SelectedFilters` is 129 lines, and `AttributeFacets` is 244 lines.
- The exact characterization gate passed 10 tests with no failures.
- `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check` passed.
- Final `mix ci` passed 913 backend tests at 83.45% coverage and 1,507
  frontend tests, plus every quality, duplication, type, Relay, build, and
  bundle gate.
- Production references to focused owners are limited to the stable facade or
  modules inside the same implementation namespace.
