defmodule ProductCompare.Pricing.ProductPriceTrends do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}

  @window_days 90

  @spec project([pos_integer()], DateTime.t()) :: %{optional(pos_integer()) => [map()]}
  def project([], %DateTime{}), do: %{}

  def project(product_ids, %DateTime{} = as_of) when is_list(product_ids) do
    product_ids = Enum.uniq(product_ids)
    first_date = as_of |> DateTime.to_date() |> Date.add(-@window_days)
    window_start = DateTime.new!(first_date, ~T[00:00:00])

    rows =
      product_ids
      |> price_rows_query(window_start, as_of)
      |> Repo.all()

    trends_by_product =
      rows
      |> Enum.group_by(&{&1.product_id, &1.currency})
      |> Enum.reduce(%{}, fn {{product_id, currency}, currency_rows}, trends ->
        case currency_series(currency, currency_rows, first_date, DateTime.to_date(as_of)) do
          nil -> trends
          series -> Map.update(trends, product_id, [series], &[series | &1])
        end
      end)

    Map.new(product_ids, fn product_id ->
      series = trends_by_product |> Map.get(product_id, []) |> Enum.sort_by(& &1.currency)
      {product_id, series}
    end)
  end

  defp price_rows_query(product_ids, window_start, as_of) do
    ranked_before_window =
      PricePoint
      |> join(:inner, [point], offer in MerchantProduct,
        on: offer.id == point.merchant_product_id
      )
      |> where(
        [point, offer],
        offer.product_id in ^product_ids and offer.is_active and
          point.observed_at < ^window_start
      )
      |> windows(
        [point, _offer],
        offer_history: [
          partition_by: point.merchant_product_id,
          order_by: [desc: point.observed_at, desc: point.id]
        ]
      )
      |> select([point, _offer], %{
        id: point.id,
        row_number: over(row_number(), :offer_history)
      })

    before_window_ids =
      ranked_before_window
      |> subquery()
      |> where([point], point.row_number == 1)
      |> select([point], %{id: point.id})

    in_window_ids =
      PricePoint
      |> join(:inner, [point], offer in MerchantProduct,
        on: offer.id == point.merchant_product_id
      )
      |> where(
        [point, offer],
        offer.product_id in ^product_ids and offer.is_active and
          point.observed_at >= ^window_start and point.observed_at <= ^as_of
      )
      |> select([point, _offer], %{id: point.id})

    selected_point_ids = union_all(before_window_ids, ^in_window_ids)

    from offer in MerchantProduct,
      join: merchant in Merchant,
      on: merchant.id == offer.merchant_id,
      join: point in PricePoint,
      on: point.merchant_product_id == offer.id,
      where: offer.product_id in ^product_ids and point.id in subquery(selected_point_ids),
      order_by: [
        asc: offer.product_id,
        asc: offer.currency,
        asc: merchant.name,
        asc: offer.id,
        asc: point.observed_at,
        asc: point.id
      ],
      select: %{
        currency: offer.currency,
        in_stock: point.in_stock,
        merchant_id: merchant.id,
        merchant_name: merchant.name,
        merchant_product_id: offer.id,
        observed_at: point.observed_at,
        price: point.price,
        price_point_id: point.id,
        product_id: offer.product_id
      }
  end

  defp currency_series(currency, rows, first_date, last_date) do
    offers =
      rows
      |> Enum.group_by(& &1.merchant_product_id)
      |> Enum.map(fn {merchant_product_id, observations} ->
        first = hd(observations)

        %{
          merchant_id: first.merchant_id,
          merchant_product_id: merchant_product_id,
          name: first.merchant_name,
          observations: observations
        }
      end)
      |> Enum.filter(
        &Enum.any?(&1.observations, fn observation -> observation.in_stock != false end)
      )
      |> Enum.sort_by(&{&1.name, &1.merchant_product_id})

    {points, _projection_state} =
      first_date
      |> Date.range(last_date)
      |> Enum.map_reduce(initial_projection_state(offers), fn date, state ->
        state = advance_projection_state(state, date)
        {price_point(currency, date, offers, state.prices), state}
      end)

    points = Enum.reject(points, &is_nil/1)

    if points == [] do
      nil
    else
      %{
        currency: currency,
        merchants: Enum.map(offers, &Map.drop(&1, [:observations])),
        points: points
      }
    end
  end

  defp initial_projection_state(offers) do
    %{
      observations: Map.new(offers, &{&1.merchant_product_id, &1.observations}),
      prices: %{}
    }
  end

  defp advance_projection_state(state, date) do
    Enum.reduce(state.observations, state, fn {merchant_product_id, observations}, projection ->
      {current, remaining} = Enum.split_while(observations, &observed_by?(&1, date))

      case List.last(current) do
        nil ->
          projection

        %{in_stock: false} ->
          %{
            observations: Map.put(projection.observations, merchant_product_id, remaining),
            prices: Map.delete(projection.prices, merchant_product_id)
          }

        observation ->
          %{
            observations: Map.put(projection.observations, merchant_product_id, remaining),
            prices: Map.put(projection.prices, merchant_product_id, observation.price)
          }
      end
    end)
  end

  defp observed_by?(observation, date),
    do: Date.compare(DateTime.to_date(observation.observed_at), date) != :gt

  defp price_point(_currency, _date, _offers, prices) when map_size(prices) == 0, do: nil

  defp price_point(currency, date, offers, prices) do
    merchant_prices =
      offers
      |> Enum.flat_map(fn offer ->
        case Map.fetch(prices, offer.merchant_product_id) do
          {:ok, price} -> [%{merchant_product_id: offer.merchant_product_id, price: price}]
          :error -> []
        end
      end)

    winner = lowest_merchant_price(merchant_prices)
    total = Enum.reduce(merchant_prices, Decimal.new(0), &Decimal.add(&2, &1.price))

    %{
      average_price: Decimal.div(total, length(merchant_prices)),
      currency: currency,
      lowest_merchant_product_id: winner.merchant_product_id,
      lowest_price: winner.price,
      merchant_prices: merchant_prices,
      observed_at: DateTime.new!(date, ~T[00:00:00])
    }
  end

  defp lowest_merchant_price([first | rest]) do
    Enum.reduce(rest, first, fn candidate, lowest ->
      case Decimal.compare(candidate.price, lowest.price) do
        :lt -> candidate
        :eq when candidate.merchant_product_id < lowest.merchant_product_id -> candidate
        _comparison -> lowest
      end
    end)
  end
end
