defmodule ProductCompare.ComparisonSnapshots.Capture do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Pricing
  alias ProductCompare.Recommendations
  alias ProductCompare.Recommendations.Result
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Specs.ClaimValue
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Attribute, as: SnapshotAttribute
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Evidence, as: SnapshotEvidence
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Offer, as: SnapshotOffer
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Product, as: SnapshotProduct
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Ranking, as: SnapshotRanking

  alias ProductCompareSchemas.Catalog.ComparisonSnapshot.Recommendation,
    as: SnapshotRecommendation

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
      captured_at: now,
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

  def preloads do
    evidence = from evidence in SnapshotEvidence, order_by: [asc: evidence.position]

    attributes =
      from attribute in SnapshotAttribute,
        order_by: [asc: attribute.position],
        preload: [evidence: ^evidence]

    offers = from offer in SnapshotOffer, order_by: [asc: offer.position]

    products =
      from product in SnapshotProduct,
        order_by: [asc: product.position],
        preload: [attributes: ^attributes, offers: ^offers]

    rankings = from ranking in SnapshotRanking, order_by: [asc: ranking.rank]

    recommendation =
      from recommendation in SnapshotRecommendation,
        preload: [rankings: ^rankings]

    [products: products, recommendation: recommendation]
  end

  def hydrate(%ComparisonSnapshot{} = snapshot) do
    %{snapshot | payload: payload(snapshot)}
  end

  def payload(%ComparisonSnapshot{} = snapshot) do
    %{
      version: snapshot.version,
      captured_at: DateTime.to_iso8601(snapshot.captured_at),
      products: Enum.map(snapshot.products, &product_payload/1),
      recommendation: recommendation_payload(snapshot.recommendation)
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
      source_type: claim.source_type,
      confidence: claim.confidence,
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
      fetched_at: artifact.fetched_at
    }
  end

  defp capture_offers(truth, merchants_by_offer_id) do
    truth.currency_summaries
    |> Enum.flat_map(&List.wrap(&1.best_offer))
    |> Enum.map(fn offer ->
      merchant = Map.fetch!(merchants_by_offer_id, offer.merchant_product_id)

      %{
        merchant_product_id: offer.merchant_product_id,
        price_point_id: offer.price_point_id,
        merchant_name: merchant.name,
        merchant_domain: merchant.domain,
        currency: offer.currency,
        item_price: offer.item_price,
        shipping: offer.shipping,
        landed_price: offer.landed_price,
        observed_at: offer.observed_at,
        freshness: offer.freshness
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
    Result.new(
      result.profile,
      result.algorithm_version,
      result.evaluated_at,
      result.status,
      result.winner_product_id,
      result.currency,
      result.rankings,
      result.missing_inputs
    )
  end

  defp product_payload(product) do
    %{
      id: product.product_id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      model_number: product.model_number,
      brand_name: product.brand_name,
      attributes: Enum.map(product.attributes, &attribute_payload/1),
      offers: Enum.map(product.offers, &offer_payload/1)
    }
  end

  defp attribute_payload(attribute) do
    %{
      attribute_id: attribute.attribute_id,
      claim_id: attribute.claim_id,
      code: attribute.code,
      display_name: attribute.display_name,
      value_text: attribute.value_text,
      source_type: Atom.to_string(attribute.source_type),
      confidence: attribute.confidence,
      evidence: Enum.map(attribute.evidence, &evidence_payload/1)
    }
  end

  defp evidence_payload(evidence) do
    %{
      artifact_id: evidence.artifact_id,
      excerpt: evidence.excerpt,
      source_kind: evidence.source_kind,
      source_name: evidence.source_name,
      source_domain: evidence.source_domain,
      url: evidence.url,
      fetched_at: DateTime.to_iso8601(evidence.fetched_at)
    }
  end

  defp offer_payload(offer) do
    %{
      merchant_product_id: offer.merchant_product_id,
      price_point_id: offer.price_point_id,
      merchant_name: offer.merchant_name,
      merchant_domain: offer.merchant_domain,
      currency: offer.currency,
      item_price: offer.item_price,
      shipping: offer.shipping,
      landed_price: offer.landed_price,
      observed_at: DateTime.to_iso8601(offer.observed_at),
      freshness: Atom.to_string(offer.freshness)
    }
  end

  defp recommendation_payload(recommendation) do
    Result.new(
      recommendation.profile,
      recommendation.algorithm_version,
      recommendation.evaluated_at,
      recommendation.status,
      recommendation.winner_product_id,
      recommendation.currency,
      Enum.map(recommendation.rankings, &ranking_payload/1),
      recommendation.missing_inputs
    )
  end

  defp ranking_payload(ranking) do
    %{
      rank: ranking.rank,
      product_id: ranking.product_id,
      product_name: ranking.product_name,
      landed_price: ranking.landed_price,
      currency: ranking.currency,
      price_point_id: ranking.price_point_id,
      merchant_product_id: ranking.merchant_product_id,
      claim_ids: ranking.claim_ids,
      reasons: ranking.reasons
    }
  end

  defp bounded_excerpt(value) when is_binary(value), do: String.slice(value, 0, 500)
  defp bounded_excerpt(_value), do: nil
end
