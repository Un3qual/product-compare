defmodule ProductCompare.CommerceAttribution.Revenue.Projection do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Revenue.Filters

  @spec summary(map(), map(), non_neg_integer()) :: map()
  def summary(filters, aggregate_metrics, click_count) do
    metrics =
      aggregate_metrics
      |> project_metrics()
      |> Map.put("clicks", click_count)

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
