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
    public_offers_by_product_id = Pricing.home_deal_candidates(now: now)

    viewer = viewer_candidates(context[:current_user], selected_slugs, now)

    viewer_offers_by_product_id =
      Pricing.home_offer_summaries(viewer.product_ids, now: now)

    products_by_id =
      Map.keys(public_offers_by_product_id)
      |> Kernel.++(viewer.product_ids)
      |> Enum.uniq()
      |> deal_products_by_id()

    new_deals = global_deals(public_offers_by_product_id, products_by_id, :new_offer)
    trending_deals = trending_deals(public_offers_by_product_id, products_by_id, now)

    {:ok,
     %{
       new: new_deals,
       trending: trending_deals,
       for_you:
         viewer_deals(
           viewer,
           viewer_offers_by_product_id,
           products_by_id,
           new_deals,
           trending_deals
         )
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

  defp global_deals(offers_by_product_id, products_by_id, :new_offer) do
    offers_by_product_id
    |> Enum.flat_map(fn {product_id, offer} ->
      with true <- offer.new_offer?,
           %Product{} = product <- Map.get(products_by_id, product_id) do
        [%{product: product, offer: offer, reasons: [%{code: :new_offer, watch_target: nil}]}]
      else
        _ -> []
      end
    end)
    |> rank_deals()
  end

  defp trending_deals(offers_by_product_id, products_by_id, now) do
    CommerceAttribution.trending_product_ids(now: now)
    |> Enum.flat_map(fn product_id ->
      with %{below_30_day_median?: true} = offer <- Map.get(offers_by_product_id, product_id),
           %Product{} = product <- Map.get(products_by_id, product_id) do
        [
          %{
            product: product,
            offer: offer,
            reasons: [%{code: :trending_below_median, watch_target: nil}]
          }
        ]
      else
        _ -> []
      end
    end)
    |> Enum.take(@deal_limit)
  end

  defp viewer_candidates(nil, _selected_slugs, _now),
    do: %{relevance: nil, current_product_ids: MapSet.new(), product_ids: []}

  defp viewer_candidates(user, selected_slugs, now) do
    relevance = Alerts.home_relevance(user.id)

    current_product_ids =
      selected_slugs
      |> Catalog.home_workspace_candidates(now: now, limit: @deal_limit)
      |> Map.fetch!(:selected_products)
      |> MapSet.new(& &1.id)

    %{
      relevance: relevance,
      current_product_ids: current_product_ids,
      product_ids:
        relevance.watch_targets
        |> Map.keys()
        |> Kernel.++(relevance.saved_product_ids)
        |> Kernel.++(MapSet.to_list(current_product_ids))
        |> Enum.uniq()
    }
  end

  defp viewer_deals(%{relevance: nil}, _offers, _products, _new_deals, _trending_deals),
    do: []

  defp viewer_deals(
         %{relevance: relevance, current_product_ids: current_product_ids},
         offers_by_product_id,
         products_by_id,
         new_deals,
         trending_deals
       ) do
    relevant_deals =
      offers_by_product_id
      |> Enum.flat_map(fn {product_id, offer} ->
        case {Map.get(products_by_id, product_id),
              viewer_reason(product_id, relevance, current_product_ids)} do
          {%Product{}, %{}} = pair -> [deal_from_viewer_pair(pair, offer)]
          _ -> []
        end
      end)
      |> rank_viewer_deals()

    if relevant_deals == [], do: fallback_deals(new_deals, trending_deals), else: relevant_deals
  end

  defp deal_from_viewer_pair({product, reason}, offer),
    do: %{product: product, offer: offer, reasons: [reason]}

  defp viewer_reason(product_id, relevance, current_product_ids) do
    cond do
      target = Map.get(relevance.watch_targets, product_id) ->
        %{code: :watch_target, watch_target: target}

      product_id in relevance.saved_product_ids ->
        %{code: :saved_comparison, watch_target: nil}

      MapSet.member?(current_product_ids, product_id) ->
        %{code: :current_comparison, watch_target: nil}

      true ->
        nil
    end
  end

  defp fallback_deals(new_deals, trending_deals),
    do: (new_deals ++ trending_deals) |> Enum.uniq_by(& &1.product.id) |> Enum.take(@deal_limit)

  defp rank_deals(deals) do
    deals
    |> Enum.sort_by(fn %{product: product, offer: offer} ->
      {offer.landed_price, DateTime.to_unix(offer.observed_at, :microsecond) * -1, product.id}
    end)
    |> Enum.take(@deal_limit)
  end

  defp rank_viewer_deals(deals) do
    deals
    |> Enum.sort(&viewer_deal_before?/2)
    |> Enum.take(@deal_limit)
  end

  defp viewer_deal_before?(first, second) do
    first_reason_rank =
      first |> Map.fetch!(:reasons) |> hd() |> Map.fetch!(:code) |> viewer_reason_rank()

    second_reason_rank =
      second |> Map.fetch!(:reasons) |> hd() |> Map.fetch!(:code) |> viewer_reason_rank()

    first_improvement = price_improvement(first.offer)
    second_improvement = price_improvement(second.offer)

    cond do
      first_reason_rank != second_reason_rank ->
        first_reason_rank < second_reason_rank

      Decimal.compare(first_improvement, second_improvement) != :eq ->
        Decimal.compare(first_improvement, second_improvement) == :gt

      DateTime.compare(first.offer.observed_at, second.offer.observed_at) != :eq ->
        DateTime.compare(first.offer.observed_at, second.offer.observed_at) == :gt

      true ->
        first.product.id <= second.product.id
    end
  end

  defp price_improvement(%{median_30d: %Decimal{} = median_30d, landed_price: landed_price}) do
    improvement = Decimal.sub(median_30d, landed_price)
    if Decimal.compare(improvement, Decimal.new(0)) == :gt, do: improvement, else: Decimal.new(0)
  end

  defp price_improvement(_offer), do: Decimal.new(0)

  defp viewer_reason_rank(:watch_target), do: 0
  defp viewer_reason_rank(:saved_comparison), do: 1
  defp viewer_reason_rank(:current_comparison), do: 2

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
