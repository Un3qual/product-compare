defmodule ProductCompare.CommerceAttribution.Clicks.Destinations do
  @moduledoc false

  alias ProductCompare.CommerceAttribution.ClickReference
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.Pricing.MerchantProduct

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

  @spec put_public_click_reference(String.t(), String.t() | nil, Ecto.UUID.t()) :: String.t()
  def put_public_click_reference(destination_url, network, click_id) do
    with parameter when is_binary(parameter) <- ClickReference.outbound_parameter(network),
         reference when is_binary(reference) <- ClickReference.encode(network, click_id) do
      destination_url
      |> URI.parse()
      |> put_reserved_query_parameter(parameter, reference)
      |> URI.to_string()
    else
      _unmapped_network_or_click_id -> destination_url
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
    affiliate_program_id = affiliate_program_id(affiliate_link, merchant_product)

    if CommerceLink.valid_destination_url?(affiliate_url) and is_integer(affiliate_program_id) do
      %{
        destination_url: affiliate_url,
        affiliate_program_id: affiliate_program_id,
        link_type: :affiliate,
        merchant_id: merchant_product.merchant_id,
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

  defp put_reserved_query_parameter(uri, parameter, reference) do
    query_pairs =
      case uri.query do
        query when is_binary(query) and query != "" -> String.split(query, "&", trim: false)
        _missing_query -> []
      end
      |> Enum.reject(&reserved_query_component?(&1, parameter))

    reference_pair = parameter <> "=" <> URI.encode_www_form(reference)

    %{uri | query: Enum.join(query_pairs ++ [reference_pair], "&")}
  end

  defp reserved_query_component?(component, parameter) do
    raw_key = component |> String.split("=", parts: 2) |> hd()

    URI.decode_www_form(raw_key) == parameter
  rescue
    ArgumentError -> false
  end
end
