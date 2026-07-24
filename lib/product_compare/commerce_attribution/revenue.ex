defmodule ProductCompare.CommerceAttribution.Revenue do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Revenue.Aggregation
  alias ProductCompare.CommerceAttribution.Revenue.Filters

  @spec dashboard_revenue_summary(map() | keyword()) :: map()
  def dashboard_revenue_summary(opts \\ %{}) do
    filters = Filters.normalize(opts)

    metrics =
      filters
      |> Aggregation.metrics()
      |> project_metrics()
      |> Map.put("clicks", Aggregation.click_count(filters))

    {metrics, suppressed?} = maybe_suppress_metrics(metrics, filters.min_conversions)

    %{
      "filters" => Filters.for_dashboard(filters),
      "metrics" => metrics,
      "suppression" => %{
        "suppressed" => suppressed?,
        "threshold" => filters.min_conversions
      }
    }
  end

  @spec merchant_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def merchant_revenue_summary(merchant_id, opts \\ %{}) do
    opts
    |> Filters.put(:merchant_id, merchant_id)
    |> dashboard_revenue_summary()
  end

  @spec product_revenue_summary(pos_integer(), map() | keyword()) :: map()
  def product_revenue_summary(product_id, opts \\ %{}) do
    opts
    |> Filters.put(:product_id, product_id)
    |> dashboard_revenue_summary()
  end

  @spec network_revenue_summary(atom() | String.t(), map() | keyword()) :: map()
  def network_revenue_summary(network, opts \\ %{}) do
    opts
    |> Filters.put(:network, network)
    |> dashboard_revenue_summary()
  end

  defp project_metrics(metrics) do
    %{
      "average_paid_price" => nullable_money_string(metrics.average_paid_price),
      "commission_revenue" => money_string(metrics.commission_revenue),
      "conversions" => metrics.conversions,
      "currency" => metrics.currency,
      "gross_order_value" => money_string(metrics.gross_order_value)
    }
  end

  defp maybe_suppress_metrics(metrics, min_conversions) when min_conversions > 0 do
    if metrics["conversions"] < min_conversions do
      {Map.new(Map.keys(metrics), &{&1, nil}), true}
    else
      {metrics, false}
    end
  end

  defp maybe_suppress_metrics(metrics, _min_conversions), do: {metrics, false}

  defp money_string(nil), do: "0.00"

  defp money_string(%Decimal{} = decimal) do
    decimal
    |> Decimal.round(2)
    |> Decimal.to_string(:normal)
  end

  defp nullable_money_string(nil), do: nil
  defp nullable_money_string(%Decimal{} = decimal), do: money_string(decimal)
end
