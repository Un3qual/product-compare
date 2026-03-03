defmodule ProductCompare.Catalog.Filtering do
  @moduledoc """
  Product filtering query builder for primary type, typed claims, and use-case tags.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Taxonomy.ProductTaxon
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.TaxonClosure
  alias ProductCompareSchemas.Taxonomy.Taxonomy

  @type numeric_filter :: %{
          required(:attribute_id) => pos_integer(),
          optional(:min) => Decimal.t() | number(),
          optional(:max) => Decimal.t() | number()
        }

  @type bool_filter :: %{required(:attribute_id) => pos_integer(), required(:value) => boolean()}
  @type enum_filter :: %{
          required(:attribute_id) => pos_integer(),
          required(:enum_option_id) => pos_integer()
        }

  @spec apply_filters(Ecto.Queryable.t(), map()) :: Ecto.Query.t()
  def apply_filters(base_query \\ Product, filters) do
    base_query
    |> from(as: :product)
    |> apply_primary_type_filter(filters)
    |> apply_numeric_filters(Map.get(filters, :numeric, []))
    |> apply_bool_filters(Map.get(filters, :booleans, []))
    |> apply_enum_filters(Map.get(filters, :enums, []))
    |> apply_use_case_filter(Map.get(filters, :use_case_taxon_ids, []))
    |> order_by([product: p], asc: p.id)
  end

  @spec apply_primary_type_filter(Ecto.Query.t(), map()) :: Ecto.Query.t()
  defp apply_primary_type_filter(query, filters) do
    case Map.get(filters, :primary_type_taxon_id) do
      nil ->
        query

      taxon_id ->
        type_ids =
          if Map.get(filters, :include_type_descendants, false) do
            Repo.all(
              from c in TaxonClosure,
                where: c.ancestor_id == ^taxon_id,
                select: c.descendant_id
            )
          else
            [taxon_id]
          end

        where(query, [product: p], p.primary_type_taxon_id in ^type_ids)
    end
  end

  @spec apply_numeric_filters(Ecto.Query.t(), [numeric_filter()]) :: Ecto.Query.t()
  defp apply_numeric_filters(query, numeric_filters) do
    Enum.reduce(numeric_filters, query, fn filter, acc ->
      attribute_id = Map.fetch!(filter, :attribute_id)
      min = Map.get(filter, :min)
      max = Map.get(filter, :max)

      exists_query =
        from pacur in ProductAttributeCurrent,
          join: pac in ProductAttributeClaim,
          on: pac.id == pacur.claim_id,
          where: pacur.product_id == parent_as(:product).id,
          where: pac.attribute_id == ^attribute_id,
          where: is_nil(^min) or pac.value_num_base >= ^min,
          where: is_nil(^max) or pac.value_num_base <= ^max

      where(acc, [product: _p], exists(exists_query))
    end)
  end

  @spec apply_bool_filters(Ecto.Query.t(), [bool_filter()]) :: Ecto.Query.t()
  defp apply_bool_filters(query, bool_filters) do
    Enum.reduce(bool_filters, query, fn filter, acc ->
      attribute_id = Map.fetch!(filter, :attribute_id)
      value = Map.fetch!(filter, :value)

      exists_query =
        from pacur in ProductAttributeCurrent,
          join: pac in ProductAttributeClaim,
          on: pac.id == pacur.claim_id,
          where: pacur.product_id == parent_as(:product).id,
          where: pac.attribute_id == ^attribute_id,
          where: pac.value_bool == ^value

      where(acc, [product: _p], exists(exists_query))
    end)
  end

  @spec apply_enum_filters(Ecto.Query.t(), [enum_filter()]) :: Ecto.Query.t()
  defp apply_enum_filters(query, enum_filters) do
    Enum.reduce(enum_filters, query, fn filter, acc ->
      attribute_id = Map.fetch!(filter, :attribute_id)
      enum_option_id = Map.fetch!(filter, :enum_option_id)

      exists_query =
        from pacur in ProductAttributeCurrent,
          join: pac in ProductAttributeClaim,
          on: pac.id == pacur.claim_id,
          where: pacur.product_id == parent_as(:product).id,
          where: pac.attribute_id == ^attribute_id,
          where: pac.enum_option_id == ^enum_option_id

      where(acc, [product: _p], exists(exists_query))
    end)
  end

  @spec apply_use_case_filter(Ecto.Query.t(), [pos_integer()]) :: Ecto.Query.t()
  defp apply_use_case_filter(query, []), do: query

  defp apply_use_case_filter(query, use_case_taxon_ids) do
    exists_query =
      from pt in ProductTaxon,
        join: t in Taxon,
        on: t.id == pt.taxon_id,
        join: tx in Taxonomy,
        on: tx.id == t.taxonomy_id,
        where: pt.product_id == parent_as(:product).id,
        where: tx.code == "use_case",
        where: pt.taxon_id in ^use_case_taxon_ids

    where(query, [product: _p], exists(exists_query))
  end
end
