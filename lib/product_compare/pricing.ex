defmodule ProductCompare.Pricing do
  @moduledoc """
  Pricing context for merchants, merchant listings, and price history.
  """

  import Ecto.Query

  alias ProductCompare.Alerts.Jobs.AlertEvaluationWorker
  alias ProductCompare.Pricing.Merchants
  alias ProductCompare.Pricing.Offers
  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  @max_bigint_id 9_223_372_036_854_775_807

  @spec upsert_merchant(map()) :: {:ok, Merchant.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant(attrs), do: Merchants.upsert_merchant(attrs)

  @spec list_merchants_query() :: Ecto.Query.t()
  def list_merchants_query, do: Merchants.list_merchants_query()

  @spec list_merchants() :: [Merchant.t()]
  def list_merchants, do: Merchants.list_merchants()

  @spec get_merchant!(pos_integer()) :: Merchant.t()
  def get_merchant!(merchant_id), do: Merchants.get_merchant!(merchant_id)

  @spec get_merchant(pos_integer()) :: Merchant.t() | nil
  def get_merchant(merchant_id)
      when is_integer(merchant_id) and merchant_id > 0 and merchant_id <= @max_bigint_id,
      do: Merchants.get_merchant(merchant_id)

  @spec get_merchant_by_slug(String.t()) :: Merchant.t() | nil
  def get_merchant_by_slug(slug) when is_binary(slug), do: Merchants.get_merchant_by_slug(slug)

  def get_merchant_by_slug(_slug), do: nil

  @spec get_merchants_by_slugs([term()]) :: %{optional(String.t()) => Merchant.t() | nil}
  def get_merchants_by_slugs(slugs) when is_list(slugs),
    do: Merchants.get_merchants_by_slugs(slugs)

  @spec merchant_detail(String.t() | Merchant.t(), keyword()) ::
          %{merchant: Merchant.t(), summary: map()} | nil
  def merchant_detail(merchant_or_slug, opts \\ [])

  def merchant_detail(slug, opts) when is_binary(slug), do: Merchants.merchant_detail(slug, opts)

  def merchant_detail(%Merchant{} = merchant, opts), do: Merchants.merchant_detail(merchant, opts)

  @spec merchant_details([Merchant.t()], keyword()) :: %{Merchant.t() => map()}
  def merchant_details(merchants, opts \\ [])

  def merchant_details([], opts), do: Merchants.merchant_details([], opts)

  def merchant_details(merchants, opts) when is_list(merchants),
    do: Merchants.merchant_details(merchants, opts)

  @spec list_merchant_offers_query(pos_integer(), boolean()) :: Ecto.Query.t()
  def list_merchant_offers_query(merchant_id, active_only \\ true),
    do: Offers.list_merchant_offers_query(merchant_id, active_only)

  @spec merchant_offer_pages([pos_integer()], %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [MerchantProduct.t()]}
  def merchant_offer_pages(merchant_ids, %{offset: offset, fetch_limit: fetch_limit})
      when is_list(merchant_ids) do
    Offers.merchant_offer_pages(merchant_ids, %{offset: offset, fetch_limit: fetch_limit})
  end

  @spec upsert_merchant_product(map()) ::
          {:ok, MerchantProduct.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_product(attrs), do: Offers.upsert_merchant_product(attrs)

  @spec list_merchant_products_query(map()) :: Ecto.Query.t()
  def list_merchant_products_query(filters), do: Offers.list_merchant_products_query(filters)

  @spec product_offer_pages([pos_integer()], map(), %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [MerchantProduct.t()]}
  def product_offer_pages(product_ids, filters, %{offset: offset, fetch_limit: fetch_limit})
      when is_list(product_ids) and is_map(filters) do
    Offers.product_offer_pages(product_ids, filters, %{
      offset: offset,
      fetch_limit: fetch_limit
    })
  end

  @spec list_merchant_products(map()) :: [MerchantProduct.t()]
  def list_merchant_products(filters), do: Offers.list_merchant_products(filters)

  @spec get_merchant_product!(pos_integer()) :: MerchantProduct.t()
  def get_merchant_product!(merchant_product_id),
    do: Offers.get_merchant_product!(merchant_product_id)

  @spec get_merchant_product(pos_integer()) :: MerchantProduct.t() | nil
  def get_merchant_product(merchant_product_id)
      when is_integer(merchant_product_id) and merchant_product_id > 0 and
             merchant_product_id <= @max_bigint_id do
    Offers.get_merchant_product(merchant_product_id)
  end

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

  @spec price_history(pos_integer(), map()) ::
          [PricePoint.t()]
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

  @spec current_offer_truths([pos_integer()], keyword()) :: %{optional(pos_integer()) => map()}
  def current_offer_truths(product_ids, opts \\ []) when is_list(product_ids) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    product_ids = normalize_product_ids(product_ids)

    if product_ids == [] do
      %{}
    else
      merchant_products =
        MerchantProduct
        |> where(
          [merchant_product],
          merchant_product.product_id in ^product_ids and merchant_product.is_active == true
        )
        |> order_by([merchant_product],
          asc: merchant_product.product_id,
          asc: merchant_product.id
        )
        |> Repo.all()

      price_points_by_merchant_product =
        merchant_products
        |> Enum.map(& &1.id)
        |> latest_offer_truth_prices()

      merchant_products_by_product = Enum.group_by(merchant_products, & &1.product_id)

      Map.new(product_ids, fn product_id ->
        offers =
          merchant_products_by_product
          |> Map.get(product_id, [])
          |> Enum.map(fn merchant_product ->
            OfferTruth.summarize(
              merchant_product,
              Map.get(price_points_by_merchant_product, merchant_product.id),
              now,
              opts
            )
          end)

        {product_id, OfferTruth.summarize_product(offers, now, opts)}
      end)
    end
  end

  @spec current_offer_truth(term(), keyword()) :: map()
  def current_offer_truth(product_id, opts \\ [])

  def current_offer_truth(product_id, opts)
      when is_integer(product_id) and product_id > 0 and product_id <= @max_bigint_id do
    current_offer_truths([product_id], opts)
    |> Map.fetch!(product_id)
  end

  def current_offer_truth(_product_id, opts) do
    OfferTruth.summarize_product([], Keyword.get(opts, :now, DateTime.utc_now()), opts)
  end

  defp latest_offer_truth_prices([]), do: %{}

  defp latest_offer_truth_prices(merchant_product_ids) do
    PricePoint
    |> latest_prices_query(merchant_product_ids)
    |> preload([price_point], artifact: [:source])
    |> Repo.all()
    |> Map.new(&{&1.merchant_product_id, &1})
  end

  defp normalize_product_ids(product_ids) do
    product_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
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
