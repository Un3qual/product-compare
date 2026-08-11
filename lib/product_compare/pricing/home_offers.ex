defmodule ProductCompare.Pricing.HomeOffers do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Pricing.{CurrentOffers, PriceHistory}
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.MerchantProduct

  @max_bigint_id 9_223_372_036_854_775_807
  @homepage_currency "USD"
  @summary_fact_fields MapSet.new([:active_offer_count, :price_signal])

  @spec summaries([term()] | :all, keyword()) :: %{optional(pos_integer()) => map()}
  def summaries(product_ids, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    offers =
      product_ids
      |> normalize_product_ids()
      |> current_eligible_query(now)
      |> winners_query()
      |> Repo.all()

    requested_fields = summary_requested_fields(opts)
    facts = page_facts(offers, requested_fields, now: now)

    offers
    |> Map.new(fn row ->
      summary = row |> Map.merge(Map.get(facts, row.merchant_product_id, %{}))
      {row.product_id, Map.drop(summary, [:product_id, :new_offer?])}
    end)
  end

  @spec new_deal_candidates(keyword()) :: [map()]
  def new_deal_candidates(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    {offset, limit} = window(opts)

    :all
    |> new_eligible_query(now)
    |> winners_query()
    |> join(:inner, [offer], product in Product, on: product.id == offer.product_id)
    |> select_merge([_offer, product], %{product: product})
    |> order_by([offer],
      asc: offer.landed_price,
      desc: offer.observed_at,
      asc: offer.product_id
    )
    |> offset(^offset)
    |> limit(^limit)
    |> Repo.all()
  end

  @spec page_facts([map()], MapSet.t(atom()), keyword()) :: %{
          optional(pos_integer()) => map()
        }
  def page_facts(offers, requested_fields, opts)

  def page_facts([], %MapSet{}, _opts), do: %{}

  def page_facts(offers, %MapSet{} = requested_fields, opts) do
    requested_fields =
      MapSet.intersection(requested_fields, MapSet.new([:active_offer_count, :price_signal]))

    if MapSet.size(requested_fields) == 0 do
      %{}
    else
      now = Keyword.get(opts, :now, DateTime.utc_now())
      offers = Enum.uniq_by(offers, & &1.merchant_product_id)
      facts = Map.new(offers, &{&1.merchant_product_id, %{}})

      facts
      |> maybe_add_active_counts(offers, requested_fields)
      |> maybe_add_price_signals(offers, requested_fields, now)
    end
  end

  @spec price_signals([term()], keyword()) :: %{optional(pos_integer()) => map()}
  def price_signals(merchant_product_ids, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    merchant_product_ids = normalize_product_ids(merchant_product_ids)

    candidate_product_ids =
      MerchantProduct
      |> where([offer], offer.id in ^merchant_product_ids)
      |> distinct([offer], offer.product_id)
      |> select([offer], %{product_id: offer.product_id})

    candidate_product_ids
    |> median_eligible_query(now)
    |> subquery()
    |> where([offer], offer.merchant_product_id in ^merchant_product_ids)
    |> select([offer], %{
      merchant_product_id: offer.merchant_product_id,
      median_30d: offer.median_30d,
      below_30_day_median?: offer.below_30_day_median?
    })
    |> Repo.all()
    |> Map.new(&{&1.merchant_product_id, Map.delete(&1, :merchant_product_id)})
  end

  @spec trending_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def trending_deal_candidates(activity_query, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    {offset, limit} = window(opts)
    product_ids = activity_product_ids_query()

    ranked_offers =
      product_ids
      |> median_eligible_query(now)
      |> winners_query()
      |> with_cte("home_activity", as: ^activity_query, materialized: true)
      |> join(:inner, [offer], activity in "home_activity",
        on: field(activity, :product_id) == offer.product_id
      )
      |> where([offer], offer.below_30_day_median? == true)
      |> select_merge([_offer, activity], %{
        identity_count: field(activity, :identity_count),
        activity_at: field(activity, :activity_at)
      })

    ranked_offers
    |> subquery()
    |> join(:inner, [offer], product in Product, on: product.id == offer.product_id)
    |> order_by([offer, _product],
      desc: offer.identity_count,
      desc: offer.activity_at,
      asc: offer.product_id
    )
    |> select([offer, product], %{
      product_id: offer.product_id,
      merchant_product_id: offer.merchant_product_id,
      merchant_name: offer.merchant_name,
      currency: offer.currency,
      landed_price: offer.landed_price,
      observed_at: offer.observed_at,
      first_seen_at: offer.first_seen_at,
      median_30d: offer.median_30d,
      new_offer?: offer.new_offer?,
      below_30_day_median?: offer.below_30_day_median?,
      product: product
    })
    |> offset(^offset)
    |> limit(^limit)
    |> Repo.all()
  end

  @spec fallback_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def fallback_deal_candidates(activity_query, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    {offset, limit} = window(opts)
    activity_product_ids = activity_product_ids_query()

    new_candidates =
      :all
      |> new_eligible_query(now)
      |> winners_query()
      |> select_merge([offer], %{
        reason_rank: 0,
        identity_count: 0,
        activity_at: offer.observed_at
      })

    trending_candidates =
      activity_product_ids
      |> median_eligible_query(now)
      |> winners_query()
      |> join(:inner, [offer], activity in "home_activity",
        on: field(activity, :product_id) == offer.product_id
      )
      |> where([offer], offer.below_30_day_median? == true)
      |> select_merge([offer, activity], %{
        reason_rank: 1,
        identity_count: field(activity, :identity_count),
        activity_at: field(activity, :activity_at)
      })

    ranked_candidates =
      new_candidates
      |> union_all(^trending_candidates)
      |> subquery()
      |> windows(
        [offer],
        fallback_product: [partition_by: offer.product_id, order_by: offer.reason_rank]
      )
      |> select_merge([offer], %{fallback_rank: over(row_number(), :fallback_product)})

    scoped_candidates =
      ranked_candidates
      |> subquery()
      |> with_cte("home_activity", as: ^activity_query, materialized: true)
      |> where([offer], offer.fallback_rank == 1)

    scoped_candidates
    |> subquery()
    |> join(:inner, [offer], product in Product, on: product.id == offer.product_id)
    |> select_merge([_offer, product], %{product: product})
    |> order_by([offer],
      asc: offer.reason_rank,
      asc: fragment("CASE WHEN ? = 0 THEN ? END", offer.reason_rank, offer.landed_price),
      desc: fragment("CASE WHEN ? = 0 THEN ? END", offer.reason_rank, offer.observed_at),
      desc: fragment("CASE WHEN ? = 1 THEN ? END", offer.reason_rank, offer.identity_count),
      desc: fragment("CASE WHEN ? = 1 THEN ? END", offer.reason_rank, offer.activity_at),
      asc: offer.product_id
    )
    |> offset(^offset)
    |> limit(^limit)
    |> Repo.all()
  end

  @spec viewer_deal_candidates(Ecto.Query.t(), keyword()) :: [map()]
  def viewer_deal_candidates(relevance_query, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    {offset, limit} = window(opts)

    product_ids = relevance_product_ids_query()

    ranked_viewer_offers =
      product_ids
      |> median_eligible_query(now)
      |> join_viewer_relevance()
      |> windows(
        [offer, relevance],
        viewer_product: [
          partition_by: offer.product_id,
          order_by: [
            asc: field(relevance, :reason_rank),
            asc: field(relevance, :watch_target),
            asc: offer.landed_price,
            asc: offer.merchant_product_id
          ]
        ]
      )
      |> select([offer, relevance], %{
        product_id: offer.product_id,
        merchant_product_id: offer.merchant_product_id,
        merchant_name: offer.merchant_name,
        currency: offer.currency,
        landed_price: offer.landed_price,
        observed_at: offer.observed_at,
        first_seen_at: offer.first_seen_at,
        median_30d: offer.median_30d,
        new_offer?: offer.new_offer?,
        below_30_day_median?: offer.below_30_day_median?,
        reason_rank: field(relevance, :reason_rank),
        watch_target: field(relevance, :watch_target),
        viewer_rank: over(row_number(), :viewer_product)
      })

    scoped_offers =
      ranked_viewer_offers
      |> subquery()
      |> with_cte("home_relevance", as: ^relevance_query, materialized: true)
      |> where([offer], offer.viewer_rank == 1)

    scoped_offers
    |> subquery()
    |> join(:inner, [offer], product in Product, on: product.id == offer.product_id)
    |> select_merge([_offer, product], %{product: product})
    |> order_by([offer],
      asc: offer.reason_rank,
      desc:
        fragment(
          "greatest(coalesce(?, ?) - ?, 0)",
          offer.median_30d,
          offer.landed_price,
          offer.landed_price
        ),
      desc: offer.observed_at,
      asc: offer.product_id
    )
    |> offset(^offset)
    |> limit(^limit)
    |> Repo.all()
  end

  @spec viewer_deal_exists?(Ecto.Query.t(), keyword()) :: boolean()
  def viewer_deal_exists?(relevance_query, opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    relevance_product_ids_query()
    |> current_eligible_query(now)
    |> join_viewer_relevance()
    |> with_cte("home_relevance", as: ^relevance_query, materialized: true)
    |> Repo.exists?()
  end

  defp winners_query(eligible_offers) do
    ranked_offers =
      eligible_offers
      |> subquery()
      |> windows(
        [offer],
        home_offer: [
          partition_by: [:product_id, :currency],
          order_by: [asc: :landed_price, asc: :merchant_product_id]
        ]
      )
      |> select([offer], %{
        product_id: offer.product_id,
        merchant_product_id: offer.merchant_product_id,
        merchant_name: offer.merchant_name,
        currency: offer.currency,
        landed_price: offer.landed_price,
        observed_at: offer.observed_at,
        first_seen_at: offer.first_seen_at,
        median_30d: offer.median_30d,
        new_offer?: offer.new_offer?,
        below_30_day_median?: offer.below_30_day_median?,
        rank: over(row_number(), :home_offer)
      })

    ranked_offers
    |> subquery()
    |> where([offer], offer.rank == 1)
    |> select([offer], %{
      product_id: offer.product_id,
      merchant_product_id: offer.merchant_product_id,
      merchant_name: offer.merchant_name,
      currency: offer.currency,
      landed_price: offer.landed_price,
      observed_at: offer.observed_at,
      first_seen_at: offer.first_seen_at,
      median_30d: offer.median_30d,
      new_offer?: offer.new_offer?,
      below_30_day_median?: offer.below_30_day_median?
    })
  end

  defp current_eligible_query(product_ids, now) do
    product_ids
    |> CurrentOffers.eligible_query(current_offer_options(now))
    |> select_merge([offer: _offer], %{
      first_seen_at: type(fragment("NULL"), :utc_datetime_usec),
      median_30d: type(fragment("NULL"), :decimal),
      new_offer?: false,
      below_30_day_median?: false
    })
  end

  defp new_eligible_query(product_ids, now) do
    new_after = DateTime.add(now, -259_200, :second)

    product_ids
    |> CurrentOffers.eligible_query(
      Keyword.put(current_offer_options(now), :inserted_after, new_after)
    )
    |> where([offer: offer], offer.inserted_at >= ^new_after)
    |> CurrentOffers.with_first_observation(now)
    |> select_merge([offer: offer, first_observation: first], %{
      median_30d: type(fragment("NULL"), :decimal),
      new_offer?: fragment("least(?, ?) >= ?", offer.inserted_at, first.observed_at, ^new_after),
      below_30_day_median?: false
    })
    |> where(
      [offer: offer, first_observation: first],
      fragment("least(?, ?) >= ?", offer.inserted_at, first.observed_at, ^new_after)
    )
  end

  defp median_eligible_query(product_ids, now) do
    product_ids
    |> CurrentOffers.eligible_query(current_offer_options(now))
    |> CurrentOffers.with_median(product_ids, median_options(now))
    |> select_merge([offer: _offer], %{
      first_seen_at: type(fragment("NULL"), :utc_datetime_usec),
      new_offer?: false
    })
  end

  defp current_offer_options(now) do
    [
      now: now,
      currency: @homepage_currency,
      fresh_after: DateTime.add(now, -86_400, :second)
    ]
  end

  defp median_options(now) do
    [
      from: DateTime.add(now, -2_592_000, :second),
      to: now,
      currency: @homepage_currency
    ]
  end

  defp maybe_add_active_counts(facts, offers, requested_fields) do
    if MapSet.member?(requested_fields, :active_offer_count) do
      product_ids = offers |> Enum.map(& &1.product_id) |> Enum.uniq()

      counts_by_product_id =
        product_ids
        |> active_counts_query()
        |> Repo.all()
        |> Map.new(&{&1.product_id, &1.active_offer_count})

      Enum.reduce(offers, facts, fn offer, acc ->
        Map.update!(acc, offer.merchant_product_id, fn offer_facts ->
          Map.put(
            offer_facts,
            :active_offer_count,
            Map.get(counts_by_product_id, offer.product_id, 0)
          )
        end)
      end)
    else
      facts
    end
  end

  defp maybe_add_price_signals(facts, offers, requested_fields, now) do
    if MapSet.member?(requested_fields, :price_signal) do
      {loaded_offers, missing_offers} =
        Enum.split_with(offers, &(not is_nil(Map.get(&1, :median_30d))))

      facts = Enum.reduce(loaded_offers, facts, &put_loaded_price_signal/2)

      medians_by_product_id = load_page_medians(missing_offers, now)

      Enum.reduce(missing_offers, facts, fn offer, acc ->
        median = Map.get(medians_by_product_id, offer.product_id)

        Map.update!(acc, offer.merchant_product_id, fn offer_facts ->
          Map.merge(offer_facts, %{
            median_30d: median,
            below_30_day_median?: below_median?(offer.landed_price, median)
          })
        end)
      end)
    else
      facts
    end
  end

  defp put_loaded_price_signal(offer, facts) do
    Map.update!(facts, offer.merchant_product_id, fn offer_facts ->
      Map.merge(offer_facts, %{
        median_30d: offer.median_30d,
        below_30_day_median?: Map.get(offer, :below_30_day_median?, false)
      })
    end)
  end

  defp load_page_medians([], _now), do: %{}

  defp load_page_medians(offers, now) do
    offers
    |> Enum.map(& &1.product_id)
    |> Enum.uniq()
    |> PriceHistory.landed_price_medians_query(median_options(now))
    |> Repo.all()
    |> Map.new(&{&1.product_id, &1.median})
  end

  defp below_median?(_landed_price, nil), do: false
  defp below_median?(landed_price, median), do: Decimal.lt?(landed_price, median)

  defp summary_requested_fields(opts) do
    case Keyword.get(opts, :requested_fields, @summary_fact_fields) do
      %MapSet{} = requested_fields ->
        MapSet.intersection(requested_fields, @summary_fact_fields)

      _invalid ->
        raise ArgumentError, "home offer summary requested_fields must be a MapSet"
    end
  end

  defp active_counts_query(product_ids) do
    MerchantProduct
    |> maybe_filter_product_ids(product_ids)
    |> where([offer], offer.is_active == true and offer.currency == ^@homepage_currency)
    |> group_by([offer], offer.product_id)
    |> select([offer], %{product_id: offer.product_id, active_offer_count: count(offer.id)})
  end

  defp activity_product_ids_query do
    from activity in "home_activity",
      select: %{product_id: field(activity, :product_id)}
  end

  defp relevance_product_ids_query do
    from relevance in "home_relevance",
      select: %{product_id: field(relevance, :product_id)}
  end

  defp join_viewer_relevance(offers) do
    offers
    |> subquery()
    |> join(:inner, [offer], relevance in "home_relevance",
      on: field(relevance, :product_id) == offer.product_id
    )
    |> where(
      [offer, relevance],
      field(relevance, :reason_rank) != 0 or
        (offer.landed_price <= field(relevance, :watch_target) and
           (is_nil(field(relevance, :merchant_product_id)) or
              field(relevance, :merchant_product_id) == offer.merchant_product_id))
    )
  end

  defp maybe_filter_product_ids(query, :all), do: query

  defp maybe_filter_product_ids(query, %Ecto.Query{} = product_ids_query),
    do: where(query, [offer], offer.product_id in subquery(product_ids_query))

  defp maybe_filter_product_ids(query, product_ids),
    do: where(query, [offer], offer.product_id in ^product_ids)

  defp normalize_product_ids(:all), do: :all

  defp normalize_product_ids(product_ids) when is_list(product_ids),
    do: product_ids |> Enum.filter(&valid_id?/1) |> Enum.uniq()

  defp normalize_product_ids(_), do: []
  defp valid_id?(id), do: is_integer(id) and id > 0 and id <= @max_bigint_id

  defp window(opts) do
    offset = Keyword.get(opts, :offset, 0)
    limit = Keyword.get(opts, :limit)

    {
      if(is_integer(offset) and offset >= 0, do: offset, else: 0),
      if(is_integer(limit) and limit > 0,
        do: limit,
        else: raise(ArgumentError, "home offer limit must be a positive integer")
      )
    }
  end
end
