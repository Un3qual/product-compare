defmodule ProductCompareWeb.Resolvers.CatalogResolver do
  @moduledoc false

  alias ProductCompare.Catalog
  alias ProductCompare.Catalog.Filtering
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.SavedComparisonSet

  @spec product(any(), map(), Absinthe.Resolution.t()) :: {:ok, Product.t() | nil}
  def product(_parent, args, _resolution) do
    {:ok, Catalog.get_product_by_slug(fetch_value(args || %{}, :slug))}
  end

  @spec products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def products(_parent, args, _resolution) do
    with {:ok, filters} <- normalize_filters(fetch_value(args || %{}, :filters, %{})) do
      query = Filtering.apply_filters(Product, filters)

      connection_args = Map.take(args || %{}, [:first, :after])

      case Connection.from_query(query, connection_args, Repo) do
        {:ok, connection} ->
          {:ok, connection}

        {:error, :invalid_cursor} ->
          {:error, "invalid cursor"}
      end
    end
  end

  @spec my_saved_comparison_sets(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def my_saved_comparison_sets(_parent, args, %{context: %{current_user: current_user}}) do
    query = Catalog.list_saved_comparison_sets_query(current_user.id)
    connection_args = Map.take(args || %{}, [:first, :after])

    case Connection.from_query(query, connection_args, Repo) do
      {:ok, connection} ->
        {:ok, connection}

      {:error, :invalid_cursor} ->
        {:error, "invalid cursor"}
    end
  end

  def my_saved_comparison_sets(_parent, _args, _resolution), do: {:error, "unauthorized"}

  @spec create_saved_comparison_set(any(), %{input: map()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def create_saved_comparison_set(_parent, %{input: input}, %{context: %{current_user: current_user}}) do
    with {:ok, product_ids} <-
           cast_global_id_list(fetch_list_value(input, :product_ids), :product, "product") do
      attrs = %{
        name: fetch_value(input, :name),
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
    do: {:ok, saved_comparison_error_payload("UNAUTHORIZED", "unauthorized")}

  @spec delete_saved_comparison_set(any(), %{saved_comparison_set_id: String.t()}, Absinthe.Resolution.t()) ::
          {:ok, map()}
  def delete_saved_comparison_set(
        _parent,
        %{saved_comparison_set_id: saved_comparison_set_id},
        %{context: %{current_user: current_user}}
      ) do
    with {:ok, entropy_id} <-
           cast_required_entropy_global_id(
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
    do: {:ok, saved_comparison_error_payload("UNAUTHORIZED", "unauthorized")}

  @spec normalize_filters(map() | nil) :: {:ok, map()} | {:error, String.t()}
  defp normalize_filters(nil), do: {:ok, %{}}

  defp normalize_filters(filters) when is_map(filters) do
    with {:ok, primary_type_taxon_id} <-
           cast_optional_global_id(fetch_value(filters, :primary_type_taxon_id), :taxon, "taxon"),
         {:ok, include_type_descendants} <-
           normalize_boolean(fetch_value(filters, :include_type_descendants, false)),
         {:ok, numeric_filters} <- normalize_numeric_filters(fetch_list_value(filters, :numeric)),
         {:ok, boolean_filters} <-
           normalize_boolean_filters(fetch_list_value(filters, :booleans)),
         {:ok, enum_filters} <- normalize_enum_filters(fetch_list_value(filters, :enums)),
         {:ok, use_case_taxon_ids} <-
           cast_global_id_list(fetch_list_value(filters, :use_case_taxon_ids), :taxon, "taxon") do
      normalized_filters =
        %{
          include_type_descendants: include_type_descendants,
          numeric: numeric_filters,
          booleans: boolean_filters,
          enums: enum_filters,
          use_case_taxon_ids: use_case_taxon_ids
        }
        |> maybe_put(:primary_type_taxon_id, primary_type_taxon_id)

      {:ok, normalized_filters}
    end
  end

  defp normalize_filters(_filters), do: {:error, "invalid filters"}

  @spec normalize_numeric_filters(any()) :: {:ok, [map()]} | {:error, String.t()}
  defp normalize_numeric_filters(filters) when is_list(filters) do
    Enum.reduce_while(filters, {:ok, []}, fn filter, {:ok, acc} ->
      with true <- is_map(filter),
           {:ok, attribute_id} <-
             cast_required_global_id(fetch_value(filter, :attribute_id), :attribute, "attribute"),
           {:ok, min} <- normalize_decimal(fetch_value(filter, :min)),
           {:ok, max} <- normalize_decimal(fetch_value(filter, :max)) do
        normalized_filter =
          %{attribute_id: attribute_id}
          |> maybe_put(:min, min)
          |> maybe_put(:max, max)

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
             cast_required_global_id(fetch_value(filter, :attribute_id), :attribute, "attribute"),
           value when is_boolean(value) <- fetch_value(filter, :value) do
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
             cast_required_global_id(fetch_value(filter, :attribute_id), :attribute, "attribute"),
           {:ok, enum_option_id} <-
             cast_required_global_id(
               fetch_value(filter, :enum_option_id),
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

  @spec cast_optional_global_id(any(), GlobalId.type(), String.t()) ::
          {:ok, pos_integer() | nil} | {:error, String.t()}
  defp cast_optional_global_id(nil, _expected_type, _field_name), do: {:ok, nil}

  defp cast_optional_global_id(value, expected_type, field_name),
    do: cast_required_global_id(value, expected_type, field_name)

  @spec cast_global_id_list(any(), GlobalId.type(), String.t()) ::
          {:ok, [pos_integer()]} | {:error, String.t()}
  defp cast_global_id_list(nil, _expected_type, _field_name), do: {:ok, []}

  defp cast_global_id_list(values, expected_type, field_name) when is_list(values) do
    Enum.reduce_while(values, {:ok, []}, fn value, {:ok, acc} ->
      case cast_required_global_id(value, expected_type, field_name) do
        {:ok, normalized_value} ->
          {:cont, {:ok, [normalized_value | acc]}}

        {:error, _} = error ->
          {:halt, error}
      end
    end)
    |> reverse_ok_list()
  end

  defp cast_global_id_list(_values, _expected_type, _field_name),
    do: {:error, "invalid filter ids"}

  @spec cast_required_global_id(any(), GlobalId.type(), String.t()) ::
          {:ok, pos_integer()} | {:error, String.t()}
  defp cast_required_global_id(value, expected_type, field_name) when is_binary(value) do
    with {:ok, {^expected_type, local_id}} <- GlobalId.decode(value),
         {parsed_id, ""} <- Integer.parse(local_id),
         true <- parsed_id > 0 do
      {:ok, parsed_id}
    else
      _ -> {:error, "invalid #{field_name} id"}
    end
  end

  defp cast_required_global_id(_value, _expected_type, field_name),
    do: {:error, "invalid #{field_name} id"}

  @spec cast_required_entropy_global_id(any(), GlobalId.type(), String.t()) ::
          {:ok, Ecto.UUID.t()} | {:error, String.t()}
  defp cast_required_entropy_global_id(value, expected_type, field_name) when is_binary(value) do
    with {:ok, {^expected_type, entropy_id}} <- GlobalId.decode(value),
         {:ok, normalized_entropy_id} <- Ecto.UUID.cast(entropy_id) do
      {:ok, normalized_entropy_id}
    else
      _ -> {:error, "invalid #{field_name} id"}
    end
  end

  defp cast_required_entropy_global_id(_value, _expected_type, field_name),
    do: {:error, "invalid #{field_name} id"}

  @spec normalize_decimal(any()) :: {:ok, Decimal.t() | number() | nil} | {:error, String.t()}
  defp normalize_decimal(nil), do: {:ok, nil}
  defp normalize_decimal(%Decimal{} = value), do: {:ok, value}
  defp normalize_decimal(value) when is_integer(value) or is_float(value), do: {:ok, value}

  defp normalize_decimal(value) when is_binary(value) do
    case Decimal.parse(value) do
      {decimal, ""} -> {:ok, decimal}
      _ -> {:error, "invalid numeric value"}
    end
  end

  defp normalize_decimal(_value), do: {:error, "invalid numeric value"}

  @spec reverse_ok_list({:ok, list()} | {:error, String.t()}) ::
          {:ok, list()} | {:error, String.t()}
  defp reverse_ok_list({:ok, items}), do: {:ok, Enum.reverse(items)}
  defp reverse_ok_list({:error, _} = error), do: error

  @spec fetch_value(map(), atom(), any()) :: any()
  defp fetch_value(map, key, default \\ nil),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key), default))

  @spec fetch_list_value(map(), atom()) :: any()
  defp fetch_list_value(map, key) do
    case fetch_value(map, key, []) do
      nil -> []
      value -> value
    end
  end

  @spec normalize_boolean(any()) :: {:ok, boolean()}
  defp normalize_boolean(true), do: {:ok, true}
  defp normalize_boolean(false), do: {:ok, false}
  defp normalize_boolean(_value), do: {:ok, false}

  @spec maybe_put(map(), atom(), any()) :: map()
  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp saved_comparison_changeset_error_payload(%Ecto.Changeset{} = changeset) do
    %{
      saved_comparison_set: nil,
      errors: changeset_errors(changeset)
    }
  end

  defp saved_comparison_error_payload(code, message, field \\ nil) do
    %{
      saved_comparison_set: nil,
      errors: [mutation_error(code, message, field)]
    }
  end

  defp changeset_errors(%Ecto.Changeset{} = changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(fn {message, opts} ->
      opts_by_key = Map.new(opts, fn {k, v} -> {to_string(k), v} end)

      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts_by_key
        |> Map.get(key, key)
        |> to_string()
      end)
    end)
    |> Enum.flat_map(fn {field, messages} ->
      Enum.map(messages, &mutation_error("INVALID_ARGUMENT", &1, Atom.to_string(field)))
    end)
  end

  defp mutation_error(code, message, field) do
    %{code: code, message: message, field: field}
  end
end
