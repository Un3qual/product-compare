defmodule ProductCompare.Pricing.PriceHistory do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Alerts.Jobs.AlertEvaluationWorker
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  @max_bigint_id 9_223_372_036_854_775_807

  @spec get_price_point(pos_integer()) :: PricePoint.t() | nil
  def get_price_point(price_point_id)
      when is_integer(price_point_id) and price_point_id > 0 and price_point_id <= @max_bigint_id do
    Repo.get(PricePoint, price_point_id)
  end

  def get_price_point(_price_point_id), do: nil

  @spec add_price_point(map()) :: {:ok, PricePoint.t()} | {:error, Ecto.Changeset.t()}
  def add_price_point(attrs) do
    Repo.transaction(fn ->
      with {:ok, price_point} <-
             %PricePoint{}
             |> PricePoint.changeset(attrs)
             |> Repo.insert(),
           {:ok, _job} <- AlertEvaluationWorker.enqueue(price_point.id) do
        price_point
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  @spec latest_price(pos_integer()) :: PricePoint.t() | nil
  def latest_price(merchant_product_id) do
    Repo.one(
      from pp in PricePoint,
        where: pp.merchant_product_id == ^merchant_product_id,
        order_by: [desc: pp.observed_at, desc: pp.id],
        limit: 1
    )
  end

  @spec latest_prices_query(Ecto.Queryable.t(), [pos_integer()]) :: Ecto.Query.t()
  def latest_prices_query(queryable \\ PricePoint, merchant_product_ids)
      when is_list(merchant_product_ids) do
    from pp in queryable,
      where: pp.merchant_product_id in ^merchant_product_ids,
      distinct: pp.merchant_product_id,
      order_by: [asc: pp.merchant_product_id, desc: pp.observed_at, desc: pp.id]
  end

  @spec latest_observation_for_offer_query(DateTime.t()) :: Ecto.Query.t()
  def latest_observation_for_offer_query(%DateTime{} = at) do
    from price in PricePoint,
      where: price.merchant_product_id == parent_as(:offer).id and price.observed_at <= ^at,
      order_by: [desc: price.observed_at, desc: price.id],
      limit: 1
  end

  @spec first_observation_for_offer_query(DateTime.t()) :: Ecto.Query.t()
  def first_observation_for_offer_query(%DateTime{} = at) do
    from price in PricePoint,
      where: price.merchant_product_id == parent_as(:offer).id and price.observed_at <= ^at,
      order_by: [asc: price.observed_at, asc: price.id],
      limit: 1
  end

  @spec landed_price_medians_query([pos_integer()] | Ecto.Query.t(), keyword()) ::
          Ecto.Query.t()
  def landed_price_medians_query(product_ids, opts) do
    from = Keyword.fetch!(opts, :from)
    to = Keyword.fetch!(opts, :to)
    currency = Keyword.fetch!(opts, :currency)

    validate_bounds!(from, to)

    case product_ids do
      [] ->
        empty_landed_price_medians_query()

      product_ids when is_list(product_ids) ->
        landed_price_medians_query(product_ids, from, to, currency)

      %Ecto.Query{} = product_ids_query ->
        landed_price_medians_query(product_ids_query, from, to, currency)
    end
  end

  @spec price_history_query(pos_integer(), map()) :: Ecto.Query.t()
  def price_history_query(merchant_product_id, filters \\ %{}) do
    from_dt = get_filter_value(filters, :from)
    to_dt = get_filter_value(filters, :to)
    order = get_filter_value(filters, :order)

    PricePoint
    |> where([pp], pp.merchant_product_id == ^merchant_product_id)
    |> maybe_where_from(from_dt)
    |> maybe_where_to(to_dt)
    |> order_price_history(order)
  end

  @spec price_history(pos_integer(), map()) :: [PricePoint.t()]
  def price_history(merchant_product_id, filters \\ %{}) do
    merchant_product_id
    |> price_history_query(filters)
    |> Repo.all()
  end

  @spec price_history_pages([pos_integer()], map(), %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [PricePoint.t()]}
  def price_history_pages(
        merchant_product_ids,
        filters,
        %{offset: offset, fetch_limit: fetch_limit}
      )
      when is_list(merchant_product_ids) and is_map(filters) do
    merchant_product_ids = normalize_merchant_product_ids(merchant_product_ids)

    if merchant_product_ids == [] do
      %{}
    else
      from_dt = get_filter_value(filters, :from)
      to_dt = get_filter_value(filters, :to)

      ranked_price_points =
        PricePoint
        |> where([price_point], price_point.merchant_product_id in ^merchant_product_ids)
        |> maybe_where_from(from_dt)
        |> maybe_where_to(to_dt)
        |> windows(
          [price_point],
          price_history_page: [
            partition_by: price_point.merchant_product_id,
            order_by: [desc: price_point.observed_at, desc: price_point.id]
          ]
        )
        |> select([price_point], %{
          id: price_point.id,
          row_number: over(row_number(), :price_history_page)
        })

      price_points_by_merchant_product =
        PricePoint
        |> join(:inner, [price_point], ranked in subquery(ranked_price_points),
          on: ranked.id == price_point.id
        )
        |> join(:left, [price_point, _ranked], artifact in assoc(price_point, :artifact))
        |> join(:left, [_price_point, _ranked, artifact], source in assoc(artifact, :source))
        |> where(
          [_price_point, ranked, _artifact, _source],
          ranked.row_number > ^offset and ranked.row_number <= ^(offset + fetch_limit)
        )
        |> order_by([price_point, _ranked, _artifact, _source],
          asc: price_point.merchant_product_id,
          desc: price_point.observed_at,
          desc: price_point.id
        )
        |> preload([_price_point, _ranked, artifact, source],
          artifact: {artifact, source: source}
        )
        |> Repo.all()
        |> Enum.group_by(& &1.merchant_product_id)

      Map.new(merchant_product_ids, fn merchant_product_id ->
        {merchant_product_id, Map.get(price_points_by_merchant_product, merchant_product_id, [])}
      end)
    end
  end

  @spec latest_offer_truth_prices([pos_integer()]) ::
          %{optional(pos_integer()) => PricePoint.t()}
  def latest_offer_truth_prices([]), do: %{}

  def latest_offer_truth_prices(merchant_product_ids) when is_list(merchant_product_ids) do
    PricePoint
    |> latest_prices_query(merchant_product_ids)
    |> preload([price_point], artifact: [:source])
    |> Repo.all()
    |> Map.new(&{&1.merchant_product_id, &1})
  end

  defp landed_price_medians_query(product_ids, from, to, currency) do
    PricePoint
    |> join(:inner, [price], offer in MerchantProduct, on: offer.id == price.merchant_product_id)
    |> filter_median_product_ids(product_ids)
    |> where(
      [price, offer],
      offer.currency == ^currency and not is_nil(price.shipping) and
        price.observed_at >= ^from and price.observed_at <= ^to
    )
    |> group_by([_price, offer], [offer.product_id, offer.currency])
    |> select([price, offer], %{
      product_id: offer.product_id,
      currency: offer.currency,
      median:
        type(
          fragment(
            "percentile_cont(0.5) WITHIN GROUP (ORDER BY (? + ?))",
            price.price,
            price.shipping
          ),
          :decimal
        )
    })
  end

  defp empty_landed_price_medians_query do
    from offer in MerchantProduct,
      where: false,
      select: %{
        product_id: offer.product_id,
        currency: offer.currency,
        median: type(fragment("NULL"), :decimal)
      }
  end

  defp filter_median_product_ids(query, product_ids) when is_list(product_ids),
    do: where(query, [_price, offer], offer.product_id in ^product_ids)

  defp filter_median_product_ids(query, %Ecto.Query{} = product_ids_query),
    do: where(query, [_price, offer], offer.product_id in subquery(product_ids_query))

  defp validate_bounds!(%DateTime{} = from, %DateTime{} = to) do
    if DateTime.compare(from, to) == :gt do
      raise ArgumentError, "price history from must be before or equal to to"
    end
  end

  defp validate_bounds!(_from, _to) do
    raise ArgumentError, "price history bounds must be DateTimes"
  end

  defp normalize_merchant_product_ids(merchant_product_ids) do
    merchant_product_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
  end

  defp maybe_where_from(query, nil), do: query
  defp maybe_where_from(query, from_dt), do: where(query, [pp], pp.observed_at >= ^from_dt)

  defp maybe_where_to(query, nil), do: query
  defp maybe_where_to(query, to_dt), do: where(query, [pp], pp.observed_at <= ^to_dt)

  defp order_price_history(query, :desc),
    do: order_by(query, [pp], desc: pp.observed_at, desc: pp.id)

  defp order_price_history(query, _order),
    do: order_by(query, [pp], asc: pp.observed_at, asc: pp.id)

  defp get_filter_value(filters, key) when is_map(filters),
    do: Map.get(filters, key, Map.get(filters, Atom.to_string(key)))

  defp get_filter_value(_filters, _key), do: nil
end
