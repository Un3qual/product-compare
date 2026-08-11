defmodule ProductCompareWeb.Resolvers.HomeResolver do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.{Alerts, Catalog, CommerceAttribution, Pricing, Repo, Seo, Specs}
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareSchemas.Catalog.Product

  @comparison_limit 3

  @spec home_workspace(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def home_workspace(_parent, args, %{context: context}) do
    selected_slugs = Map.get(args, :selected_slugs, [])

    {:ok,
     %{
       now: Map.fetch!(context, :graphql_observed_at),
       selected_products: Catalog.home_workspace_selected_products(selected_slugs)
     }}
  end

  @spec workspace_products(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def workspace_products(%{now: now}, args, _resolution) do
    build_connection(
      args,
      fn window ->
        products =
          Catalog.home_workspace_product_candidates(
            now: now,
            offset: window.offset,
            limit: window.fetch_limit
          )

        workspace_rows(products, now)
      end,
      &workspace_edge/2
    )
  end

  @spec workspace_categories(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def workspace_categories(%{now: now}, args, _resolution) do
    build_connection(args, fn window ->
      Seo.home_category_shortcuts(
        now: now,
        offset: window.offset,
        limit: window.fetch_limit
      )
    end)
  end

  @spec home_deals(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def home_deals(_parent, args, %{context: context}) do
    {:ok,
     %{
       current_user: context[:current_user],
       now: Map.fetch!(context, :graphql_observed_at),
       selected_slugs: Map.get(args, :selected_slugs, [])
     }}
  end

  @spec new_deals(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def new_deals(%{now: now}, args, _resolution) do
    build_connection(
      args,
      fn window ->
        now
        |> new_offer_page(window)
        |> deal_rows(:new_offer)
      end,
      &deal_edge/2
    )
  end

  @spec trending_deals(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def trending_deals(%{now: now}, args, _resolution) do
    build_connection(
      args,
      fn window ->
        now
        |> trending_offer_page(window)
        |> deal_rows(:trending_below_median)
      end,
      &deal_edge/2
    )
  end

  @spec viewer_deals(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def viewer_deals(%{current_user: nil}, args, _resolution) do
    build_connection(args, fn _window -> [] end, &deal_edge/2)
  end

  def viewer_deals(
        %{current_user: user, now: now, selected_slugs: selected_slugs},
        args,
        _resolution
      ) do
    build_connection(
      args,
      fn window -> viewer_deal_rows(user, selected_slugs, now, window) end,
      &deal_edge/2
    )
  end

  defp workspace_rows(products, now) do
    product_ids = Enum.map(products, & &1.id)
    highlights_by_product_id = Specs.home_specification_highlights(product_ids, limit: 3)
    offers_by_product_id = Pricing.home_offer_summaries(product_ids, now: now)

    Enum.map(products, fn product ->
      %{
        product: product,
        highlights: Map.get(highlights_by_product_id, product.id, []),
        offer: Map.fetch!(offers_by_product_id, product.id)
      }
    end)
  end

  defp viewer_deal_rows(user, selected_slugs, now, window) do
    current_product_ids =
      selected_slugs
      |> Enum.filter(&is_binary/1)
      |> Enum.uniq()
      |> Enum.take(@comparison_limit)
      |> Catalog.list_products_by_slugs()
      |> Enum.reject(&is_nil/1)
      |> Enum.map(& &1.id)

    relevance_query = Alerts.home_relevance_candidates_query(user.id, current_product_ids)

    case Pricing.home_viewer_deal_candidates(relevance_query, now: now, offset: 0, limit: 1) do
      [] ->
        fallback_deal_rows(now, window)

      [_match] ->
        relevance_query
        |> Pricing.home_viewer_deal_candidates(
          now: now,
          offset: window.offset,
          limit: window.fetch_limit
        )
        |> viewer_rows()
    end
  end

  defp fallback_deal_rows(now, window) do
    fetch_limit = window.offset + window.fetch_limit

    offers_with_reasons =
      now
      |> new_offer_page(%{offset: 0, fetch_limit: fetch_limit})
      |> Enum.map(&{&1, :new_offer})
      |> Kernel.++(
        now
        |> trending_offer_page(%{offset: 0, fetch_limit: fetch_limit})
        |> Enum.map(&{&1, :trending_below_median})
      )
      |> Enum.uniq_by(fn {offer, _reason} -> offer.product_id end)
      |> Enum.drop(window.offset)
      |> Enum.take(window.fetch_limit)

    products_by_id =
      offers_with_reasons
      |> Enum.map(fn {offer, _reason} -> offer.product_id end)
      |> deal_products_by_id()

    Enum.map(offers_with_reasons, fn {offer, reason_code} ->
      deal(Map.fetch!(products_by_id, offer.product_id), offer, reason(reason_code))
    end)
  end

  defp new_offer_page(now, window) do
    Pricing.home_new_deal_candidates(
      now: now,
      offset: window.offset,
      limit: window.fetch_limit
    )
  end

  defp trending_offer_page(now, window) do
    [now: now]
    |> CommerceAttribution.trending_product_candidates_query()
    |> Pricing.home_trending_deal_candidates(
      now: now,
      offset: window.offset,
      limit: window.fetch_limit
    )
  end

  defp viewer_rows(offers) do
    products_by_id = offers |> Enum.map(& &1.product_id) |> deal_products_by_id()

    Enum.map(offers, fn offer ->
      deal(Map.fetch!(products_by_id, offer.product_id), offer, viewer_reason(offer))
    end)
  end

  defp deal_rows(offers, reason_code) do
    products_by_id = offers |> Enum.map(& &1.product_id) |> deal_products_by_id()

    Enum.map(offers, fn offer ->
      deal(Map.fetch!(products_by_id, offer.product_id), offer, reason(reason_code))
    end)
  end

  defp deal(product, offer, reason),
    do: %{product: product, offer: offer, reasons: [reason]}

  defp reason(code), do: %{code: code, watch_target: nil}

  defp viewer_reason(%{reason_rank: 0, watch_target: target}),
    do: %{code: :watch_target, watch_target: target}

  defp viewer_reason(%{reason_rank: 1}),
    do: %{code: :saved_comparison, watch_target: nil}

  defp viewer_reason(%{reason_rank: 2}),
    do: %{code: :current_comparison, watch_target: nil}

  defp build_connection(args, rows_fun, edge_fun \\ nil) do
    with {:ok, window} <- Connection.batch_window_result(args),
         rows <- rows_fun.(window),
         {:ok, connection} <- Connection.from_prefetched_page(rows, args) do
      {:ok, maybe_map_edges(connection, edge_fun)}
    else
      {:error, :invalid_first} -> {:error, "invalid first"}
      {:error, :invalid_cursor} -> {:error, "invalid cursor"}
      {:error, message} when is_binary(message) -> {:error, message}
    end
  end

  defp maybe_map_edges(connection, nil), do: connection

  defp maybe_map_edges(connection, edge_fun) do
    Map.update!(connection, :edges, fn edges ->
      Enum.map(edges, fn edge -> edge_fun.(edge, edge.node) end)
    end)
  end

  defp workspace_edge(edge, row) do
    Map.merge(edge, %{
      highlights: row.highlights,
      node: row.product,
      offer: row.offer
    })
  end

  defp deal_edge(edge, row) do
    Map.merge(edge, %{
      node: row.product,
      offer: row.offer,
      reasons: row.reasons
    })
  end

  defp deal_products_by_id([]), do: %{}

  defp deal_products_by_id(product_ids) do
    Product
    |> where([product], product.id in ^product_ids)
    |> Repo.all()
    |> Map.new(&{&1.id, &1})
  end
end
