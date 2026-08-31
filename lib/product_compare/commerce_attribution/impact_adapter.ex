# ex_dna:disable-for-this-file
# Impact payload vocabulary stays provider-local by the approved attribution design.
defmodule ProductCompare.CommerceAttribution.ImpactAdapter do
  @moduledoc """
  Normalizes Impact action payloads into commerce conversions.
  """

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.ClickReference
  alias ProductCompareSchemas.DecimalInput

  @spec ingest_action(map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def ingest_action(payload) do
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
      network_conversion_ref:
        payload
        |> value(:action_id, "ActionId", "actionId")
        |> click_reference_token(),
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
    publisher_reference = publisher_reference(payload)

    network_click_ref =
      payload
      |> value(:click_id, "ClickId", "clickId")
      |> click_reference_token()

    attrs = if network_click_ref, do: %{network_click_ref: network_click_ref}, else: %{}

    case publisher_reference do
      :missing ->
        attrs

      {:present, value} ->
        case ClickReference.decode("impact", click_reference_token(value)) do
          {:ok, public_click_id} ->
            Map.put(attrs, :public_click_id, public_click_id)

          :error ->
            attrs
            |> Map.put(:clear_click_attribution, true)
            |> put_network_click_ref(click_reference_token(value))
        end
    end
  end

  defp publisher_reference(payload), do: first_present(payload, [:sub_id1, "SubId1", "subId1"])

  defp first_present(_payload, []), do: :missing

  defp first_present(payload, [key | rest]) do
    case Map.fetch(payload, key) do
      {:ok, value} -> {:present, value}
      :error -> first_present(payload, rest)
    end
  end

  defp put_network_click_ref(attrs, nil), do: attrs

  defp put_network_click_ref(attrs, reference),
    do: Map.put_new(attrs, :network_click_ref, reference)

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

  defp decimal(value), do: DecimalInput.to_decimal(value)

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
