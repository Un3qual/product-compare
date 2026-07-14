defmodule ProductCompare.ComparisonSnapshots do
  @moduledoc """
  Publishes immutable, public-safe comparison fact records and revokes their
  opaque public links without mutating captured facts.
  """

  import Ecto.Query

  alias ProductCompare.Pricing
  alias ProductCompare.Recommendations
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @profiles [:lowest_current_cost, :best_value]

  @spec publish(pos_integer(), map(), keyword()) ::
          {:ok, ComparisonSnapshot.t()}
          | {:error,
             :invalid_products | :product_not_found | :invalid_profile | Ecto.Changeset.t()}
  def publish(user_id, attrs, opts \\ []) when is_integer(user_id) and is_map(attrs) do
    product_ids = Map.get(attrs, :product_ids) || Map.get(attrs, "product_ids") || []

    profile =
      Map.get(attrs, :recommendation_profile) ||
        Map.get(attrs, "recommendation_profile") ||
        :lowest_current_cost

    now = Keyword.get(opts, :now, DateTime.utc_now()) |> DateTime.truncate(:microsecond)

    with :ok <- validate_product_ids(product_ids),
         :ok <- validate_profile(profile),
         {:ok, products} <- load_products(product_ids) do
      payload = capture(products, profile, now)

      %ComparisonSnapshot{}
      |> ComparisonSnapshot.publish_changeset(%{
        public_token: public_token(),
        user_id: user_id,
        title: normalize_title(Map.get(attrs, :title) || Map.get(attrs, "title")),
        payload: payload
      })
      |> Repo.insert()
      |> map_snapshot()
    end
  end

  @spec get_public(String.t()) :: ComparisonSnapshot.t() | nil
  def get_public(token) when is_binary(token) do
    if Regex.match?(~r/^[A-Za-z0-9_-]{43}$/, token) do
      ComparisonSnapshot
      |> where([snapshot], snapshot.public_token == ^token and is_nil(snapshot.revoked_at))
      |> Repo.one()
      |> present()
    end
  end

  def get_public(_token), do: nil

  @spec revoke(pos_integer(), Ecto.UUID.t(), keyword()) ::
          {:ok, ComparisonSnapshot.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def revoke(user_id, entropy_id, opts \\ [])

  def revoke(user_id, entropy_id, opts)
      when is_integer(user_id) and is_binary(entropy_id) do
    now = Keyword.get(opts, :now, DateTime.utc_now()) |> DateTime.truncate(:microsecond)

    with {:ok, uuid} <- Ecto.UUID.cast(entropy_id),
         %ComparisonSnapshot{} = snapshot <-
           Repo.one(
             from snapshot in ComparisonSnapshot,
               where:
                 snapshot.user_id == ^user_id and snapshot.entropy_id == ^uuid and
                   is_nil(snapshot.revoked_at)
           ) do
      snapshot
      |> ComparisonSnapshot.revoke_changeset(now)
      |> Repo.update(stale_error_field: :id)
      |> map_snapshot()
    else
      _ -> {:error, :not_found}
    end
  end

  def revoke(_user_id, _entropy_id, _opts), do: {:error, :not_found}

  defp validate_product_ids(product_ids) do
    if is_list(product_ids) and length(product_ids) in 2..3 and
         Enum.all?(product_ids, &(is_integer(&1) and &1 > 0)) and
         length(Enum.uniq(product_ids)) == length(product_ids) do
      :ok
    else
      {:error, :invalid_products}
    end
  end

  defp validate_profile(profile) when profile in @profiles, do: :ok
  defp validate_profile(_profile), do: {:error, :invalid_profile}

  defp load_products(product_ids) do
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

  defp capture(products, profile, now) do
    recommendation = Recommendations.compare(Enum.map(products, & &1.id), profile, now: now)

    %{
      version: 1,
      captured_at: DateTime.to_iso8601(now),
      products: Enum.map(products, &capture_product(&1, now)),
      recommendation: capture_recommendation(recommendation)
    }
  end

  defp capture_product(product, now) do
    %{
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      model_number: product.model_number,
      brand_name: product.brand && product.brand.name,
      attributes:
        product.id
        |> Specs.list_current_attributes_for_product()
        |> Enum.map(&capture_attribute/1),
      offers: capture_offers(product.id, now)
    }
  end

  defp capture_attribute(%{attribute: attribute, claim: claim}) do
    %{
      attribute_id: attribute.id,
      claim_id: claim.id,
      code: attribute.code,
      display_name: attribute.display_name,
      value_text: format_claim_value(claim),
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

  defp capture_offers(product_id, now) do
    truth = Pricing.current_offer_truth(product_id, now: now)

    best_offers =
      truth.currency_summaries
      |> Enum.flat_map(&List.wrap(&1.best_offer))

    merchants_by_offer_id =
      best_offers
      |> Enum.map(& &1.merchant_product_id)
      |> case do
        [] ->
          %{}

        ids ->
          MerchantProduct
          |> where([offer], offer.id in ^ids)
          |> preload([:merchant])
          |> Repo.all()
          |> Map.new(&{&1.id, &1.merchant})
      end

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

  defp capture_recommendation(result) do
    %{
      profile: Atom.to_string(result.profile),
      algorithm_version: result.algorithm_version,
      evaluated_at: DateTime.to_iso8601(result.evaluated_at),
      status: Atom.to_string(result.status),
      winner_product_id: result.winner_product_id,
      currency: result.currency,
      missing_inputs: result.missing_inputs,
      rankings:
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
    }
  end

  defp format_claim_value(%{value_bool: value}) when is_boolean(value),
    do: if(value, do: "Yes", else: "No")

  defp format_claim_value(%{value_int: value}) when is_integer(value),
    do: Integer.to_string(value)

  defp format_claim_value(%{value_num: %Decimal{} = value, unit: unit}) do
    suffix = unit && (unit.symbol || unit.code)
    [decimal(value), suffix] |> Enum.reject(&is_nil/1) |> Enum.join(" ")
  end

  defp format_claim_value(%{value_text: value}) when is_binary(value), do: value
  defp format_claim_value(%{value_date: %Date{} = value}), do: Date.to_iso8601(value)
  defp format_claim_value(%{value_ts: %DateTime{} = value}), do: DateTime.to_iso8601(value)
  defp format_claim_value(%{enum_option: %{label: value}}) when is_binary(value), do: value
  defp format_claim_value(%{value_json: value}) when is_map(value), do: Jason.encode!(value)
  defp format_claim_value(_claim), do: ""

  defp normalize_title(nil), do: nil
  defp normalize_title(title) when is_binary(title), do: String.trim(title)
  defp normalize_title(_title), do: nil

  defp public_token, do: 32 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false)

  defp decimal(nil), do: nil
  defp decimal(%Decimal{} = value), do: value |> Decimal.normalize() |> Decimal.to_string(:normal)

  defp bounded_excerpt(value) when is_binary(value), do: String.slice(value, 0, 500)
  defp bounded_excerpt(_value), do: nil

  defp map_snapshot({:ok, snapshot}) do
    snapshot = Repo.get!(ComparisonSnapshot, snapshot.id)
    {:ok, present(snapshot)}
  end

  defp map_snapshot(error), do: error

  defp present(nil), do: nil

  defp present(%ComparisonSnapshot{} = snapshot),
    do: %{snapshot | payload: decode_payload(snapshot.payload)}

  defp decode_payload(payload) do
    %{
      version: value(payload, :version),
      captured_at: value(payload, :captured_at),
      products: Enum.map(value(payload, :products, []), &decode_product/1),
      recommendation: decode_recommendation(value(payload, :recommendation, %{}))
    }
  end

  defp decode_product(product) do
    %{
      id: value(product, :id),
      name: value(product, :name),
      slug: value(product, :slug),
      description: value(product, :description),
      model_number: value(product, :model_number),
      brand_name: value(product, :brand_name),
      attributes: Enum.map(value(product, :attributes, []), &decode_attribute/1),
      offers: Enum.map(value(product, :offers, []), &decode_offer/1)
    }
  end

  defp decode_attribute(attribute) do
    Map.new(
      [:attribute_id, :claim_id, :code, :display_name, :value_text, :source_type, :confidence],
      &{&1, value(attribute, &1)}
    )
    |> Map.update!(:confidence, &decode_decimal/1)
    |> Map.put(:evidence, Enum.map(value(attribute, :evidence, []), &decode_evidence/1))
  end

  defp decode_evidence(evidence) do
    Map.new(
      [:artifact_id, :excerpt, :source_kind, :source_name, :source_domain, :url, :fetched_at],
      &{&1, value(evidence, &1)}
    )
  end

  defp decode_offer(offer) do
    Map.new(
      [
        :merchant_product_id,
        :price_point_id,
        :merchant_name,
        :merchant_domain,
        :currency,
        :item_price,
        :shipping,
        :landed_price,
        :observed_at,
        :freshness
      ],
      &{&1, value(offer, &1)}
    )
    |> Map.update!(:item_price, &decode_decimal/1)
    |> Map.update!(:shipping, &decode_decimal/1)
    |> Map.update!(:landed_price, &decode_decimal/1)
  end

  defp decode_recommendation(recommendation) do
    Map.new(
      [
        :profile,
        :algorithm_version,
        :evaluated_at,
        :status,
        :winner_product_id,
        :currency,
        :missing_inputs
      ],
      &{&1, value(recommendation, &1)}
    )
    |> Map.put(:rankings, Enum.map(value(recommendation, :rankings, []), &decode_ranking/1))
  end

  defp decode_ranking(ranking) do
    Map.new(
      [
        :rank,
        :product_id,
        :product_name,
        :landed_price,
        :currency,
        :price_point_id,
        :merchant_product_id,
        :claim_ids,
        :reasons
      ],
      &{&1, value(ranking, &1)}
    )
    |> Map.update!(:landed_price, &decode_decimal/1)
  end

  defp decode_decimal(nil), do: nil
  defp decode_decimal(%Decimal{} = value), do: value
  defp decode_decimal(value) when is_binary(value), do: Decimal.new(value)

  defp value(map, key, default \\ nil),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key), default))
end
