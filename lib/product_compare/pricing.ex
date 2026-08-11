defmodule ProductCompare.Pricing do
  @moduledoc """
  Pricing context for merchants, merchant listings, and price history.
  """

  alias ProductCompare.Pricing.Merchants
  alias ProductCompare.Pricing.CurrentOffers
  alias ProductCompare.Pricing.HomeOffers
  alias ProductCompare.Pricing.Offers
  alias ProductCompare.Pricing.PriceHistory
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
    PriceHistory.get_price_point(price_point_id)
  end

  def get_price_point(price_point_id), do: PriceHistory.get_price_point(price_point_id)

  @spec add_price_point(map()) :: {:ok, PricePoint.t()} | {:error, Ecto.Changeset.t()}
  def add_price_point(attrs), do: PriceHistory.add_price_point(attrs)

  @spec latest_price(pos_integer()) :: PricePoint.t() | nil
  def latest_price(merchant_product_id), do: PriceHistory.latest_price(merchant_product_id)

  @spec latest_prices_query(Ecto.Queryable.t(), [pos_integer()]) :: Ecto.Query.t()
  def latest_prices_query(queryable \\ PricePoint, merchant_product_ids)
      when is_list(merchant_product_ids) do
    PriceHistory.latest_prices_query(queryable, merchant_product_ids)
  end

  @spec price_history_query(pos_integer(), map()) :: Ecto.Query.t()
  def price_history_query(merchant_product_id, filters \\ %{}),
    do: PriceHistory.price_history_query(merchant_product_id, filters)

  @spec price_history(pos_integer(), map()) :: [PricePoint.t()]
  def price_history(merchant_product_id, filters \\ %{}),
    do: PriceHistory.price_history(merchant_product_id, filters)

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
    PriceHistory.price_history_pages(merchant_product_ids, filters, %{
      offset: offset,
      fetch_limit: fetch_limit
    })
  end

  @spec current_offer_truths([pos_integer()], keyword()) :: %{optional(pos_integer()) => map()}
  def current_offer_truths(product_ids, opts \\ []) when is_list(product_ids),
    do: CurrentOffers.current_offer_truths(product_ids, opts)

  @spec home_offer_summaries([term()], keyword()) :: %{optional(pos_integer()) => map()}
  def home_offer_summaries(product_ids, opts \\ []) when is_list(product_ids),
    do: HomeOffers.summaries(product_ids, opts)

  @spec home_new_deal_candidates(keyword()) :: [map()]
  def home_new_deal_candidates(opts), do: HomeOffers.new_deal_candidates(opts)

  @spec home_offer_price_signals([term()], keyword()) :: %{optional(pos_integer()) => map()}
  def home_offer_price_signals(merchant_product_ids, opts \\ [])
      when is_list(merchant_product_ids),
      do: HomeOffers.price_signals(merchant_product_ids, opts)

  @spec home_offer_page_facts([map()], MapSet.t(atom()), keyword()) :: %{
          optional(pos_integer()) => map()
        }
  def home_offer_page_facts(offers, requested_fields, opts \\ [])
      when is_list(offers) and is_struct(requested_fields, MapSet),
      do: HomeOffers.page_facts(offers, requested_fields, opts)

  @spec home_trending_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def home_trending_deal_candidates(activity_query, opts),
    do: HomeOffers.trending_deal_candidates(activity_query, opts)

  @spec home_fallback_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def home_fallback_deal_candidates(activity_query, opts),
    do: HomeOffers.fallback_deal_candidates(activity_query, opts)

  @spec home_viewer_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def home_viewer_deal_candidates(relevance_query, opts),
    do: HomeOffers.viewer_deal_candidates(relevance_query, opts)

  @spec current_offer_truth(term(), keyword()) :: map()
  def current_offer_truth(product_id, opts \\ [])

  def current_offer_truth(product_id, opts)
      when is_integer(product_id) and product_id > 0 and product_id <= @max_bigint_id do
    CurrentOffers.current_offer_truth(product_id, opts)
  end

  def current_offer_truth(product_id, opts),
    do: CurrentOffers.current_offer_truth(product_id, opts)
end
