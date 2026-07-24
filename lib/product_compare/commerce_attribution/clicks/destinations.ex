defmodule ProductCompare.CommerceAttribution.Clicks.Destinations do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @affiliate_network_names %{
    "amazon" => :amazon_associates,
    "amazon associates" => :amazon_associates,
    "awin" => :awin,
    "cj" => :cj,
    "commission junction" => :cj,
    "impact" => :impact,
    "rakuten" => :rakuten
  }
  @click_id_query_keys MapSet.new(~w(ClickId clickId click_id subId subid sub_id))

  @spec for_merchant_product(pos_integer()) ::
          {:ok, map()} | {:error, :merchant_product_not_found}
  def for_merchant_product(merchant_product_id) do
    case Repo.get_by(MerchantProduct, id: merchant_product_id, is_active: true) do
      %MerchantProduct{} = merchant_product ->
        {:ok, destination_from_merchant_product(merchant_product)}

      nil ->
        {:error, :merchant_product_not_found}
    end
  end

  @spec append_public_click_id(String.t(), Ecto.UUID.t()) :: String.t()
  def append_public_click_id(destination_url, click_id) do
    uri = URI.parse(destination_url)
    query = uri.query || ""

    if has_click_id_query_param?(query) do
      destination_url
    else
      %{uri | query: append_click_id_query_param(query, click_id)}
      |> URI.to_string()
    end
  end

  defp destination_from_merchant_product(merchant_product) do
    case affiliate_link_for_merchant_product(merchant_product.id) do
      %AffiliateLink{} = affiliate_link ->
        affiliate_destination_or_fallback(affiliate_link, merchant_product)

      nil ->
        merchant_product_destination(merchant_product)
    end
  end

  defp affiliate_destination_or_fallback(affiliate_link, merchant_product) do
    affiliate_url = normalize_browser_accepted_destination_url(affiliate_link.affiliate_url)

    if CommerceLink.valid_destination_url?(affiliate_url) do
      %{
        destination_url: affiliate_url,
        affiliate_program_id: affiliate_program_id(affiliate_link, merchant_product),
        link_type: :affiliate,
        merchant_id: merchant_product.merchant_id,
        network: commerce_network(affiliate_link),
        backfilled_from_affiliate_links: true
      }
    else
      merchant_product_destination(merchant_product)
    end
  end

  defp merchant_product_destination(merchant_product) do
    %{
      destination_url: normalize_browser_accepted_destination_url(merchant_product.url),
      affiliate_program_id: nil,
      link_type: :non_affiliate,
      merchant_id: merchant_product.merchant_id,
      network: nil,
      backfilled_from_affiliate_links: false
    }
  end

  defp normalize_browser_accepted_destination_url(url) when is_binary(url) do
    url |> String.trim() |> String.replace("\\", "/") |> String.replace(" ", "%20")
  end

  defp normalize_browser_accepted_destination_url(url), do: url

  defp affiliate_link_for_merchant_product(merchant_product_id) do
    AffiliateLink
    |> Repo.get_by(merchant_product_id: merchant_product_id)
    |> Repo.preload(:affiliate_network)
  end

  defp affiliate_program_id(
         %AffiliateLink{affiliate_network_id: affiliate_network_id},
         %MerchantProduct{merchant_id: merchant_id}
       )
       when is_integer(affiliate_network_id) and is_integer(merchant_id) do
    case Repo.get_by(AffiliateProgram,
           affiliate_network_id: affiliate_network_id,
           merchant_id: merchant_id
         ) do
      %AffiliateProgram{id: affiliate_program_id} -> affiliate_program_id
      nil -> nil
    end
  end

  defp affiliate_program_id(_affiliate_link, _merchant_product), do: nil

  defp commerce_network(%AffiliateLink{affiliate_network: %{name: name}}) when is_binary(name) do
    name |> String.downcase() |> String.trim() |> then(&Map.get(@affiliate_network_names, &1))
  end

  defp commerce_network(_affiliate_link), do: nil

  defp has_click_id_query_param?(query) do
    query
    |> URI.decode_query()
    |> Map.keys()
    |> Enum.any?(&MapSet.member?(@click_id_query_keys, &1))
  end

  defp append_click_id_query_param("", click_id), do: URI.encode_query(%{"ClickId" => click_id})

  defp append_click_id_query_param(query, click_id),
    do: query <> "&" <> URI.encode_query(%{"ClickId" => click_id})
end
