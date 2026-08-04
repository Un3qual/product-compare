defmodule ProductCompare.CommerceAttribution.Revenue.Projection do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.Revenue.Filters

  @spec summary(map(), map(), non_neg_integer()) :: map()
  def summary(filters, aggregate_metrics, click_count) do
    metrics =
      aggregate_metrics
      |> project_metrics()
      |> Map.put("clicks", click_count)

    %{
      "filters" => Filters.for_dashboard(filters),
      "metrics" => metrics
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

  defp money_string(nil), do: "0.00"

  defp money_string(%Decimal{} = decimal) do
    decimal
    |> Decimal.round(2)
    |> Decimal.to_string(:normal)
  end

  defp nullable_money_string(nil), do: nil
  defp nullable_money_string(%Decimal{} = decimal), do: money_string(decimal)
end
