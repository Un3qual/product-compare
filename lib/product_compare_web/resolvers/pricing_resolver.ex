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
    run_connection(query, connection_args(args))
  end

  @spec merchant_products(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def merchant_products(_parent, %{input: input}, _resolution) do
    with {:ok, attrs} <- normalize_merchant_products_input(input) do
      query = Pricing.list_merchant_products_query(attrs)
      run_connection(query, connection_args(attrs))
    end
  end

  @spec latest_price(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, ProductCompareSchemas.Pricing.PricePoint.t() | nil}
  def latest_price(%{id: merchant_product_id}, _args, _resolution)
      when is_integer(merchant_product_id) do
    {:ok, Pricing.latest_price(merchant_product_id)}
  end

  def latest_price(_merchant_product, _args, _resolution), do: {:ok, nil}

  @spec price_history(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def price_history(%{id: merchant_product_id}, args, _resolution)
      when is_integer(merchant_product_id) do
    query =
      Pricing.price_history_query(merchant_product_id, %{
        from: fetch_value(args || %{}, :from),
        to: fetch_value(args || %{}, :to)
      })

    run_connection(query, connection_args(args))
  end

  def price_history(_merchant_product, _args, _resolution),
    do: {:error, "invalid merchant product id"}

  defp run_connection(query, args) do
    case Connection.from_query(query, args, Repo) do
      {:ok, connection} ->
        {:ok, connection}

      {:error, :invalid_cursor} ->
        {:error, "invalid cursor"}

      {:error, _reason} ->
        {:error, "invalid pagination arguments"}
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

  defp connection_args(args) do
    %{
      first: fetch_value(args || %{}, :first),
      after: fetch_value(args || %{}, :after)
    }
  end

  defp fetch_value(map, key, default \\ nil),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key), default))
end
