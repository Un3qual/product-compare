defmodule ProductCompareWeb.Resolvers.CommerceAttributionResolver do
  @moduledoc false

  alias ProductCompare.CommerceAttribution
  alias ProductCompareWeb.GraphQL.Input
  alias ProductCompareWeb.GraphQL.GlobalId

  @invalid_filters_error "invalid revenue summary filters"
  @public_min_conversions 2

  @spec revenue_summary(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def revenue_summary(_parent, args, _resolution) do
    input = Input.fetch_value(args || %{}, :input, %{}) || %{}

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
    with {:ok, input} <-
           Input.decode_optional_integer_id_field(input, :merchant_id, :merchant, "merchant"),
         {:ok, input} <-
           Input.decode_optional_integer_id_field(input, :product_id, :product, "product") do
      filters =
        %{
          currency: Input.fetch_value(input, :currency),
          from: Input.fetch_value(input, :from),
          merchant_id: Input.fetch_value(input, :merchant_id),
          min_conversions: @public_min_conversions,
          network: Input.fetch_value(input, :network),
          product_id: Input.fetch_value(input, :product_id),
          to: Input.fetch_value(input, :to)
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
         merchant_id: GlobalId.encode_optional_value(:merchant, filters["merchant_id"]),
         network: filters["network"],
         product_id: GlobalId.encode_optional_value(:product, filters["product_id"]),
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

  defp drop_nil_values(map) do
    Map.reject(map, fn {_key, value} -> is_nil(value) end)
  end
end
