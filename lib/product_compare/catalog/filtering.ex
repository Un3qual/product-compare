defmodule ProductCompare.Catalog.Filtering do
  @moduledoc """
  Product filtering query builder for primary type, typed claims, and use-case tags.
  """

  import Ecto.Query

  alias ProductCompare.Catalog.Search
  alias ProductCompare.Input
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
    apply_filters_except(base_query, filters, nil)
  end

  @spec apply_filters_except(Ecto.Queryable.t(), map(), term()) :: Ecto.Query.t()
  def apply_filters_except(base_query \\ Product, filters, omitted_group) do
    search_query = Map.get(filters, :query)

    base_query
    |> from(as: :product)
    |> Search.apply_match(search_query)
    |> maybe_apply_primary_type_filter(filters, omitted_group)
    |> apply_numeric_filters(filters_for_group(filters, :numeric, omitted_group))
    |> apply_bool_filters(filters_for_group(filters, :booleans, omitted_group))
    |> apply_enum_filters(filters_for_group(filters, :enums, omitted_group))
    |> maybe_apply_use_case_filter(filters, omitted_group)
    |> apply_sort(Map.get(filters, :sort), search_query)
  end

  defp apply_sort(query, sort, search_query)
       when sort in [nil, :relevance] and is_binary(search_query) and search_query != "",
       do: Search.order_by_relevance(query, search_query)

  defp apply_sort(query, :name_asc, _search_query),
    do: order_by(query, [product: product], asc: product.name, asc: product.id)

  defp apply_sort(query, :brand_name_asc, _search_query) do
    query
    |> Search.ensure_brand_join()
    |> order_by(
      [product: product, brand: brand],
      asc: brand.name,
      asc: product.name,
      asc: product.id
    )
  end

  defp apply_sort(query, :newest, _search_query),
    do: order_by(query, [product: product], desc: product.inserted_at, desc: product.id)

  defp apply_sort(query, _sort, _search_query),
    do: order_by(query, [product: product], asc: product.id)

  defp maybe_apply_primary_type_filter(query, _filters, :primary_type), do: query

  defp maybe_apply_primary_type_filter(query, filters, _omitted_group),
    do: apply_primary_type_filter(query, filters)

  defp maybe_apply_use_case_filter(query, _filters, :use_case), do: query

  defp maybe_apply_use_case_filter(query, filters, _omitted_group),
    do: apply_use_case_filter(query, Map.get(filters, :use_case_taxon_ids, []))

  defp filters_for_group(filters, key, {key, attribute_id}) do
    filters
    |> Map.get(key, [])
    |> Enum.reject(fn filter ->
      match?(
        {:ok, ^attribute_id},
        Input.normalize_integer_id(fetch_value(filter, :attribute_id))
      )
    end)
  end

  defp filters_for_group(filters, key, _omitted_group), do: Map.get(filters, key, [])

  @spec apply_primary_type_filter(Ecto.Query.t(), map()) :: Ecto.Query.t()
  defp apply_primary_type_filter(query, filters) do
    case fetch_value(filters, :primary_type_taxon_id) do
      nil ->
        query

      taxon_id ->
        case Input.normalize_integer_id(taxon_id) do
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
      case Input.normalize_integer_id(fetch_value(filter, :attribute_id)) do
        {:ok, attribute_id} ->
          min = filter |> fetch_value(:min) |> normalize_numeric_bound()
          max = filter |> fetch_value(:max) |> normalize_numeric_bound()

          if is_nil(min) and is_nil(max) do
            acc
          else
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
          end

        :error ->
          acc
      end
    end)
  end

  @spec apply_bool_filters(Ecto.Query.t(), [bool_filter()]) :: Ecto.Query.t()
  defp apply_bool_filters(query, bool_filters) do
    Enum.reduce(bool_filters, query, fn filter, acc ->
      value = fetch_value(filter, :value)

      with {:ok, attribute_id} <- Input.normalize_integer_id(fetch_value(filter, :attribute_id)),
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
    enum_filters
    |> Enum.reduce(%{}, fn filter, acc ->
      with {:ok, attribute_id} <- Input.normalize_integer_id(fetch_value(filter, :attribute_id)),
           {:ok, enum_option_id} <-
             Input.normalize_integer_id(fetch_value(filter, :enum_option_id)) do
        Map.update(
          acc,
          attribute_id,
          MapSet.new([enum_option_id]),
          &MapSet.put(&1, enum_option_id)
        )
      else
        _ -> acc
      end
    end)
    |> Enum.map(fn {attribute_id, enum_option_ids} ->
      {attribute_id, enum_option_ids |> MapSet.to_list() |> Enum.sort()}
    end)
    |> Enum.sort_by(fn {attribute_id, _enum_option_ids} -> attribute_id end)
    |> Enum.reduce(query, fn {attribute_id, enum_option_ids}, acc ->
      exists_query =
        from pacur in ProductAttributeCurrent,
          join: pac in ProductAttributeClaim,
          on: pac.id == pacur.claim_id,
          where: pacur.product_id == parent_as(:product).id,
          where: pac.attribute_id == ^attribute_id,
          where: pac.enum_option_id in ^enum_option_ids

      where(acc, [product: _p], exists(exists_query))
    end)
  end

  @spec apply_use_case_filter(Ecto.Query.t(), [pos_integer()]) :: Ecto.Query.t()
  defp apply_use_case_filter(query, []), do: query

  defp apply_use_case_filter(query, use_case_taxon_ids) do
    validated_ids =
      use_case_taxon_ids
      |> Enum.reduce([], fn id, acc ->
        case Input.normalize_integer_id(id) do
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
            join: closure in TaxonClosure,
            on: closure.descendant_id == pt.taxon_id,
            where: pt.product_id == parent_as(:product).id,
            where: tx.code == "use_case",
            where: closure.ancestor_id in ^ids

        where(query, [product: _p], exists(exists_query))
    end
  end

  defp fetch_value(map, key) when is_map(map),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key)))

  defp fetch_value(_map, _key), do: nil

  defp maybe_apply_numeric_min(query, nil), do: query

  defp maybe_apply_numeric_min(query, min),
    do: where(query, [_pacur, pac], pac.value_num_base >= ^min)

  defp maybe_apply_numeric_max(query, nil), do: query

  defp maybe_apply_numeric_max(query, max),
    do: where(query, [_pacur, pac], pac.value_num_base <= ^max)

  defp normalize_numeric_bound(nil), do: nil
  defp normalize_numeric_bound(%Decimal{} = value), do: value
  defp normalize_numeric_bound(value) when is_integer(value), do: value
  defp normalize_numeric_bound(value) when is_float(value), do: Decimal.from_float(value)

  defp normalize_numeric_bound(value) when is_binary(value) do
    case Decimal.parse(value) do
      {decimal, ""} -> decimal
      _invalid -> nil
    end
  end

  defp normalize_numeric_bound(_value), do: nil
end
