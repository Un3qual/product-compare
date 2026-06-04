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
         {:ok, product_title} <- required_string(record, :product_title, ["name", "title"]),
         {:ok, listing_url} <- required_string(record, :listing_url, ["buyUrl", "link"]),
         {:ok, currency} <-
           required_string(record, :currency, ["currency"], [["price", "currency"]]),
         {:ok, amount} <- decimal(record, :amount, ["price"], [["price", "amount"]]),
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

  defp required_string(record, field, keys, paths \\ []) do
    case optional_string(record, keys, paths) do
      nil -> mapping_error(:missing_required_field, field)
      value -> {:ok, value}
    end
  end

  defp optional_string(record, keys, paths \\ []) do
    Enum.find_value(keys, &string_value(Map.get(record, &1))) ||
      Enum.find_value(paths, fn path ->
        record
        |> get_in(path)
        |> string_value()
      end)
  end

  defp decimal(record, field, keys, paths) do
    with {:ok, value} <- required_string(record, field, keys, paths),
         {decimal, ""} <- Decimal.parse(value) do
      {:ok, decimal}
    else
      {:error, _reason} = error -> error
      _ -> mapping_error(:invalid_decimal, field)
    end
  end

  defp datetime(record, field, keys) do
    with {:ok, value} <- required_string(record, field, keys),
         {:ok, observed_at, _offset} <- DateTime.from_iso8601(value) do
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

  defp string_value(value) when is_binary(value) do
    value
    |> String.trim()
    |> blank_to_nil()
  end

  defp string_value(value) when is_integer(value), do: Integer.to_string(value)
  defp string_value(value) when is_float(value), do: Float.to_string(value)
  defp string_value(_value), do: nil

  defp mapping_error(reason, field), do: {:error, %{reason: reason, field: field}}
end
