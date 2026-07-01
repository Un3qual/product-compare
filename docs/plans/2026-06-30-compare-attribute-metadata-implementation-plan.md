# Compare Attribute Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give comparison screens typed, ordered, groupable attribute metadata so serious comparisons do not depend only on formatted display strings.

**Architecture:** Extend the existing `Product.currentAttributes` GraphQL value object with display-safe metadata from attributes, selected claims, units, enum options, and `taxon_attributes`. Add one small taxonomy-attribute metadata migration if group labels are not already available, then update product detail and compare rendering to use the richer shape while preserving existing fields.

**Tech Stack:** Elixir, Ecto migrations, Absinthe GraphQL, Relay, React, TypeScript, ExUnit, Vitest.

**Status:** planned product-facing follow-up. Can follow the matrix-modes row.

---

## Ownership

Owned paths:

- Create one migration under `priv/repo/migrations/*_add_compare_group_to_taxon_attributes.exs`
- Modify `lib/product_compare_schemas/specs/taxon_attribute.ex`
- Modify `lib/product_compare/specs.ex`
- Modify `lib/product_compare_web/schema.ex`
- Modify `lib/product_compare_web/resolvers/catalog_resolver.ex`
- Modify `test/product_compare_web/graphql/catalog_queries_test.exs`
- Modify `assets/src/routes/products/product-attribute-list.tsx`
- Modify `assets/src/routes/products/queries/ProductDetailRouteQuery.ts`
- Modify `assets/src/routes/compare/loader.ts`
- Modify `assets/src/routes/compare/product-list.tsx`
- Modify `assets/test/routes/products/detail.route.test.tsx`
- Modify `assets/test/routes/compare/compare.route.test.tsx`
- Modify `assets/schema.graphql`
- Modify `assets/src/__generated__/**` through `bun run relay`
- Modify `docs/work/frontend-product-comparison-demo-parity.md`

Do not change product filtering behavior in this row. Do not remove `valueText`;
keep it as the fallback display contract.

## GraphQL Fields To Add

Extend `product_attribute_value` with:

```elixir
field :attribute_id, non_null(:id)
field :sort_order, :integer
field :group_label, :string
field :is_required, non_null(:boolean)
field :numeric_value, :decimal
field :boolean_value, :boolean
field :enum_option_id, :id
field :unit_symbol, :string
```

`attributeId` must be a Relay global ID for the attribute. `enumOptionId` must
be present only for enum values. Numeric comparison must use the stored numeric
base value or an explicitly documented normalized value; do not infer numeric
ordering from `valueText`.

## Tasks

- [ ] Add a migration that adds nullable `compare_group_label` to `taxon_attributes`.
- [ ] Update `ProductCompareSchemas.Specs.TaxonAttribute` changeset and tests for the new group label.
- [ ] Update `Specs.list_current_attributes_for_product/1` to preload enough claim, unit, enum option, attribute, product primary type, and taxon-attribute data to produce compare metadata.
- [ ] Update `CatalogResolver.format_current_attribute/1` to return the new fields while preserving `code`, `displayName`, `dataType`, and `valueText`.
- [ ] Add GraphQL tests proving typed numeric, boolean, enum, required, sort order, and group label fields.
- [ ] Refresh `assets/schema.graphql` and Relay artifacts.
- [ ] Update product detail specs to group attributes when `groupLabel` exists and otherwise keep the current flat list.
- [ ] Update compare matrix row ordering to use `sortOrder` before display-name fallback.
- [ ] Update differences mode so numeric and boolean values compare by typed fields before falling back to `valueText`.
- [ ] Update lane evidence in `docs/work/frontend-product-comparison-demo-parity.md`.

## Verification

Run these commands:

```bash
mix ecto.migrate
mix test test/product_compare_web/graphql/catalog_queries_test.exs test/product_compare/specs/product_attribute_claim_changeset_test.exs
cd assets && bun run relay
cd assets && bun x vitest run test/routes/products/detail.route.test.tsx test/routes/compare/compare.route.test.tsx
cd assets && bun run typecheck
mix typecheck
git diff --check
```

Expected result: all commands exit 0. Existing clients that only read
`currentAttributes { code displayName dataType valueText }` must keep working.

## Exit Condition

This row is complete when comparison rows can be grouped, ordered, and compared
using typed metadata instead of display text alone.
