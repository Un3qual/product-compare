defmodule ProductCompareWeb.Resolvers.CommerceAttributionResolver do
  @moduledoc false

  alias ProductCompare.CommerceAttribution
  alias ProductCompareWeb.GraphQL.GlobalId

  @invalid_filters_error "invalid revenue summary filters"
  @max_bigint_id 9_223_372_036_854_775_807
  @public_min_conversions 2

  @spec revenue_summary(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def revenue_summary(_parent, args, _resolution) do
    input = fetch_value(args || %{}, :input, %{}) || %{}

    with {:ok, filters} <- normalize_revenue_summary_input(input),
         {:ok, summary} <-
           filters
           |> CommerceAttribution.dashboard_revenue_summary()
           |> graphql_summary() do
      {:ok, summary}
    else
      {:error, _reason} -> {:error, @invalid_filters_error}
    end
  rescue
    ArgumentError -> {:error, @invalid_filters_error}
  end

  defp normalize_revenue_summary_input(input) when is_map(input) do
    with {:ok, merchant_id} <-
           cast_optional_global_id(fetch_value(input, :merchant_id), :merchant),
         {:ok, product_id} <- cast_optional_global_id(fetch_value(input, :product_id), :product) do
      filters =
        %{
          currency: fetch_value(input, :currency),
          from: fetch_value(input, :from),
          merchant_id: merchant_id,
          min_conversions: @public_min_conversions,
          network: fetch_value(input, :network),
          product_id: product_id,
          to: fetch_value(input, :to)
        }
        |> drop_nil_values()

      {:ok, filters}
    else
      {:error, _reason} -> {:error, :invalid_id}
    end
  end

  defp normalize_revenue_summary_input(_input), do: {:error, :invalid_input}

  defp graphql_summary(%{
         "filters" => filters,
         "metrics" => metrics,
         "suppression" => suppression
       }) do
    {:ok,
     %{
       filters: %{
         currency: filters["currency"],
         from: filters["from"],
         merchant_id: encode_optional_global_id(:merchant, filters["merchant_id"]),
         network: filters["network"],
         product_id: encode_optional_global_id(:product, filters["product_id"]),
         to: filters["to"]
       },
       metrics: %{
         average_paid_price: metrics["average_paid_price"],
         clicks: metrics["clicks"],
         commission_revenue: metrics["commission_revenue"],
         conversions: metrics["conversions"],
         currency: metrics["currency"],
         gross_order_value: metrics["gross_order_value"]
       },
       suppression: %{
         suppressed: suppression["suppressed"],
         threshold: suppression["threshold"]
       }
     }}
  end

  defp graphql_summary(_summary), do: {:error, :invalid_summary}

  defp cast_optional_global_id(nil, _expected_type), do: {:ok, nil}

  defp cast_optional_global_id(value, expected_type) when is_binary(value) do
    with {:ok, {^expected_type, local_id}} <- GlobalId.decode(value),
         {parsed_id, ""} <- Integer.parse(local_id),
         true <- parsed_id > 0 and parsed_id <= @max_bigint_id do
      {:ok, parsed_id}
    else
      _invalid -> {:error, :invalid_id}
    end
  end

  defp cast_optional_global_id(_value, _expected_type), do: {:error, :invalid_id}

  defp encode_optional_global_id(_type, nil), do: nil

  defp encode_optional_global_id(type, value) when is_integer(value),
    do: GlobalId.encode(type, Integer.to_string(value))

  defp drop_nil_values(map) do
    Map.reject(map, fn {_key, value} -> is_nil(value) end)
  end

  defp fetch_value(map, key, default \\ nil),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key), default))
end
