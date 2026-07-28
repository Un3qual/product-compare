defmodule ProductCompareWeb.Resolvers.Catalog.InputNormalization do
  @moduledoc false

  alias ProductCompare.Specs
  alias ProductCompareWeb.GraphQL.Input

  @max_comparison_products 3
  @max_search_query_length 100

  @spec comparison_slugs(any()) :: {:ok, [String.t()]} | {:error, String.t()}
  def comparison_slugs(slugs)
      when is_list(slugs) and length(slugs) in 1..@max_comparison_products do
    normalized_slugs =
      Enum.map(slugs, fn
        slug when is_binary(slug) -> String.trim(slug)
        _value -> nil
      end)

    if Enum.all?(normalized_slugs, &(is_binary(&1) and &1 != "")) and
         Enum.uniq(normalized_slugs) == normalized_slugs do
      {:ok, normalized_slugs}
    else
      {:error, "comparison slugs must be unique non-blank strings"}
    end
  end

  def comparison_slugs(_slugs),
    do: {:error, "comparison slugs must contain between 1 and 3 values"}

  @spec filters(map() | nil) :: {:ok, map()} | {:error, String.t()}
  def filters(nil), do: {:ok, %{}}

  def filters(filters) when is_map(filters) do
    with {:ok, query} <- normalize_search_query(Input.fetch_value(filters, :query)),
         {:ok, sort} <- normalize_product_sort(Input.fetch_value(filters, :sort), query),
         {:ok, primary_type_taxon_id} <-
           Input.decode_optional_integer_id(
             Input.fetch_value(filters, :primary_type_taxon_id),
             :taxon,
             "taxon"
           ),
         {:ok, include_type_descendants} <-
           Input.normalize_boolean_value(
             Input.fetch_value(filters, :include_type_descendants, false)
           ),
         {:ok, numeric_filters} <-
           normalize_numeric_filters(Input.fetch_list_value(filters, :numeric)),
         {:ok, boolean_filters} <-
           normalize_boolean_filters(Input.fetch_list_value(filters, :booleans)),
         {:ok, enum_filters} <- normalize_enum_filters(Input.fetch_list_value(filters, :enums)),
         {:ok, use_case_taxon_ids} <-
           Input.decode_integer_id_list(
             Input.fetch_list_value(filters, :use_case_taxon_ids),
             :taxon,
             "taxon",
             "invalid filter ids"
           ),
         :ok <- validate_filter_semantics(numeric_filters, boolean_filters, enum_filters) do
      normalized_filters =
        %{
          include_type_descendants: include_type_descendants,
          numeric: numeric_filters,
          booleans: boolean_filters,
          enums: enum_filters,
          use_case_taxon_ids: use_case_taxon_ids
        }
        |> Input.put_present(:query, query)
        |> Input.put_present(:sort, sort)
        |> Input.put_present(:primary_type_taxon_id, primary_type_taxon_id)

      {:ok, normalized_filters}
    end
  end

  def filters(_filters), do: {:error, "invalid filters"}

  defp normalize_search_query(nil), do: {:ok, nil}

  defp normalize_search_query(value) when is_binary(value) do
    query = String.trim(value)

    cond do
      query == "" -> {:ok, nil}
      String.length(query) > @max_search_query_length -> {:error, "search query is too long"}
      true -> {:ok, query}
    end
  end

  defp normalize_search_query(_value), do: {:error, "invalid search query"}

  defp normalize_product_sort(nil, query) when is_binary(query), do: {:ok, :relevance}
  defp normalize_product_sort(nil, _query), do: {:ok, nil}

  defp normalize_product_sort(sort, _query)
       when sort in [:relevance, :id_asc, :name_asc, :brand_name_asc, :newest],
       do: {:ok, sort}

  defp normalize_product_sort(sort, _query) when is_binary(sort) do
    case sort |> String.trim() |> String.upcase() do
      "RELEVANCE" -> {:ok, :relevance}
      "ID_ASC" -> {:ok, :id_asc}
      "NAME_ASC" -> {:ok, :name_asc}
      "BRAND_NAME_ASC" -> {:ok, :brand_name_asc}
      "NEWEST" -> {:ok, :newest}
      _invalid -> {:error, "invalid product sort"}
    end
  end

  defp normalize_product_sort(_sort, _query), do: {:error, "invalid product sort"}

  @spec normalize_numeric_filters(any()) :: {:ok, [map()]} | {:error, String.t()}
  defp normalize_numeric_filters(filters) when is_list(filters) do
    Enum.reduce_while(filters, {:ok, []}, fn filter, {:ok, acc} ->
      with true <- is_map(filter),
           {:ok, attribute_id} <-
             Input.decode_required_integer_id(
               Input.fetch_value(filter, :attribute_id),
               :attribute,
               "attribute"
             ),
           {:ok, min} <- Input.normalize_decimal_value(Input.fetch_value(filter, :min)),
           {:ok, max} <- Input.normalize_decimal_value(Input.fetch_value(filter, :max)) do
        normalized_filter =
          %{attribute_id: attribute_id}
          |> Input.put_present(:min, min)
          |> Input.put_present(:max, max)

        {:cont, {:ok, [normalized_filter | acc]}}
      else
        false -> {:halt, {:error, "invalid numeric filter"}}
        {:error, _} = error -> {:halt, error}
      end
    end)
    |> reverse_ok_list()
  end

  defp normalize_numeric_filters(_filters), do: {:error, "invalid numeric filter"}

  @spec normalize_boolean_filters(any()) :: {:ok, [map()]} | {:error, String.t()}
  defp normalize_boolean_filters(filters) when is_list(filters) do
    Enum.reduce_while(filters, {:ok, []}, fn filter, {:ok, acc} ->
      with true <- is_map(filter),
           {:ok, attribute_id} <-
             Input.decode_required_integer_id(
               Input.fetch_value(filter, :attribute_id),
               :attribute,
               "attribute"
             ),
           value when is_boolean(value) <- Input.fetch_value(filter, :value) do
        {:cont, {:ok, [%{attribute_id: attribute_id, value: value} | acc]}}
      else
        false -> {:halt, {:error, "invalid boolean filter"}}
        {:error, _} = error -> {:halt, error}
        _ -> {:halt, {:error, "invalid boolean filter"}}
      end
    end)
    |> reverse_ok_list()
  end

  defp normalize_boolean_filters(_filters), do: {:error, "invalid boolean filter"}

  @spec normalize_enum_filters(any()) :: {:ok, [map()]} | {:error, String.t()}
  defp normalize_enum_filters(filters) when is_list(filters) do
    Enum.reduce_while(filters, {:ok, []}, fn filter, {:ok, acc} ->
      with true <- is_map(filter),
           {:ok, attribute_id} <-
             Input.decode_required_integer_id(
               Input.fetch_value(filter, :attribute_id),
               :attribute,
               "attribute"
             ),
           {:ok, enum_option_id} <-
             Input.decode_required_integer_id(
               Input.fetch_value(filter, :enum_option_id),
               :enum_option,
               "enum option"
             ) do
        {:cont, {:ok, [%{attribute_id: attribute_id, enum_option_id: enum_option_id} | acc]}}
      else
        false -> {:halt, {:error, "invalid enum filter"}}
        {:error, _} = error -> {:halt, error}
      end
    end)
    |> reverse_ok_list()
  end

  defp normalize_enum_filters(_filters), do: {:error, "invalid enum filter"}

  defp validate_filter_semantics(numeric_filters, boolean_filters, enum_filters) do
    attribute_types =
      [numeric_filters, boolean_filters, enum_filters]
      |> Enum.flat_map(&Enum.map(&1, fn filter -> filter.attribute_id end))
      |> Specs.filterable_attribute_types()

    enum_option_pairs =
      Specs.filterable_enum_option_pairs(
        Enum.map(enum_filters, & &1.attribute_id),
        Enum.map(enum_filters, & &1.enum_option_id)
      )

    with :ok <- validate_numeric_filter_semantics(numeric_filters, attribute_types),
         :ok <- validate_boolean_filter_semantics(boolean_filters, attribute_types),
         :ok <- validate_enum_filter_semantics(enum_filters, enum_option_pairs) do
      :ok
    end
  end

  defp validate_numeric_filter_semantics(filters, attribute_types) do
    Enum.reduce_while(filters, :ok, fn filter, :ok ->
      cond do
        Map.get(attribute_types, filter.attribute_id) != :numeric ->
          {:halt, {:error, "invalid numeric filter"}}

        numeric_min_greater_than_max?(filter) ->
          {:halt, {:error, "invalid numeric filter"}}

        true ->
          {:cont, :ok}
      end
    end)
  end

  defp validate_boolean_filter_semantics(filters, attribute_types) do
    Enum.reduce_while(filters, :ok, fn filter, :ok ->
      if Map.get(attribute_types, filter.attribute_id) == :bool do
        {:cont, :ok}
      else
        {:halt, {:error, "invalid boolean filter"}}
      end
    end)
  end

  defp validate_enum_filter_semantics(filters, enum_option_pairs) do
    Enum.reduce_while(filters, :ok, fn filter, :ok ->
      if MapSet.member?(enum_option_pairs, {filter.attribute_id, filter.enum_option_id}) do
        {:cont, :ok}
      else
        {:halt, {:error, "invalid enum filter"}}
      end
    end)
  end

  defp numeric_min_greater_than_max?(%{min: min, max: max})
       when not is_nil(min) and not is_nil(max) do
    Decimal.compare(to_decimal(min), to_decimal(max)) == :gt
  end

  defp numeric_min_greater_than_max?(_filter), do: false

  defp to_decimal(%Decimal{} = value), do: value
  defp to_decimal(value) when is_integer(value), do: Decimal.new(value)
  defp to_decimal(value) when is_float(value), do: Decimal.from_float(value)

  @spec reverse_ok_list({:ok, list()} | {:error, String.t()}) ::
          {:ok, list()} | {:error, String.t()}
  defp reverse_ok_list({:ok, items}), do: {:ok, Enum.reverse(items)}
  defp reverse_ok_list({:error, _message} = error), do: error
end
