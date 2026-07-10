defmodule ProductCompareWeb.Resolvers.CatalogResolver do
  @moduledoc false

  import Absinthe.Resolution.Helpers, only: [on_load: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Errors, as: GraphQLErrors
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.TaxonAttribute

  @base_unit_symbol_cache_context_key :catalog_base_unit_symbol_cache_key
  @max_search_query_length 100

  @spec product(any(), map(), Absinthe.Resolution.t()) :: {:ok, Product.t() | nil}
  def product(_parent, args, resolution) do
    clear_base_unit_symbol_cache(resolution)
    {:ok, Catalog.get_product_by_slug(Input.fetch_value(args || %{}, :slug))}
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def products(_parent, args, resolution) do
    clear_base_unit_symbol_cache(resolution)

    with {:ok, filters} <- normalize_filters(Input.fetch_value(args || %{}, :filters, %{})) do
      query = Filtering.apply_filters(Product, filters)

      connection_args = Input.connection_args(args)

      Connection.from_query_result(query, connection_args, Repo)
    end
  end

  @spec product_filter_metadata(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def product_filter_metadata(_parent, args, _resolution) do
    with {:ok, filters} <- normalize_filters(Input.fetch_value(args || %{}, :filters, %{})) do
      {:ok, Catalog.product_filter_metadata(filters)}
    end
  end

  @spec current_attributes(Product.t(), map(), Absinthe.Resolution.t()) ::
          {:ok, [map()]} | Absinthe.Resolution.Helpers.dataloader_tuple()
  def current_attributes(
        %Product{id: product_id} = product,
        _args,
        %{context: %{loader: loader}} = resolution
      )
      when is_integer(product_id) do
    loader
    |> Dataloader.load(Catalog, {:many, ProductAttributeCurrent}, product_id: product_id)
    |> load_taxon_attributes(product.primary_type_taxon_id)
    |> on_load(fn loader ->
      attributes =
        loader
        |> Dataloader.get(Catalog, {:many, ProductAttributeCurrent}, product_id: product_id)
        |> Specs.with_current_attribute_metadata_from_taxon_attributes(
          loaded_taxon_attributes(loader, product.primary_type_taxon_id)
        )
        |> format_current_attributes(resolution)

      {:ok, attributes}
    end)
  end

  def current_attributes(%Product{id: product_id}, _args, _resolution) do
    attributes =
      product_id
      |> Specs.list_current_attributes_for_product()
      |> format_current_attributes()

    {:ok, attributes}
  end

  @spec my_saved_comparison_sets(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t() | GraphQLErrors.top_level_error()}
  def my_saved_comparison_sets(_parent, args, %{context: %{current_user: current_user}}) do
    query = Catalog.list_saved_comparison_sets_query(current_user.id)
    connection_args = Input.connection_args(args)

    Connection.from_query_result(query, connection_args, Repo)
  end

  def my_saved_comparison_sets(_parent, _args, _resolution),
    do: {:error, GraphQLErrors.unauthenticated()}

  @spec create_saved_comparison_set(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_saved_comparison_set(_parent, %{input: input}, %{
        context: %{current_user: current_user}
      }) do
    with {:ok, product_ids} <-
           Input.decode_integer_id_list(
             Input.fetch_list_value(input, :product_ids),
             :product,
             "product"
           ) do
      attrs = %{
        name: Input.fetch_value(input, :name),
        product_ids: product_ids
      }

      case Catalog.create_saved_comparison_set(current_user.id, attrs) do
        {:ok, %SavedComparisonSet{} = saved_comparison_set} ->
          {:ok, %{saved_comparison_set: saved_comparison_set, errors: []}}

        {:error, :product_not_found} ->
          {:ok, saved_comparison_error_payload("NOT_FOUND", "product not found", "productIds")}

        {:error, :empty_products} ->
          {:ok,
           saved_comparison_error_payload(
             "INVALID_ARGUMENT",
             "at least one product is required",
             "productIds"
           )}

        {:error, :duplicate_products} ->
          {:ok,
           saved_comparison_error_payload(
             "INVALID_ARGUMENT",
             "duplicate products are not allowed",
             "productIds"
           )}

        {:error, :too_many_products} ->
          {:ok,
           saved_comparison_error_payload(
             "INVALID_ARGUMENT",
             "you can save up to 3 products",
             "productIds"
           )}

        {:error, %Ecto.Changeset{} = changeset} ->
          {:ok, saved_comparison_changeset_error_payload(changeset)}
      end
    else
      {:error, _message} ->
        {:ok, saved_comparison_error_payload("INVALID_ID", "invalid product id", "productIds")}
    end
  end

  def create_saved_comparison_set(_parent, _args, _resolution),
    do: {:ok, saved_comparison_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec delete_saved_comparison_set(
          any(),
          %{saved_comparison_set_id: String.t()},
          Absinthe.Resolution.t()
        ) ::
          {:ok, map()}
  def delete_saved_comparison_set(
        _parent,
        %{saved_comparison_set_id: saved_comparison_set_id},
        %{context: %{current_user: current_user}}
      ) do
    with {:ok, entropy_id} <-
           Input.decode_required_uuid_id(
             saved_comparison_set_id,
             :saved_comparison_set,
             "saved comparison set"
           ) do
      case Catalog.delete_saved_comparison_set(current_user.id, entropy_id) do
        {:ok, %SavedComparisonSet{} = saved_comparison_set} ->
          {:ok, %{saved_comparison_set: saved_comparison_set, errors: []}}

        {:error, :not_found} ->
          {:ok, saved_comparison_error_payload("NOT_FOUND", "saved comparison set not found")}
      end
    else
      {:error, _message} ->
        {:ok,
         saved_comparison_error_payload(
           "INVALID_ID",
           "invalid saved comparison set id",
           "savedComparisonSetId"
         )}
    end
  end

  def delete_saved_comparison_set(_parent, _args, _resolution),
    do: {:ok, saved_comparison_error_payload(GraphQLErrors.unauthenticated_mutation_error())}

  @spec normalize_filters(map() | nil) :: {:ok, map()} | {:error, String.t()}
  defp normalize_filters(nil), do: {:ok, %{}}

  defp normalize_filters(filters) when is_map(filters) do
    with {:ok, query} <- normalize_search_query(Input.fetch_value(filters, :query)),
         {:ok, sort} <- normalize_product_sort(Input.fetch_value(filters, :sort)),
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

  defp normalize_filters(_filters), do: {:error, "invalid filters"}

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

  defp normalize_product_sort(nil), do: {:ok, nil}

  defp normalize_product_sort(sort)
       when sort in [:id_asc, :name_asc, :brand_name_asc, :newest],
       do: {:ok, sort}

  defp normalize_product_sort(sort) when is_binary(sort) do
    case sort |> String.trim() |> String.upcase() do
      "ID_ASC" -> {:ok, :id_asc}
      "NAME_ASC" -> {:ok, :name_asc}
      "BRAND_NAME_ASC" -> {:ok, :brand_name_asc}
      "NEWEST" -> {:ok, :newest}
      _invalid -> {:error, "invalid product sort"}
    end
  end

  defp normalize_product_sort(_sort), do: {:error, "invalid product sort"}

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

  defp load_taxon_attributes(loader, taxon_id) when is_integer(taxon_id) do
    Dataloader.load(loader, Catalog, {:many, TaxonAttribute}, taxon_id: taxon_id)
  end

  defp load_taxon_attributes(loader, _taxon_id), do: loader

  defp loaded_taxon_attributes(loader, taxon_id) when is_integer(taxon_id) do
    Dataloader.get(loader, Catalog, {:many, TaxonAttribute}, taxon_id: taxon_id)
  end

  defp loaded_taxon_attributes(_loader, _taxon_id), do: []

  @spec reverse_ok_list({:ok, list()} | {:error, String.t()}) ::
          {:ok, list()} | {:error, String.t()}
  defp reverse_ok_list({:ok, items}), do: {:ok, Enum.reverse(items)}
  defp reverse_ok_list({:error, _message} = error), do: error

  defp format_current_attributes(current_attributes, resolution \\ nil) do
    base_unit_symbols_by_dimension =
      current_attributes
      |> Enum.flat_map(&non_base_numeric_dimension_id/1)
      |> unit_symbols_for_dimensions(resolution)

    Enum.map(current_attributes, &format_current_attribute(&1, base_unit_symbols_by_dimension))
  end

  defp unit_symbols_for_dimensions(dimension_ids, nil),
    do: Specs.unit_symbols_for_dimensions(dimension_ids)

  defp unit_symbols_for_dimensions(dimension_ids, resolution) do
    case base_unit_symbol_cache_key(resolution) do
      nil -> Specs.unit_symbols_for_dimensions(dimension_ids)
      cache_key -> cached_unit_symbols_for_dimensions(dimension_ids, cache_key)
    end
  end

  defp cached_unit_symbols_for_dimensions(dimension_ids, cache_key) do
    dimension_ids = Enum.uniq(dimension_ids)
    cached_symbols = Process.get(cache_key, %{})

    missing_dimension_ids =
      Enum.reject(dimension_ids, &Map.has_key?(cached_symbols, &1))

    symbols =
      case missing_dimension_ids do
        [] ->
          cached_symbols

        ids ->
          fetched_symbols = Specs.unit_symbols_for_dimensions(ids)
          loaded_symbols = Map.new(ids, &{&1, Map.get(fetched_symbols, &1)})
          updated_symbols = Map.merge(cached_symbols, loaded_symbols)

          Process.put(cache_key, updated_symbols)
          updated_symbols
      end

    Map.take(symbols, dimension_ids)
  end

  defp clear_base_unit_symbol_cache(resolution) do
    if cache_key = base_unit_symbol_cache_key(resolution) do
      Process.delete(cache_key)
    end

    :ok
  end

  defp base_unit_symbol_cache_key(%{context: context}) when is_map(context),
    do: Map.get(context, @base_unit_symbol_cache_context_key)

  defp base_unit_symbol_cache_key(_resolution), do: nil

  defp non_base_numeric_dimension_id(%{
         attribute: %{data_type: :numeric, dimension_id: dimension_id},
         claim: %{value_num_base: %Decimal{}, unit: unit}
       })
       when is_integer(dimension_id) do
    if base_unit?(unit), do: [], else: [dimension_id]
  end

  defp non_base_numeric_dimension_id(_current_attribute), do: []

  defp format_current_attribute(
         %{attribute: attribute, claim: claim} = current_attribute,
         base_unit_symbols_by_dimension
       ) do
    taxon_attribute = Map.get(current_attribute, :taxon_attribute)

    %{
      attribute_id: GlobalId.encode(:attribute, attribute.id),
      code: attribute.code,
      display_name: attribute.display_name,
      data_type: Atom.to_string(attribute.data_type),
      value_text: format_claim_value(claim),
      sort_order: taxon_attribute && taxon_attribute.sort_order,
      group_label: taxon_attribute && taxon_attribute.compare_group_label,
      is_required: (taxon_attribute && taxon_attribute.is_required) || false,
      numeric_value: numeric_claim_value(claim),
      boolean_value: boolean_claim_value(claim),
      enum_option_id: GlobalId.encode_optional_value(:enum_option, claim.enum_option_id),
      unit_symbol: attribute_unit_symbol(attribute, claim, base_unit_symbols_by_dimension)
    }
  end

  defp numeric_claim_value(%{value_num_base: %Decimal{} = value}), do: value
  defp numeric_claim_value(_claim), do: nil

  defp boolean_claim_value(%{value_bool: value}) when is_boolean(value), do: value
  defp boolean_claim_value(_claim), do: nil

  defp format_claim_value(%{value_bool: value}) when is_boolean(value) do
    if value, do: "Yes", else: "No"
  end

  defp format_claim_value(%{value_int: value}) when is_integer(value),
    do: Integer.to_string(value)

  defp format_claim_value(%{value_num: %Decimal{} = value, unit: unit}) do
    value
    |> Decimal.normalize()
    |> Decimal.to_string(:normal)
    |> append_unit(unit)
  end

  defp format_claim_value(%{value_text: value}) when is_binary(value), do: value
  defp format_claim_value(%{value_date: %Date{} = value}), do: Date.to_iso8601(value)
  defp format_claim_value(%{value_ts: %DateTime{} = value}), do: DateTime.to_iso8601(value)
  defp format_claim_value(%{enum_option: %{label: value}}) when is_binary(value), do: value
  defp format_claim_value(%{value_json: value}) when is_map(value), do: Jason.encode!(value)
  defp format_claim_value(_claim), do: ""

  defp append_unit(value, %{symbol: symbol}) when is_binary(symbol) and symbol != "",
    do: "#{value} #{symbol}"

  defp append_unit(value, %{code: code}) when is_binary(code) and code != "",
    do: "#{value} #{code}"

  defp append_unit(value, _unit), do: value

  defp attribute_unit_symbol(
         %{data_type: :numeric, dimension_id: dimension_id},
         %{value_num_base: %Decimal{}, unit: unit},
         base_unit_symbols_by_dimension
       )
       when is_integer(dimension_id) do
    if base_unit?(unit) do
      unit_symbol(unit)
    else
      Map.get(base_unit_symbols_by_dimension, dimension_id)
    end
  end

  defp attribute_unit_symbol(%{data_type: :numeric}, %{value_num_base: %Decimal{}}, _symbols),
    do: nil

  defp attribute_unit_symbol(_attribute, claim, _symbols), do: unit_symbol(claim.unit)

  defp base_unit?(%{
         multiplier_to_base: %Decimal{} = multiplier,
         offset_to_base: %Decimal{} = offset
       }) do
    Decimal.equal?(multiplier, Decimal.new("1")) and Decimal.equal?(offset, Decimal.new("0"))
  end

  defp base_unit?(_unit), do: false

  defp unit_symbol(%{symbol: symbol}) when is_binary(symbol) and symbol != "", do: symbol
  defp unit_symbol(%{code: code}) when is_binary(code) and code != "", do: code
  defp unit_symbol(_unit), do: nil

  defp saved_comparison_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    %{
      saved_comparison_set: nil,
      errors: GraphQLErrors.changeset_mutation_errors(changeset)
    }
  end

  defp saved_comparison_error_payload(code, message, field \\ nil) do
    %{
      saved_comparison_set: nil,
      errors: [GraphQLErrors.mutation_error(code, message, field)]
    }
  end

  defp saved_comparison_error_payload(error) when is_map(error) do
    %{
      saved_comparison_set: nil,
      errors: [error]
    }
  end
end
