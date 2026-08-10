defmodule ProductCompareWeb.Resolvers.HomeResolver do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.{Alerts, Catalog, CommerceAttribution, Pricing, Seo, Specs}
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product

  @deal_limit 6

  @spec home_workspace(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def home_workspace(_parent, args, %{context: context}) do
    now = Map.fetch!(context, :graphql_observed_at)
    selected_slugs = Map.get(args, :selected_slugs, [])
    workspace = Catalog.home_workspace_candidates(selected_slugs, now: now, limit: @deal_limit)
    products = workspace.products
    product_ids = Enum.map(products, & &1.id)

    {:ok,
     %{
       products: workspace_products(products, product_ids, now),
       selected_products: workspace.selected_products,
       categories: Seo.home_category_shortcuts(now: now, limit: @deal_limit)
     }}
  end

  @spec home_deals(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def home_deals(_parent, args, %{context: context}) do
    now = Map.fetch!(context, :graphql_observed_at)
    selected_slugs = Map.get(args, :selected_slugs, [])
    new_offers = Pricing.home_new_deal_candidates(now: now, limit: @deal_limit)

    trending_offers =
      [now: now]
      |> CommerceAttribution.trending_product_candidates_query()
      |> Pricing.home_trending_deal_candidates(now: now, limit: @deal_limit)

    viewer_offers = viewer_candidates(context[:current_user], selected_slugs, now)

    products_by_id =
      (new_offers ++ trending_offers ++ (viewer_offers || []))
      |> Enum.map(& &1.product_id)
      |> Enum.uniq()
      |> deal_products_by_id()

    new_deals = deal_rows(new_offers, products_by_id, :new_offer)
    trending_deals = deal_rows(trending_offers, products_by_id, :trending_below_median)
    viewer_deals = viewer_deals(viewer_offers, products_by_id, new_deals, trending_deals)

    {:ok,
     %{
       new: new_deals,
       trending: trending_deals,
       for_you: viewer_deals
     }}
  end

  defp workspace_products(products, product_ids, now) do
    highlights_by_product_id = Specs.home_specification_highlights(product_ids, limit: 3)
    offers_by_product_id = Pricing.home_offer_summaries(product_ids, now: now)

    Enum.map(products, fn product ->
      %{
        product: product,
        highlights: Map.get(highlights_by_product_id, product.id, []),
        offer: Map.get(offers_by_product_id, product.id)
      }
    end)
  end

  defp viewer_candidates(nil, _selected_slugs, _now),
    do: nil

  defp viewer_candidates(user, selected_slugs, now) do
    current_product_ids =
      selected_slugs
      |> Catalog.home_workspace_candidates(now: now, limit: @deal_limit)
      |> Map.fetch!(:selected_products)
      |> Enum.map(& &1.id)

    user.id
    |> Alerts.home_relevance_candidates_query(current_product_ids)
    |> Pricing.home_viewer_deal_candidates(now: now, limit: @deal_limit)
  end

  defp viewer_deals([], _products, new_deals, trending_deals),
    do: fallback_deals(new_deals, trending_deals)

  defp viewer_deals(nil, _products, _new_deals, _trending_deals),
    do: []

  defp viewer_deals(offers, products_by_id, _new_deals, _trending_deals) do
    Enum.flat_map(offers, fn offer ->
      case Map.get(products_by_id, offer.product_id) do
        %Product{} = product -> [deal(product, offer, viewer_reason(offer))]
        _ -> []
      end
    end)
  end

  defp deal_rows(offers, products_by_id, reason_code) do
    Enum.flat_map(offers, fn offer ->
      case Map.get(products_by_id, offer.product_id) do
        %Product{} = product ->
          [deal(product, offer, %{code: reason_code, watch_target: nil})]

        _ ->
          []
      end
    end)
  end

  defp deal(product, offer, reason),
    do: %{product: product, offer: offer, reasons: [reason]}

  defp viewer_reason(%{reason_rank: 0, watch_target: target}),
    do: %{code: :watch_target, watch_target: target}

  defp viewer_reason(%{reason_rank: 1}),
    do: %{code: :saved_comparison, watch_target: nil}

  defp viewer_reason(%{reason_rank: 2}),
    do: %{code: :current_comparison, watch_target: nil}

  defp fallback_deals(new_deals, trending_deals),
    do: (new_deals ++ trending_deals) |> Enum.uniq_by(& &1.product.id) |> Enum.take(@deal_limit)

  # Task 1 exposes deal facts by product id but deliberately does not materialize product records.
  # This single set query supplies only the presentation identity needed for those deal rows.
  defp deal_products_by_id([]), do: %{}

  defp deal_products_by_id(product_ids) do
    Product
    |> where([product], product.id in ^product_ids)
    |> Repo.all()
    |> Map.new(&{&1.id, &1})
  end
end
