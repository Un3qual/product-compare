defmodule ProductCompare.Recommendations do
  @moduledoc """
  Deterministic, versioned comparison guidance backed by accepted claims and
  eligible current offer observations.
  """

  import Ecto.Query

  alias ProductCompare.Pricing
  alias ProductCompare.Recommendations.Result
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent

  @profiles %{
    lowest_current_cost: "lowest-current-cost-v1",
    best_value: "best-supported-current-cost-v1"
  }

  @spec compare([pos_integer()], atom(), keyword()) :: map()
  def compare(product_ids, profile, opts \\ [])
      when is_list(product_ids) and map_size(@profiles) > 0 do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    product_ids = Enum.uniq(product_ids)
    products = load_products(product_ids)

    cond do
      profile not in Map.keys(@profiles) ->
        empty_result(profile, "unsupported", now, ["Unsupported recommendation profile."])

      length(product_ids) not in 2..3 or length(products) != length(product_ids) ->
        empty_result(profile, Map.fetch!(@profiles, profile), now, [
          "Recommendations require two or three existing products."
        ])

      true ->
        build_result(products, profile, now)
    end
  end

  defp build_result(products, profile, now) do
    claims_by_product = accepted_claim_ids(products)

    offer_truth_by_product =
      Map.new(products, &{&1.id, Pricing.current_offer_truth(&1.id, now: now)})

    shared_currencies = shared_eligible_currencies(products, offer_truth_by_product)

    missing_claims =
      if profile == :best_value do
        products
        |> Enum.filter(&(Map.get(claims_by_product, &1.id, []) == []))
        |> Enum.map(&"#{&1.name} has no accepted specification evidence.")
      else
        []
      end

    cond do
      missing_claims != [] ->
        empty_result(profile, Map.fetch!(@profiles, profile), now, missing_claims)

      MapSet.size(shared_currencies) != 1 ->
        empty_result(profile, Map.fetch!(@profiles, profile), now, [
          "Products do not share one eligible offer currency."
        ])

      true ->
        currency = shared_currencies |> Enum.to_list() |> hd()

        rankings =
          products
          |> Enum.map(fn product ->
            best_offer = best_offer(offer_truth_by_product[product.id], currency)
            claim_ids = Map.get(claims_by_product, product.id, [])

            %{
              product_id: product.id,
              product_name: product.name,
              landed_price: best_offer.landed_price,
              currency: currency,
              price_point_id: best_offer.price_point_id,
              merchant_product_id: best_offer.merchant_product_id,
              claim_ids: claim_ids,
              reasons: reasons(profile, best_offer, currency, claim_ids)
            }
          end)
          |> Enum.sort(fn left, right ->
            case Decimal.compare(left.landed_price, right.landed_price) do
              :lt -> true
              :gt -> false
              :eq -> left.product_id < right.product_id
            end
          end)
          |> Enum.with_index(1)
          |> Enum.map(fn {ranking, rank} -> Map.put(ranking, :rank, rank) end)

        [first, second | _rest] = rankings

        if Decimal.eq?(first.landed_price, second.landed_price) do
          Result.new(
            profile,
            Map.fetch!(@profiles, profile),
            now,
            :tie,
            nil,
            currency,
            rankings,
            ["Top products have the same eligible landed price."]
          )
        else
          Result.new(
            profile,
            Map.fetch!(@profiles, profile),
            now,
            :winner,
            first.product_id,
            currency,
            rankings,
            []
          )
        end
    end
  end

  defp load_products(product_ids) do
    products = Repo.all(from product in Product, where: product.id in ^product_ids)
    products_by_id = Map.new(products, &{&1.id, &1})
    Enum.flat_map(product_ids, &List.wrap(Map.get(products_by_id, &1)))
  end

  defp accepted_claim_ids(products) do
    product_ids = Enum.map(products, & &1.id)

    Repo.all(
      from current in ProductAttributeCurrent,
        join: claim in assoc(current, :claim),
        where: current.product_id in ^product_ids and claim.status == :accepted,
        order_by: [asc: current.product_id, asc: current.attribute_id, asc: claim.id],
        select: {current.product_id, claim.id}
    )
    |> Enum.group_by(&elem(&1, 0), &elem(&1, 1))
  end

  defp shared_eligible_currencies(products, offer_truth_by_product) do
    products
    |> Enum.map(fn product ->
      offer_truth_by_product[product.id].currency_summaries
      |> Enum.filter(& &1.best_offer)
      |> MapSet.new(& &1.currency)
    end)
    |> case do
      [] -> MapSet.new()
      [first | rest] -> Enum.reduce(rest, first, &MapSet.intersection/2)
    end
  end

  defp best_offer(truth, currency) do
    truth.currency_summaries
    |> Enum.find(&(&1.currency == currency))
    |> Map.fetch!(:best_offer)
  end

  defp reasons(:lowest_current_cost, offer, currency, _claim_ids) do
    ["Lowest eligible landed price: #{decimal(offer.landed_price)} #{currency}."]
  end

  defp reasons(:best_value, offer, currency, claim_ids) do
    claim_count = Enum.count(claim_ids)
    claim_label = if match?([_claim], claim_ids), do: "claim", else: "claims"

    [
      "Eligible landed price: #{decimal(offer.landed_price)} #{currency}.",
      "Backed by #{claim_count} accepted specification #{claim_label}."
    ]
  end

  defp empty_result(profile, version, now, missing_inputs) do
    Result.new(profile, version, now, :insufficient_evidence, nil, nil, [], missing_inputs)
  end

  defp decimal(value), do: value |> Decimal.normalize() |> Decimal.to_string(:normal)
end
