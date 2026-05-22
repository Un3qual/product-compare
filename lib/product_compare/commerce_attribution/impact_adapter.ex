defmodule ProductCompare.CommerceAttribution.ImpactAdapter do
  @moduledoc """
  Normalizes Impact action payloads into commerce conversions.
  """

  alias ProductCompare.CommerceAttribution

  @spec ingest_action(map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def ingest_action(payload) when is_map(payload) do
    payload
    |> normalize_action()
    |> CommerceAttribution.ingest_conversion()
  end

  defp normalize_action(payload) do
    reported_at =
      parse_datetime(value(payload, :reporting_date, "ReportingDate", "reportingDate"))

    %{
      source_network: :impact,
      network_conversion_ref: value(payload, :action_id, "ActionId", "actionId"),
      public_click_id: value(payload, :click_id, "ClickId", "clickId"),
      status: normalize_status(value(payload, :status, "Status")),
      currency: value(payload, :currency, "Currency"),
      order_amount: decimal(value(payload, :sale_amount, "SaleAmount", "saleAmount")),
      commission_amount: decimal(value(payload, :payout, "Payout")),
      purchased_at: parse_datetime(value(payload, :event_date, "EventDate", "eventDate")),
      reported_at: reported_at,
      data_freshness_at: reported_at,
      merchant_product_id: integer(value(payload, :merchant_product_id, "MerchantProductId")),
      raw_payload: payload
    }
  end

  defp value(payload, atom_key, string_key), do: value(payload, atom_key, string_key, nil)

  defp value(payload, atom_key, string_key, fallback_key) do
    Map.get(payload, atom_key) ||
      Map.get(payload, string_key) ||
      (fallback_key && Map.get(payload, fallback_key))
  end

  defp normalize_status(nil), do: :pending

  defp normalize_status(status) when is_atom(status), do: status

  defp normalize_status(status) when is_binary(status) do
    case status |> String.trim() |> String.downcase() do
      "approved" -> :approved
      "reversed" -> :reversed
      "paid" -> :paid
      _status -> :pending
    end
  end

  defp decimal(nil), do: nil
  defp decimal(%Decimal{} = value), do: value
  defp decimal(value), do: Decimal.new(to_string(value))

  defp integer(nil), do: nil
  defp integer(value) when is_integer(value), do: value

  defp integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> int
      _error -> nil
    end
  end

  defp parse_datetime(nil), do: nil
  defp parse_datetime(%DateTime{} = datetime), do: datetime

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> datetime
      _error -> nil
    end
  end
end
