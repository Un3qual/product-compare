# Product Filter Metadata and Facets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend and GraphQL contract that lets the frontend render useful product filters without hardcoded attribute, enum-option, or taxon IDs.

**Architecture:** Keep the existing `products(filters:)` query as the product-result surface and add a separate read-only `productFilterMetadata(filters:)` query for filter controls, counts, ranges, and selected state. Implement facet aggregation in a focused catalog module that reuses `ProductCompare.Catalog.Filtering` so metadata and product results share the same current-claim semantics.

**Tech Stack:** Elixir, Phoenix, Absinthe GraphQL, Ecto, Postgres, ExUnit.

**Status:** completed historical work. Implementation and verification are recorded in `docs/work/frontend-catalog-browse.md`.

---

## Ownership

Owned paths:

- Create `lib/product_compare/catalog/filter_metadata.ex`
- Create `test/product_compare/catalog/filter_metadata_test.exs`
- Create `test/product_compare_web/graphql/catalog_filter_metadata_test.exs`
- Modify `lib/product_compare/catalog.ex`
- Modify `lib/product_compare/catalog/filtering.ex`
- Modify `lib/product_compare/specs.ex`
- Modify `lib/product_compare/taxonomy.ex`
- Modify `lib/product_compare_web/schema.ex`
- Modify `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify `docs/work/frontend-catalog-browse.md`

Do not edit `assets/**` in this row except for a schema snapshot refresh if the
implementation plan is intentionally combined with a Relay refresh commit.
Do not expose raw claim payloads, source artifacts, provider metadata,
credentials, account IDs, tracking parameters, or provider errors.

## Current Starting Point

- `products(first:, after:, filters:)` already accepts `ProductFiltersInput`.
- `ProductCompare.Catalog.Filtering.apply_filters/2` already supports primary
  type, descendant type, numeric, boolean, enum, and use-case filters.
- Existing filters only check selected current claims through
  `product_attribute_current`.
- The UI has no safe way to discover filterable attributes, enum options, taxons,
  numeric ranges, selected-state labels, or counts.

## Contract To Build

Add this root query:

```elixir
field :product_filter_metadata, non_null(:product_filter_metadata) do
  arg(:filters, :product_filters_input)
  resolve(&CatalogResolver.product_filter_metadata/3)
end
```

Add these GraphQL shapes:

```elixir
object :product_filter_metadata do
  field :result_count, non_null(:integer)
  field :type_options, non_null(list_of(non_null(:product_filter_option)))
  field :use_case_options, non_null(list_of(non_null(:product_filter_option)))
  field :numeric_filters, non_null(list_of(non_null(:product_numeric_filter_metadata)))
  field :boolean_filters, non_null(list_of(non_null(:product_boolean_filter_metadata)))
  field :enum_filters, non_null(list_of(non_null(:product_enum_filter_metadata)))
end

object :product_filter_option do
  field :id, non_null(:id)
  field :label, non_null(:string)
  field :count, non_null(:integer)
  field :selected, non_null(:boolean)
  field :disabled, non_null(:boolean)
end

object :product_numeric_filter_metadata do
  field :attribute_id, non_null(:id)
  field :code, non_null(:string)
  field :display_name, non_null(:string)
  field :unit_symbol, :string
  field :min, :decimal
  field :max, :decimal
  field :selected_min, :decimal
  field :selected_max, :decimal
end

object :product_boolean_filter_metadata do
  field :attribute_id, non_null(:id)
  field :code, non_null(:string)
  field :display_name, non_null(:string)
  field :true_count, non_null(:integer)
  field :false_count, non_null(:integer)
  field :selected_value, :boolean
end

object :product_enum_filter_metadata do
  field :attribute_id, non_null(:id)
  field :code, non_null(:string)
  field :display_name, non_null(:string)
  field :options, non_null(list_of(non_null(:product_filter_option)))
end
```

Counts and ranges must be computed from the unpaginated result set. For each
facet group, apply all active filters except the group being counted so the UI
can show available choices without hiding the current group's alternatives.

## Tasks

- [x] Add focused catalog metadata tests for result count, type/use-case options, filterable attribute discovery, numeric min/max, boolean counts, enum option counts, selected state, and disabled zero-count options.
- [x] Add `ProductCompare.Catalog.FilterMetadata` with pure query builders for base result queries and per-facet aggregates.
- [x] Add helper functions in `ProductCompare.Specs` and `ProductCompare.Taxonomy` only where the metadata module needs stable, reusable read models.
- [x] Refactor `ProductCompare.Catalog.Filtering` only enough to support counting with one filter group omitted. Preserve the current `product_attribute_current -> product_attribute_claims` query shape for active product filters.
- [x] Add `Catalog.product_filter_metadata/1` as the public context function returning maps ready for GraphQL formatting.
- [x] Add GraphQL object types and `CatalogResolver.product_filter_metadata/3`.
- [x] Extend GraphQL tests for the new query and for invalid filter validation.
- [x] Harden validation so numeric filters require filterable numeric attributes, boolean filters require filterable boolean attributes, enum filters require matching filterable enum attributes and enum options, and numeric min cannot exceed max.
- [x] Preserve current `products(filters:)` behavior for valid existing inputs.
- [x] Update `docs/work/frontend-catalog-browse.md` with implementation evidence when this row is executed.

## Verification

Run these commands:

```bash
mix test test/product_compare/catalog/filter_metadata_test.exs
mix test test/product_compare_web/graphql/catalog_filter_metadata_test.exs
mix test test/product_compare_web/graphql/catalog_queries_test.exs
mix typecheck
git diff --check
```

Expected result: all commands exit 0. Existing filtering regression tests must
continue to prove selected-current-claim filtering and indexed query plans.

## Exit Condition

This row is complete when a browser client can ask GraphQL for display-safe
filter metadata and facet counts using the same filter input shape that
`products(filters:)` already accepts.
