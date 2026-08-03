defmodule ProductCompare.CommerceAttribution.AwinAdapter do
  @moduledoc """
  Normalizes already-fetched Awin transaction payloads into commerce conversions.
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
    reported_at =
      parse_datetime(value(payload, :validation_date, "validationDate", "ValidationDate")) ||
        parse_datetime(value(payload, :transaction_date, "transactionDate", "TransactionDate"))

    sale_amount = value(payload, :sale_amount, "saleAmount", "SaleAmount")
    commission_amount = value(payload, :commission_amount, "commissionAmount", "CommissionAmount")

    value(payload, :click_ref, "clickRef", "ClickRef")
    |> reference_attrs()
    |> Map.merge(%{
      source_network: "awin",
      network_conversion_ref:
        payload
        |> value(:id, "id", "Id")
        |> reference_token(),
      status:
        normalize_status(
          value(payload, :commission_status, "commissionStatus", "CommissionStatus")
        ),
      currency: amount_currency(commission_amount) || amount_currency(sale_amount),
      order_amount: amount_decimal(sale_amount),
      commission_amount: amount_decimal(commission_amount),
      purchased_at:
        parse_datetime(value(payload, :transaction_date, "transactionDate", "TransactionDate")),
      reported_at: reported_at,
      data_freshness_at: reported_at,
      raw_payload: payload
    })
    |> drop_nil_optional_attrs()
  end

  defp reference_attrs(value) do
    case reference_token(value) do
      nil ->
        %{}

      token ->
        case ClickReference.decode("awin", token) do
          {:ok, public_click_id} -> %{public_click_id: public_click_id}
          :error -> %{clear_click_attribution: true, network_click_ref: token}
        end
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
      "pending" -> :pending
      status when status in ["approved", "validated"] -> :approved
      status when status in ["declined", "rejected", "reversed"] -> :reversed
      "paid" -> :paid
      unknown_status -> unknown_status
    end
  end

  defp normalize_status(nil), do: :missing
  defp normalize_status(status), do: status

  defp amount_decimal(amount) when is_map(amount),
    do: amount |> value(:amount, "amount", nil) |> decimal()

  defp amount_decimal(value), do: decimal(value)

  defp amount_currency(amount) when is_map(amount),
    do: value(amount, :currency, "currency", nil)

  defp amount_currency(_value), do: nil

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
        field not in [:network_conversion_ref, :reported_at],
        do: field
      )
    )
  end
end
