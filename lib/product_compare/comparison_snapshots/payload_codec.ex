defmodule ProductCompare.ComparisonSnapshots.PayloadCodec do
  @moduledoc false

  alias ProductCompareSchemas.Catalog.ComparisonSnapshot

  @spec hydrate(ComparisonSnapshot.t() | nil) :: ComparisonSnapshot.t() | nil
  def hydrate(nil), do: nil

  def hydrate(%ComparisonSnapshot{} = snapshot),
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
    |> Map.update!(:profile, &decode_recommendation_profile/1)
    |> Map.update!(:evaluated_at, &decode_datetime/1)
    |> Map.update!(:status, &decode_recommendation_status/1)
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

  defp decode_datetime(nil), do: nil
  defp decode_datetime(%DateTime{} = value), do: value

  defp decode_datetime(value) when is_binary(value) do
    {:ok, datetime, _offset} = DateTime.from_iso8601(value)
    datetime
  end

  defp decode_recommendation_profile(nil), do: nil
  defp decode_recommendation_profile(:lowest_current_cost), do: :lowest_current_cost
  defp decode_recommendation_profile(:best_value), do: :best_value
  defp decode_recommendation_profile("lowest_current_cost"), do: :lowest_current_cost
  defp decode_recommendation_profile("best_value"), do: :best_value

  defp decode_recommendation_status(nil), do: nil
  defp decode_recommendation_status(:winner), do: :winner
  defp decode_recommendation_status(:tie), do: :tie
  defp decode_recommendation_status(:insufficient_evidence), do: :insufficient_evidence
  defp decode_recommendation_status("winner"), do: :winner
  defp decode_recommendation_status("tie"), do: :tie
  defp decode_recommendation_status("insufficient_evidence"), do: :insufficient_evidence

  defp value(map, key, default \\ nil),
    do: Map.get(map, key, Map.get(map, Atom.to_string(key), default))
end
