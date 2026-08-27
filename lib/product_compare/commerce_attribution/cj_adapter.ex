# ex_dna:disable-for-this-file
# reach:disable-for-this-file fixed_shape_map
# CJ payload vocabulary stays provider-local by the approved attribution design.
defmodule ProductCompare.CommerceAttribution.CJAdapter do
  @moduledoc """
  Normalizes already-fetched CJ commission payloads into commerce conversions.
  """

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.ClickReference

  @spec ingest_transaction(map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def ingest_transaction(payload) when is_map(payload) do
    payload
    |> normalize_transaction()
    |> CommerceAttribution.ingest_conversion()
  end

  defp normalize_transaction(payload) do
    reported_at = parse_datetime(value(payload, :posting_date, "postingDate", "PostingDate"))

    publisher_reference(payload)
    |> reference_attrs()
    |> Map.merge(%{
      source_network: "cj",
      network_conversion_ref:
        payload
        |> value(:commission_id, "commissionId", "CommissionId")
        |> reference_token(),
      network_action_ref:
        payload
        |> value(:original_action_id, "originalActionId", "OriginalActionId")
        |> reference_token(),
      status: normalize_status(value(payload, :action_status, "actionStatus", "ActionStatus")),
      currency: "USD",
      order_amount:
        decimal(
          value(payload, :sale_amount_usd, "saleAmountUsd", "SaleAmountUsd") ||
            value(payload, :sale_amount, "saleAmount", "SaleAmount")
        ),
      commission_amount:
        decimal(
          value(
            payload,
            :pub_commission_amount_usd,
            "pubCommissionAmountUsd",
            "PubCommissionAmountUsd"
          ) ||
            value(payload, :commission_amount, "commissionAmount", "CommissionAmount")
        ),
      purchased_at: parse_datetime(value(payload, :event_date, "eventDate", "EventDate")),
      reported_at: reported_at,
      data_freshness_at: reported_at,
      raw_payload: payload
    })
    |> drop_nil_optional_attrs()
  end

  defp reference_attrs(:missing), do: %{}

  defp reference_attrs({:present, value}) do
    case reference_token(value) do
      nil ->
        %{clear_click_attribution: true, network_click_ref: nil}

      token ->
        case ClickReference.decode("cj", token) do
          {:ok, public_click_id} ->
            %{public_click_id: public_click_id, network_click_ref: nil}

          :error ->
            %{clear_click_attribution: true, network_click_ref: token}
        end
    end
  end

  defp publisher_reference(payload),
    do: first_present(payload, [:shopper_id, "shopperId", "ShopperId", :sid, "SID", "sid"])

  defp first_present(_payload, []), do: :missing

  defp first_present(payload, [key | rest]) do
    case Map.fetch(payload, key) do
      {:ok, value} -> {:present, value}
      :error -> first_present(payload, rest)
    end
  end

  defp reference_token(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      token -> token
    end
  end

  defp reference_token(value) when is_integer(value), do: Integer.to_string(value)
  defp reference_token(_value), do: nil

  defp value(payload, atom_key, string_key, fallback_key) do
    Map.get(payload, atom_key) || Map.get(payload, string_key) || Map.get(payload, fallback_key)
  end

  defp normalize_status(status) when status in [:pending, :approved, :reversed, :paid],
    do: status

  defp normalize_status(status) when is_atom(status),
    do: status |> Atom.to_string() |> normalize_status()

  defp normalize_status(status) when is_binary(status) do
    case status |> String.trim() |> String.downcase() do
      status when status in ["new", "extended", "pending"] -> :pending
      status when status in ["locked", "closed", "approved"] -> :approved
      status when status in ["reversed", "declined", "invalid"] -> :reversed
      "paid" -> :paid
      unknown_status -> unknown_status
    end
  end

  defp normalize_status(nil), do: :missing
  defp normalize_status(status), do: status

  defp decimal(nil), do: nil
  defp decimal(%Decimal{} = value), do: value

  defp decimal(value) when is_binary(value) or is_integer(value) or is_float(value) do
    value = value |> to_string() |> String.trim()

    case Decimal.parse(value) do
      {%Decimal{} = decimal, ""} -> decimal
      _invalid -> nil
    end
  end

  defp decimal(_value), do: nil

  defp parse_datetime(nil), do: nil
  defp parse_datetime(%DateTime{} = value), do: value

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> datetime
      _invalid -> nil
    end
  end

  defp parse_datetime(_value), do: nil

  defp drop_nil_optional_attrs(attrs) do
    Map.drop(
      attrs,
      for(
        {field, nil} <- attrs,
        field not in [:network_conversion_ref, :network_click_ref, :reported_at],
        do: field
      )
    )
  end
end
