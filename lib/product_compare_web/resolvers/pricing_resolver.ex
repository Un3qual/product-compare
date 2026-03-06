defmodule ProductCompareWeb.Resolvers.PricingResolver do
  @moduledoc false

  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.GlobalId

  @spec merchants(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchants(_parent, args, _resolution) do
    query = Pricing.list_merchants_query()
    connection_args = Map.take(args || %{}, [:first, :after])

    case Connection.from_query(query, connection_args, Repo) do
      {:ok, connection} ->
        {:ok, connection}

      {:error, :invalid_cursor} ->
        {:error, "invalid cursor"}
    end
  end

  @spec merchant_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchant_products(_parent, %{input: input}, _resolution) do
    with {:ok, attrs} <- normalize_merchant_products_input(input) do
      query = Pricing.list_merchant_products_query(attrs)
      connection_args = Map.take(attrs, [:first, :after])

      case Connection.from_query(query, connection_args, Repo) do
        {:ok, connection} ->
          {:ok, connection}

        {:error, :invalid_cursor} ->
          {:error, "invalid cursor"}
      end
    end
  end

  defp normalize_merchant_products_input(input) when is_map(input) do
    with {:ok, product_id} <-
           cast_required_global_id(fetch_value(input, :product_id), :product, "product"),
         {:ok, merchant_id} <-
           cast_optional_global_id(fetch_value(input, :merchant_id), :merchant, "merchant") do
      {:ok,
       %{
         product_id: product_id,
         merchant_id: merchant_id,
         active_only: fetch_value(input, :active_only, false),
         first: fetch_value(input, :first),
         after: fetch_value(input, :after)
       }}
    end
  end

  defp normalize_merchant_products_input(_input), do: {:error, "invalid product id"}

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

  defp cast_optional_global_id(nil, _expected_type, _field_name), do: {:ok, nil}

  defp cast_optional_global_id(value, expected_type, field_name),
    do: cast_required_global_id(value, expected_type, field_name)

  defp fetch_value(map, key, default \\ nil),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key), default))
end
