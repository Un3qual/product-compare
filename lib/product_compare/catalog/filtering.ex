defmodule ProductCompare.Catalog.Filtering do
  @moduledoc """
  Product filtering query builder for primary type, typed claims, and use-case tags.
  """

  import Ecto.Query

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
    case fetch_value(filters, :primary_type_taxon_id) do
      nil ->
        query

      taxon_id ->
        case normalize_integer_id(taxon_id) do
          {:ok, normalized_taxon_id} ->
            if fetch_value(filters, :include_type_descendants) == true do
              exists_query =
                from c in TaxonClosure,
                  where: c.ancestor_id == ^normalized_taxon_id,
                  where: c.descendant_id == parent_as(:product).primary_type_taxon_id

              where(query, [product: _p], exists(exists_query))
            else
              where(query, [product: p], p.primary_type_taxon_id == ^normalized_taxon_id)
            end

          :error ->
            query
        end
    end
  end

  @spec apply_numeric_filters(Ecto.Query.t(), [numeric_filter()]) :: Ecto.Query.t()
  defp apply_numeric_filters(query, numeric_filters) do
    Enum.reduce(numeric_filters, query, fn filter, acc ->
      case normalize_integer_id(fetch_value(filter, :attribute_id)) do
        {:ok, attribute_id} ->
          min = fetch_value(filter, :min)
          max = fetch_value(filter, :max)

          base_exists_query =
            from pacur in ProductAttributeCurrent,
              join: pac in ProductAttributeClaim,
              on: pac.id == pacur.claim_id,
              where: pacur.product_id == parent_as(:product).id,
              where: pac.attribute_id == ^attribute_id

          exists_query =
            base_exists_query
            |> maybe_apply_numeric_min(min)
            |> maybe_apply_numeric_max(max)

          where(acc, [product: _p], exists(exists_query))

        :error ->
          acc
      end
    end)
  end

  @spec apply_bool_filters(Ecto.Query.t(), [bool_filter()]) :: Ecto.Query.t()
  defp apply_bool_filters(query, bool_filters) do
    Enum.reduce(bool_filters, query, fn filter, acc ->
      value = fetch_value(filter, :value)

      with {:ok, attribute_id} <- normalize_integer_id(fetch_value(filter, :attribute_id)),
           true <- is_boolean(value) do
        exists_query =
          from pacur in ProductAttributeCurrent,
            join: pac in ProductAttributeClaim,
            on: pac.id == pacur.claim_id,
            where: pacur.product_id == parent_as(:product).id,
            where: pac.attribute_id == ^attribute_id,
            where: pac.value_bool == ^value

        where(acc, [product: _p], exists(exists_query))
      else
        _ -> acc
      end
    end)
  end

  @spec apply_enum_filters(Ecto.Query.t(), [enum_filter()]) :: Ecto.Query.t()
  defp apply_enum_filters(query, enum_filters) do
    Enum.reduce(enum_filters, query, fn filter, acc ->
      with {:ok, attribute_id} <- normalize_integer_id(fetch_value(filter, :attribute_id)),
           {:ok, enum_option_id} <- normalize_integer_id(fetch_value(filter, :enum_option_id)) do
        exists_query =
          from pacur in ProductAttributeCurrent,
            join: pac in ProductAttributeClaim,
            on: pac.id == pacur.claim_id,
            where: pacur.product_id == parent_as(:product).id,
            where: pac.attribute_id == ^attribute_id,
            where: pac.enum_option_id == ^enum_option_id

        where(acc, [product: _p], exists(exists_query))
      else
        _ -> acc
      end
    end)
  end

  @spec apply_use_case_filter(Ecto.Query.t(), [pos_integer()]) :: Ecto.Query.t()
  defp apply_use_case_filter(query, []), do: query

  defp apply_use_case_filter(query, use_case_taxon_ids) do
    validated_ids =
      use_case_taxon_ids
      |> Enum.reduce([], fn id, acc ->
        case normalize_integer_id(id) do
          {:ok, normalized} -> [normalized | acc]
          :error -> acc
        end
      end)
      |> Enum.reverse()

    case validated_ids do
      [] ->
        query

      ids ->
        exists_query =
          from pt in ProductTaxon,
            join: t in Taxon,
            on: t.id == pt.taxon_id,
            join: tx in Taxonomy,
            on: tx.id == t.taxonomy_id,
            where: pt.product_id == parent_as(:product).id,
            where: tx.code == "use_case",
            where: pt.taxon_id in ^ids

        where(query, [product: _p], exists(exists_query))
    end
  end

  defp fetch_value(map, key) when is_map(map),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key)))

  defp fetch_value(_map, _key), do: nil

  defp normalize_integer_id(value) when is_integer(value), do: {:ok, value}

  defp normalize_integer_id(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> {:ok, parsed}
      _ -> :error
    end
  end

  defp normalize_integer_id(_value), do: :error

  defp maybe_apply_numeric_min(query, nil), do: query

  defp maybe_apply_numeric_min(query, min),
    do: where(query, [_pacur, pac], pac.value_num_base >= ^min)

  defp maybe_apply_numeric_max(query, nil), do: query

  defp maybe_apply_numeric_max(query, max),
    do: where(query, [_pacur, pac], pac.value_num_base <= ^max)
end
