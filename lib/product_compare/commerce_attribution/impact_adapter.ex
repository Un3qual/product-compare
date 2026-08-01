defmodule ProductCompare.CommerceAttribution.ImpactAdapter do
  @moduledoc """
  Normalizes Impact action payloads into commerce conversions.
  """

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.ClickReference

  @spec ingest_action(map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def ingest_action(payload) when is_map(payload) do
    payload
    |> normalize_action()
    |> CommerceAttribution.ingest_conversion()
  end

  defp normalize_action(payload) do
    reported_at =
      parse_datetime(value(payload, :reporting_date, "ReportingDate", "reportingDate"))

    payload
    |> click_reference_attrs()
    |> Map.merge(%{
      source_network: "impact",
      network_conversion_ref: value(payload, :action_id, "ActionId", "actionId"),
      status: normalize_status(value(payload, :status, "Status")),
      currency: value(payload, :currency, "Currency"),
      order_amount: decimal(value(payload, :sale_amount, "SaleAmount", "saleAmount")),
      commission_amount: decimal(value(payload, :payout, "Payout")),
      purchased_at: parse_datetime(value(payload, :event_date, "EventDate", "eventDate")),
      reported_at: reported_at,
      data_freshness_at: reported_at,
      merchant_product_id: integer(value(payload, :merchant_product_id, "MerchantProductId")),
      raw_payload: payload
    })
    |> drop_nil_optional_attrs()
  end

  defp click_reference_attrs(payload) do
    publisher_reference =
      payload
      |> value(:sub_id1, "SubId1", "subId1")
      |> click_reference_token()

    network_click_ref =
      payload
      |> value(:click_id, "ClickId", "clickId")
      |> click_reference_token()

    attrs = if network_click_ref, do: %{network_click_ref: network_click_ref}, else: %{}

    case ClickReference.decode("impact", publisher_reference) do
      {:ok, public_click_id} ->
        Map.put(attrs, :public_click_id, public_click_id)

      :error when not is_nil(publisher_reference) and is_nil(network_click_ref) ->
        Map.put(attrs, :network_click_ref, publisher_reference)

      :error ->
        attrs
    end
  end

  defp click_reference_token(nil), do: nil
  defp click_reference_token(value) when is_integer(value), do: Integer.to_string(value)

  defp click_reference_token(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      token -> token
    end
  end

  defp click_reference_token(_value), do: nil

  defp value(payload, atom_key, string_key), do: value(payload, atom_key, string_key, nil)

  defp value(payload, atom_key, string_key, fallback_key) do
    Map.get(payload, atom_key) ||
      Map.get(payload, string_key) ||
      (fallback_key && Map.get(payload, fallback_key))
  end

  defp normalize_status(nil), do: :missing

  defp normalize_status(status) when status in [:pending, :approved, :reversed, :paid], do: status

  defp normalize_status(status) when is_atom(status), do: status

  defp normalize_status(status) when is_binary(status) do
    case status |> String.trim() |> String.downcase() do
      "approved" -> :approved
      "pending" -> :pending
      "reversed" -> :reversed
      "paid" -> :paid
      unknown_status -> unknown_status
    end
  end

  defp normalize_status(status), do: status

  defp decimal(nil), do: nil
  defp decimal(%Decimal{} = value), do: value

  defp decimal(value) when is_binary(value) or is_integer(value) or is_float(value) do
    value = value |> to_string() |> String.trim()

    case Decimal.parse(value) do
      {%Decimal{} = decimal, ""} -> decimal
      {%Decimal{}, _rest} -> nil
      :error -> nil
    end
  end

  defp decimal(_value), do: nil

  defp integer(nil), do: nil
  defp integer(value) when is_integer(value), do: value

  defp integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {int, ""} -> int
      _error -> nil
    end
  end

  defp integer(_value), do: nil

  defp parse_datetime(nil), do: nil
  defp parse_datetime(%DateTime{} = datetime), do: datetime

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> datetime
      _error -> nil
    end
  end

  defp parse_datetime(_value), do: nil

  defp drop_nil_optional_attrs(attrs) do
    Map.drop(
      attrs,
      for(
        {field, nil} <- attrs,
        field not in [:network_conversion_ref, :reported_at],
        do: field
      )
    )
  end
end
