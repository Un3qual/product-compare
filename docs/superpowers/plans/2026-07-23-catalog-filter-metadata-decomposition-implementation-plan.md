# Catalog Filter Metadata Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `ProductCompare.Catalog.FilterMetadata.metadata/1` as the stable
catalog-facing boundary while moving query, taxonomy-facet, selected-filter,
and attribute-facet implementations into focused internal modules.

**Architecture:** The existing module remains the only metadata assembly
facade. `Query` owns filtered-product query construction and result counts,
`TaxonomyFacets` owns primary-type and use-case projections,
`SelectedFilters` owns deterministic selected-filter normalization, and
`AttributeFacets` owns numeric, boolean, and enum aggregation and presentation.

**Tech Stack:** Elixir, Ecto, PostgreSQL, Decimal, ExUnit.

## Global Constraints

- Preserve `metadata/1`, its non-map fallback, result keys, values, ordering,
  selected state, disabled state, counts, ranges, units, and empty behavior.
- Preserve omitted-filter-group semantics, accepted-current-claim selection,
  taxonomy closure semantics, distinct counts, and query budgets.
- Keep `ProductCompare.Catalog` as the production caller; no caller may bypass
  the stable metadata facade.
- Do not change schemas, migrations, filter inputs, catalog, taxonomy,
  specification, GraphQL, Relay, or frontend policy.

---

### Task 1: Filter Query Ownership

**Files:**

- Create: `lib/product_compare/catalog/filter_metadata/query.ex`
- Modify: `lib/product_compare/catalog/filter_metadata.ex`
- Test: `test/product_compare/catalog/filter_metadata_test.exs`

**Interfaces:** `Query.filtered_products/2` returns the current
order-free filtered product query, and `Query.result_count/1` returns the
unchanged count.

- [ ] Run the named characterization suite as the green baseline.
- [ ] Add facade delegation to the missing owner and run the suite to observe
  the expected compilation failure.
- [ ] Move filtered-query construction and result counting into `Query`.
- [ ] Re-run the suite and confirm counts and query behavior are unchanged.
- [ ] Commit with message `refactor: isolate filter metadata queries`.

### Task 2: Taxonomy Facet Ownership

**Files:**

- Create: `lib/product_compare/catalog/filter_metadata/taxonomy_facets.ex`
- Modify: `lib/product_compare/catalog/filter_metadata.ex`
- Read: `lib/product_compare/catalog/filter_metadata/query.ex`
- Test: `test/product_compare/catalog/filter_metadata_test.exs`

**Interfaces:** `TaxonomyFacets.build/1` returns
`%{type_options: list(), use_case_options: list()}` with the current count,
selection, ordering, and disabled-state projections.

- [ ] Run the named suite before extraction.
- [ ] Add facade delegation and observe the expected missing-owner failure.
- [ ] Move primary-type and use-case counts and presentation into
  `TaxonomyFacets`.
- [ ] Re-run the suite and confirm closure counts and self-excluding facet
  behavior remain unchanged.
- [ ] Commit with message `refactor: isolate taxonomy filter metadata`.

### Task 3: Selected Attribute Filter Ownership

**Files:**

- Create: `lib/product_compare/catalog/filter_metadata/selected_filters.ex`
- Modify: `lib/product_compare/catalog/filter_metadata.ex`
- Test: `test/product_compare/catalog/filter_metadata_test.exs`

**Interfaces:** `SelectedFilters.numeric/1`, `boolean/1`, and `enum/1` return
the current per-attribute normalized maps used by attribute aggregation.

- [ ] Run the named suite before extraction.
- [ ] Add delegation and observe the expected missing-owner failure.
- [ ] Move numeric-bound normalization and duplicate numeric, boolean, and enum
  merge policy into `SelectedFilters`.
- [ ] Re-run the suite and confirm malformed, duplicate, conflicting, and
  selected-only cases are unchanged.
- [ ] Commit with message `refactor: isolate selected filter metadata`.

### Task 4: Attribute Facet Ownership

**Files:**

- Create: `lib/product_compare/catalog/filter_metadata/attribute_facets.ex`
- Modify: `lib/product_compare/catalog/filter_metadata.ex`
- Read: `lib/product_compare/catalog/filter_metadata/query.ex`
- Read: `lib/product_compare/catalog/filter_metadata/selected_filters.ex`
- Test: `test/product_compare/catalog/filter_metadata_test.exs`

**Interfaces:** `AttributeFacets.build/1` returns
`%{numeric_filters: list(), boolean_filters: list(), enum_filters: list()}`
with current batching and presentation.

- [ ] Run the named suite before extraction.
- [ ] Add delegation and observe the expected missing-owner failure.
- [ ] Move attribute lookup, self-excluding aggregation, units, range/count
  projection, and enum option presentation into `AttributeFacets`.
- [ ] Re-run the suite and confirm batching, selected-only facets, accepted
  claim use, ranges, counts, and ordering remain unchanged.
- [ ] Commit with message `refactor: isolate attribute filter metadata`.

### Task 5: Full Contract And Lane Gate

**Files:**

- Modify: `docs/work/catalog-filter-metadata-decomposition.md`

- [ ] Run the exact 10-test characterization gate.
- [ ] Run `mix typecheck`, `mix format --check-formatted`,
  `mix work_queue.validate`, `mix ci`, and `git diff --check`.
- [ ] Confirm no production or test caller bypasses the stable facade.
- [ ] Record final ownership, module sizes, exact test count, and gate results
  in the lane doc and include it in the final code/test milestone commit.
