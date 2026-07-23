defmodule ProductCompare.ComparisonSnapshots.Capture do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Pricing
  alias ProductCompare.Recommendations
  alias ProductCompare.Recommendations.Result, as: RecommendationResult
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Specs.ClaimValue
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.MerchantProduct

  def load_products(product_ids) do
    products =
      Product
      |> where([product], product.id in ^product_ids)
      |> preload([:brand])
      |> Repo.all()
      |> Map.new(&{&1.id, &1})

    if map_size(products) == length(product_ids) do
      {:ok, Enum.map(product_ids, &Map.fetch!(products, &1))}
    else
      {:error, :product_not_found}
    end
  end

  def capture(products, profile, now) do
    product_ids = Enum.map(products, & &1.id)
    recommendation = Recommendations.compare(product_ids, profile, now: now)
    attributes_by_product = Specs.list_current_attributes_for_products(product_ids)
    offer_truths_by_product = Pricing.current_offer_truths(product_ids, now: now)
    merchants_by_offer_id = captured_merchants_by_offer_id(offer_truths_by_product)

    %{
      version: 1,
      captured_at: DateTime.to_iso8601(now),
      products:
        Enum.map(
          products,
          &capture_product(
            &1,
            attributes_by_product,
            offer_truths_by_product,
            merchants_by_offer_id
          )
        ),
      recommendation: capture_recommendation(recommendation)
    }
  end

  defp capture_product(
         product,
         attributes_by_product,
         offer_truths_by_product,
         merchants_by_offer_id
       ) do
    %{
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      model_number: product.model_number,
      brand_name: product.brand && product.brand.name,
      attributes:
        attributes_by_product
        |> Map.fetch!(product.id)
        |> Enum.map(&capture_attribute/1),
      offers:
        offer_truths_by_product
        |> Map.fetch!(product.id)
        |> capture_offers(merchants_by_offer_id)
    }
  end

  defp capture_attribute(%{attribute: attribute, claim: claim}) do
    %{
      attribute_id: attribute.id,
      claim_id: claim.id,
      code: attribute.code,
      display_name: attribute.display_name,
      value_text: ClaimValue.format(claim),
      source_type: Atom.to_string(claim.source_type),
      confidence: decimal(claim.confidence),
      evidence: Enum.map(claim.evidence_links, &capture_evidence/1)
    }
  end

  defp capture_evidence(evidence) do
    artifact = evidence.artifact

    %{
      artifact_id: artifact.id,
      excerpt: bounded_excerpt(evidence.excerpt),
      source_kind: artifact.source.kind,
      source_name: artifact.source.name,
      source_domain: artifact.source.domain,
      url: artifact.url,
      fetched_at: DateTime.to_iso8601(artifact.fetched_at)
    }
  end

  defp capture_offers(truth, merchants_by_offer_id) do
    best_offers =
      truth.currency_summaries
      |> Enum.flat_map(&List.wrap(&1.best_offer))

    Enum.map(best_offers, fn offer ->
      merchant = Map.fetch!(merchants_by_offer_id, offer.merchant_product_id)

      %{
        merchant_product_id: offer.merchant_product_id,
        price_point_id: offer.price_point_id,
        merchant_name: merchant.name,
        merchant_domain: merchant.domain,
        currency: offer.currency,
        item_price: decimal(offer.item_price),
        shipping: decimal(offer.shipping),
        landed_price: decimal(offer.landed_price),
        observed_at: DateTime.to_iso8601(offer.observed_at),
        freshness: Atom.to_string(offer.freshness)
      }
    end)
  end

  defp captured_merchants_by_offer_id(offer_truths_by_product) do
    offer_ids =
      offer_truths_by_product
      |> Map.values()
      |> Enum.flat_map(& &1.currency_summaries)
      |> Enum.flat_map(&List.wrap(&1.best_offer))
      |> Enum.map(& &1.merchant_product_id)
      |> Enum.uniq()

    case offer_ids do
      [] ->
        %{}

      ids ->
        MerchantProduct
        |> where([offer], offer.id in ^ids)
        |> preload([:merchant])
        |> Repo.all()
        |> Map.new(&{&1.id, &1.merchant})
    end
  end

  defp capture_recommendation(result) do
    rankings =
      Enum.map(result.rankings, fn ranking ->
        %{
          rank: ranking.rank,
          product_id: ranking.product_id,
          product_name: ranking.product_name,
          landed_price: decimal(ranking.landed_price),
          currency: ranking.currency,
          price_point_id: ranking.price_point_id,
          merchant_product_id: ranking.merchant_product_id,
          claim_ids: ranking.claim_ids,
          reasons: ranking.reasons
        }
      end)

    RecommendationResult.new(
      Atom.to_string(result.profile),
      result.algorithm_version,
      DateTime.to_iso8601(result.evaluated_at),
      Atom.to_string(result.status),
      result.winner_product_id,
      result.currency,
      rankings,
      result.missing_inputs
    )
  end

  defp decimal(nil), do: nil
  defp decimal(%Decimal{} = value), do: value |> Decimal.normalize() |> Decimal.to_string(:normal)

  defp bounded_excerpt(value) when is_binary(value), do: String.slice(value, 0, 500)
  defp bounded_excerpt(_value), do: nil
end
