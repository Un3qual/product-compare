defmodule ProductCompare.Ingestion.Sources.CJ.ProductParser do
  @moduledoc """
  Fixture-backed parser for CJ product catalog records.
  """

  @behaviour ProductCompare.Ingestion.Sources.Adapter

  alias ProductCompare.Ingestion.NormalizedListing

  @impl true
  def fetch_batch(_cursor, _opts), do: {:error, :not_configured}

  @impl true
  def normalize(record) when is_map(record) do
    with {:ok, external_product_id} <- required_string(record, :external_product_id, ["adId"]),
         {:ok, merchant_identifier} <-
           required_string(record, :merchant_identifier, ["advertiserId"]),
         {:ok, product_title} <- required_string(record, :product_title, ["name"]),
         {:ok, listing_url} <- required_string(record, :listing_url, ["buyUrl"]),
         {:ok, currency} <- required_string(record, :currency, ["currency"]),
         {:ok, amount} <- decimal(record, :amount, ["price"]),
         {:ok, observed_at} <- datetime(record, :observed_at, ["lastUpdated"]) do
      {:ok,
       %NormalizedListing{
         source: :cj,
         external_product_id: external_product_id,
         merchant_identifier: merchant_identifier,
         product_title: product_title,
         brand_name: optional_string(record, ["brand"]),
         gtin: optional_string(record, ["gtin"]),
         merchant_name: optional_string(record, ["advertiserName"]),
         merchant_domain:
           optional_string(record, ["advertiserDomain"]) || domain_from_url(listing_url),
         listing_url: listing_url,
         currency: String.upcase(currency),
         amount: amount,
         availability: availability(record),
         observed_at: observed_at,
         raw_payload: record
       }}
    end
  end

  def normalize(_record), do: mapping_error(:invalid_record, nil)

  defp required_string(record, field, keys) do
    case optional_string(record, keys) do
      nil -> mapping_error(:missing_required_field, field)
      value -> {:ok, value}
    end
  end

  defp optional_string(record, keys) do
    Enum.find_value(keys, fn key ->
      case Map.get(record, key) do
        value when is_binary(value) ->
          value
          |> String.trim()
          |> blank_to_nil()

        value when is_integer(value) ->
          Integer.to_string(value)

        _ ->
          nil
      end
    end)
  end

  defp decimal(record, field, keys) do
    with {:ok, value} <- required_string(record, field, keys),
         {decimal, ""} <- Decimal.parse(value) do
      {:ok, decimal}
    else
      {:error, _reason} = error -> error
      _ -> mapping_error(:invalid_decimal, field)
    end
  end

  defp datetime(record, field, keys) do
    with {:ok, value} <- required_string(record, field, keys),
         {:ok, observed_at, 0} <- DateTime.from_iso8601(value) do
      {:ok, observed_at}
    else
      {:error, _reason} = error -> error
      _ -> mapping_error(:invalid_datetime, field)
    end
  end

  defp availability(%{"inStock" => true}), do: :in_stock
  defp availability(%{"inStock" => false}), do: :out_of_stock

  defp availability(%{"availability" => value}) when is_binary(value) do
    case value |> String.downcase() |> String.replace(~r/[\s_-]+/, "") do
      "instock" -> :in_stock
      "available" -> :in_stock
      "outofstock" -> :out_of_stock
      "unavailable" -> :out_of_stock
      _ -> :unknown
    end
  end

  defp availability(_record), do: :unknown

  defp domain_from_url(url) do
    url
    |> URI.parse()
    |> Map.get(:host)
    |> blank_to_nil()
  end

  defp blank_to_nil(nil), do: nil
  defp blank_to_nil(""), do: nil
  defp blank_to_nil(value), do: value

  defp mapping_error(reason, field), do: {:error, %{reason: reason, field: field}}
end
