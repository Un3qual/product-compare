defmodule ProductCompare.Pricing do
  @moduledoc """
  Pricing context for merchants, merchant listings, and price history.
  """

  import Ecto.Query

  alias ProductCompare.ChangesetErrors
  alias ProductCompare.Alerts.Jobs.AlertEvaluationWorker
  alias ProductCompare.Pricing.OfferTruth
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint

  @max_bigint_id 9_223_372_036_854_775_807

  @spec upsert_merchant(map()) :: {:ok, Merchant.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant(attrs) do
    now = DateTime.utc_now()
    changeset = Merchant.changeset(%Merchant{}, merchant_attrs_with_slug(attrs))

    # Merchants are identified by either key in existing data flows:
    # name-based imports and domain-based imports should converge to one row.
    case upsert_merchant_on_name(changeset, now) do
      {:error, %Ecto.Changeset{} = error_changeset} ->
        if ChangesetErrors.unique_error_on_field?(error_changeset, :domain) do
          upsert_merchant_on_domain(changeset, now)
        else
          {:error, error_changeset}
        end

      result ->
        result
    end
  end

  @spec list_merchants_query() :: Ecto.Query.t()
  def list_merchants_query do
    from merchant in Merchant,
      order_by: [asc: merchant.id]
  end

  @spec list_merchants() :: [Merchant.t()]
  def list_merchants do
    list_merchants_query()
    |> Repo.all()
  end

  @spec get_merchant!(pos_integer()) :: Merchant.t()
  def get_merchant!(merchant_id), do: Repo.get!(Merchant, merchant_id)

  @spec get_merchant(pos_integer()) :: Merchant.t() | nil
  def get_merchant(merchant_id)
      when is_integer(merchant_id) and merchant_id > 0 and merchant_id <= @max_bigint_id,
      do: Repo.get(Merchant, merchant_id)

  @spec get_merchant_by_slug(String.t()) :: Merchant.t() | nil
  def get_merchant_by_slug(slug) when is_binary(slug) do
    [slug]
    |> get_merchants_by_slugs()
    |> Map.fetch!(slug)
  end

  def get_merchant_by_slug(_slug), do: nil

  @spec get_merchants_by_slugs([term()]) :: %{optional(String.t()) => Merchant.t() | nil}
  def get_merchants_by_slugs(slugs) when is_list(slugs) do
    requested_slugs = slugs |> Enum.filter(&is_binary/1) |> Enum.uniq()
    query_slugs = Enum.reject(requested_slugs, &(String.trim(&1) == ""))

    merchants_by_slug =
      if query_slugs == [] do
        %{}
      else
        Merchant
        |> where([merchant], merchant.slug in ^query_slugs)
        |> Repo.all()
        |> Map.new(&{&1.slug, &1})
      end

    Map.new(requested_slugs, &{&1, Map.get(merchants_by_slug, &1)})
  end

  @spec merchant_detail(String.t() | Merchant.t(), keyword()) ::
          %{merchant: Merchant.t(), summary: map()} | nil
  def merchant_detail(merchant_or_slug, opts \\ [])

  def merchant_detail(slug, opts) when is_binary(slug) do
    case get_merchant_by_slug(slug) do
      %Merchant{} = merchant -> merchant_detail(merchant, opts)
      nil -> nil
    end
  end

  def merchant_detail(%Merchant{} = merchant, opts) do
    merchant
    |> then(&merchant_details([&1], opts))
    |> Map.fetch!(merchant)
  end

  @spec merchant_details([Merchant.t()], keyword()) :: %{Merchant.t() => map()}
  def merchant_details(merchants, opts \\ [])

  def merchant_details([], _opts), do: %{}

  def merchant_details(merchants, opts) when is_list(merchants) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    merchant_ids = Enum.map(merchants, & &1.id)

    merchant_products =
      MerchantProduct
      |> where([offer], offer.merchant_id in ^merchant_ids and offer.is_active == true)
      |> order_by([offer], asc: offer.merchant_id, asc: offer.id)
      |> Repo.all()

    latest_by_offer =
      merchant_products
      |> Enum.map(& &1.id)
      |> latest_offer_truth_prices()

    products_by_merchant = Enum.group_by(merchant_products, & &1.merchant_id)

    Map.new(merchants, fn merchant ->
      products = Map.get(products_by_merchant, merchant.id, [])
      {merchant, merchant_detail_from_products(merchant, products, latest_by_offer, now, opts)}
    end)
  end

  defp merchant_detail_from_products(merchant, merchant_products, latest_by_offer, now, opts) do
    offers =
      Enum.map(merchant_products, fn offer ->
        OfferTruth.summarize(offer, Map.get(latest_by_offer, offer.id), now, opts)
      end)

    freshness_counts = Enum.frequencies_by(offers, & &1.freshness)

    %{
      merchant: merchant,
      summary: %{
        active_offer_count: length(offers),
        distinct_product_count:
          merchant_products |> Enum.map(& &1.product_id) |> Enum.uniq() |> length(),
        observed_offer_count: Enum.count(offers, & &1.observed_at),
        eligible_offer_count: Enum.count(offers, & &1.eligible),
        fresh_offer_count: Map.get(freshness_counts, :fresh, 0),
        aging_offer_count: Map.get(freshness_counts, :aging, 0),
        stale_offer_count: Map.get(freshness_counts, :stale, 0),
        unobserved_offer_count: Map.get(freshness_counts, :unobserved, 0),
        last_observed_at: latest_observed_at(offers)
      }
    }
  end

  @spec list_merchant_offers_query(pos_integer(), boolean()) :: Ecto.Query.t()
  def list_merchant_offers_query(merchant_id, active_only \\ true) do
    MerchantProduct
    |> where([offer], offer.merchant_id == ^merchant_id)
    |> maybe_where_active_only(active_only)
    |> order_by([offer], asc: offer.id)
  end

  @spec merchant_offer_pages([pos_integer()], %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [MerchantProduct.t()]}
  def merchant_offer_pages(merchant_ids, %{offset: offset, fetch_limit: fetch_limit})
      when is_list(merchant_ids) do
    merchant_ids = normalize_merchant_ids(merchant_ids)

    if merchant_ids == [] do
      %{}
    else
      ranked_offers =
        MerchantProduct
        |> where([offer], offer.merchant_id in ^merchant_ids)
        |> maybe_where_active_only(true)
        |> windows(
          [offer],
          merchant_offer_page: [partition_by: offer.merchant_id, order_by: [asc: offer.id]]
        )
        |> select([offer], %{
          id: offer.id,
          row_number: over(row_number(), :merchant_offer_page)
        })

      partitioned_merchant_product_pages(
        ranked_offers,
        merchant_ids,
        :merchant_id,
        offset,
        fetch_limit
      )
    end
  end

  @spec upsert_merchant_product(map()) ::
          {:ok, MerchantProduct.t()} | {:error, Ecto.Changeset.t()}
  def upsert_merchant_product(attrs) do
    now = DateTime.utc_now()
    changeset = MerchantProduct.changeset(%MerchantProduct{}, attrs)

    update_fields =
      changeset.changes
      |> Map.drop([:merchant_id, :url])
      |> Map.to_list()

    Repo.insert(
      changeset,
      on_conflict: [set: update_fields ++ [updated_at: now]],
      conflict_target: [:merchant_id, :url],
      returning: true
    )
  end

  @spec list_merchant_products_query(map()) :: Ecto.Query.t()
  def list_merchant_products_query(filters) do
    product_id = get_required_filter_value(filters, :product_id)
    merchant_id = get_filter_value(filters, :merchant_id)
    active_only = get_filter_value(filters, :active_only)

    MerchantProduct
    |> where([merchant_product], merchant_product.product_id == ^product_id)
    |> maybe_where_merchant_id(merchant_id)
    |> maybe_where_active_only(active_only)
    |> order_by([merchant_product], asc: merchant_product.id)
  end

  @spec product_offer_pages([pos_integer()], map(), %{
          offset: non_neg_integer(),
          fetch_limit: non_neg_integer()
        }) :: %{optional(pos_integer()) => [MerchantProduct.t()]}
  def product_offer_pages(product_ids, filters, %{offset: offset, fetch_limit: fetch_limit})
      when is_list(product_ids) and is_map(filters) do
    product_ids = normalize_product_ids(product_ids)

    if product_ids == [] do
      %{}
    else
      merchant_id = get_filter_value(filters, :merchant_id)
      active_only = get_filter_value(filters, :active_only)

      ranked_offers =
        MerchantProduct
        |> where([offer], offer.product_id in ^product_ids)
        |> maybe_where_merchant_id(merchant_id)
        |> maybe_where_active_only(active_only)
        |> windows(
          [offer],
          product_offer_page: [partition_by: offer.product_id, order_by: [asc: offer.id]]
        )
        |> select([offer], %{
          id: offer.id,
          row_number: over(row_number(), :product_offer_page)
        })

      partitioned_merchant_product_pages(
        ranked_offers,
        product_ids,
        :product_id,
        offset,
        fetch_limit
      )
    end
  end

  @spec list_merchant_products(map()) :: [MerchantProduct.t()]
  def list_merchant_products(filters) do
    filters
    |> list_merchant_products_query()
    |> Repo.all()
    |> Repo.preload([:merchant, :product])
  end

  @spec get_merchant_product!(pos_integer()) :: MerchantProduct.t()
  def get_merchant_product!(merchant_product_id) do
    MerchantProduct
    |> Repo.get!(merchant_product_id)
    |> Repo.preload([:merchant, :product])
  end

  @spec get_merchant_product(pos_integer()) :: MerchantProduct.t() | nil
  def get_merchant_product(merchant_product_id)
      when is_integer(merchant_product_id) and merchant_product_id > 0 and
             merchant_product_id <= @max_bigint_id do
    Repo.get(MerchantProduct, merchant_product_id)
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

  defp partitioned_merchant_product_pages(
         ranked_offers,
         parent_ids,
         parent_field,
         offset,
         fetch_limit
       ) do
    offers_by_parent =
      MerchantProduct
      |> join(:inner, [offer], ranked in subquery(ranked_offers), on: ranked.id == offer.id)
      |> where(
        [_offer, ranked],
        ranked.row_number > ^offset and ranked.row_number <= ^(offset + fetch_limit)
      )
      |> order_by([offer, _ranked],
        asc: field(offer, ^parent_field),
        asc: offer.id
      )
      |> Repo.all()
      |> Enum.group_by(&Map.fetch!(&1, parent_field))

    Map.new(parent_ids, fn parent_id ->
      {parent_id, Map.get(offers_by_parent, parent_id, [])}
    end)
  end

  defp normalize_merchant_ids(merchant_ids) do
    merchant_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
  end

  defp normalize_merchant_product_ids(merchant_product_ids) do
    merchant_product_ids
    |> Enum.filter(&(is_integer(&1) and &1 > 0 and &1 <= @max_bigint_id))
    |> Enum.uniq()
  end

  defp merchant_attrs_with_slug(attrs) do
    name = get_filter_value(attrs, :name)
    domain = get_filter_value(attrs, :domain)

    %{
      name: name,
      domain: domain,
      slug: merchant_slug(name, domain)
    }
  end

  defp merchant_slug(name, domain) when is_binary(name) and is_binary(domain) do
    base =
      name
      |> String.downcase()
      |> String.replace(~r/[^a-z0-9]+/u, "-")
      |> String.trim("-")

    hash = :crypto.hash(:md5, domain) |> Base.encode16(case: :lower) |> binary_part(0, 8)
    "#{if(base == "", do: "merchant", else: base)}-#{hash}"
  end

  defp merchant_slug(_name, _domain), do: nil

  defp latest_observed_at(offers) do
    offers
    |> Enum.map(& &1.observed_at)
    |> Enum.reject(&is_nil/1)
    |> Enum.max_by(&DateTime.to_unix(&1, :microsecond), fn -> nil end)
  end

  defp upsert_merchant_on_name(changeset, now) do
    update_fields = Map.take(changeset.changes, [:domain]) |> Map.to_list()

    Repo.insert(
      changeset,
      [
        on_conflict: [set: update_fields ++ [updated_at: now]],
        conflict_target: [:name],
        returning: true
      ] ++ transaction_insert_opts()
    )
  end

  defp upsert_merchant_on_domain(changeset, now) do
    update_fields = Map.take(changeset.changes, [:name]) |> Map.to_list()

    Repo.insert(
      changeset,
      [
        on_conflict: [set: update_fields ++ [updated_at: now]],
        conflict_target: [:domain],
        returning: true
      ] ++ transaction_insert_opts()
    )
  end

  defp transaction_insert_opts do
    if Repo.in_transaction?() do
      [mode: :savepoint]
    else
      []
    end
  end

  defp maybe_where_from(query, nil), do: query
  defp maybe_where_from(query, from_dt), do: where(query, [pp], pp.observed_at >= ^from_dt)

  defp maybe_where_to(query, nil), do: query
  defp maybe_where_to(query, to_dt), do: where(query, [pp], pp.observed_at <= ^to_dt)

  defp order_price_history(query, :desc),
    do: order_by(query, [pp], desc: pp.observed_at, desc: pp.id)

  defp order_price_history(query, _order),
    do: order_by(query, [pp], asc: pp.observed_at, asc: pp.id)

  defp maybe_where_merchant_id(query, nil), do: query

  defp maybe_where_merchant_id(query, merchant_id),
    do: where(query, [merchant_product], merchant_product.merchant_id == ^merchant_id)

  defp maybe_where_active_only(query, true),
    do: where(query, [merchant_product], merchant_product.is_active == true)

  defp maybe_where_active_only(query, _active_only), do: query

  defp get_filter_value(filters, key) when is_map(filters),
    do: Map.get(filters, key, Map.get(filters, Atom.to_string(key)))

  defp get_filter_value(_filters, _key), do: nil

  defp get_required_filter_value(filters, key) do
    case get_filter_value(filters, key) do
      nil -> raise ArgumentError, "missing required #{key} filter"
      value -> value
    end
  end
end
