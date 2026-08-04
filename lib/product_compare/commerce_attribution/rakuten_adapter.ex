# ex_dna:disable-for-this-file
# reach:disable-for-this-file fixed_shape_map
# Rakuten payload vocabulary stays provider-local by the approved attribution design.
defmodule ProductCompare.CommerceAttribution.RakutenAdapter do
  @moduledoc """
  Normalizes already-fetched Rakuten transaction payloads into commerce conversions.
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
    reported_at = parse_datetime(value(payload, :process_date, "processDate", "ProcessDate"))

    payload
    |> publisher_reference()
    |> reference_attrs()
    |> Map.merge(%{
      source_network: "rakuten",
      network_conversion_ref:
        payload
        |> value(:transaction_id, "transactionId", "TransactionId")
        |> reference_token(),
      status: normalize_status(value(payload, :status, "status", "Status")),
      currency: value(payload, :currency, "currency", "Currency"),
      order_amount: decimal(value(payload, :sale_amount, "saleAmount", "SaleAmount")),
      commission_amount:
        decimal(value(payload, :commission_amount, "commissionAmount", "CommissionAmount")),
      purchased_at:
        parse_datetime(value(payload, :transaction_date, "transactionDate", "TransactionDate")),
      reported_at: reported_at,
      data_freshness_at: reported_at,
      raw_payload: payload
    })
    |> drop_nil_optional_attrs()
  end

  defp publisher_reference(payload) do
    case first_present(payload, [:member_id, "member ID", "Member ID"]) do
      :missing -> first_present(payload, [:u1, "u1"])
      reference -> reference
    end
  end

  defp reference_attrs(:missing), do: %{}

  defp reference_attrs({:present, value}) do
    case reference_token(value) do
      nil ->
        %{clear_click_attribution: true, network_click_ref: nil}

      token ->
        case ClickReference.decode("rakuten", token) do
          {:ok, public_click_id} ->
            %{public_click_id: public_click_id, network_click_ref: nil}

          :error ->
            %{clear_click_attribution: true, network_click_ref: token}
        end
    end
  end

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
      "pending" ->
        :pending

      "approved" ->
        :approved

      status when status in ["cancelled", "canceled", "declined", "returned", "reversed"] ->
        :reversed

      "paid" ->
        :paid

      unknown_status ->
        unknown_status
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
