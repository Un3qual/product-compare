defmodule ProductCompareWeb.Resolvers.HomeResolver do
  @moduledoc false

  alias Absinthe.Relay.Connection, as: RelayConnection
  alias Absinthe.Resolution
  alias ProductCompare.{Alerts, Catalog, CommerceAttribution, Pricing, Repo, Seo, Specs}
  alias ProductCompareWeb.GraphQL.Connection

  @homepage_traversal_limit 1_000
  @page_fact_field_identifiers [:active_offer_count, :price_signal]

  @spec home_workspace(any(), map(), Absinthe.Resolution.t()) :: {:ok, map()}
  def home_workspace(_parent, args, %{context: context}) do
    selected_slugs = Map.get(args, :selected_slugs, [])

    {:ok,
     %{
       now: Map.fetch!(context, :graphql_observed_at),
       selected_slugs: selected_slugs
     }}
  end

  @spec selected_products(map(), map(), Absinthe.Resolution.t()) :: {:ok, [map()]}
  def selected_products(%{selected_slugs: selected_slugs}, _args, _resolution) do
    {:ok, Catalog.home_workspace_selected_products(selected_slugs)}
  end

  @spec workspace_products(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def workspace_products(%{now: now}, args, resolution) do
    requested_fields = requested_page_fact_fields(resolution)

    build_connection(
      args,
      fn window ->
        Repo.repeatable_read_transaction(
          fn ->
            products =
              Catalog.home_workspace_product_candidates(
                now: now,
                offset: window.offset,
                limit: window.fetch_limit
              )

            workspace_rows(products, requested_fields, now, window.fetch_limit - 1)
          end,
          "home workspace reads"
        )
      end,
      &workspace_edge/2
    )
  end

  @spec workspace_categories(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def workspace_categories(%{now: now}, args, _resolution) do
    build_connection(args, fn window ->
      Repo.repeatable_read_transaction(
        fn ->
          Seo.home_category_shortcuts(
            now: now,
            offset: window.offset,
            limit: window.fetch_limit
          )
        end,
        "home category shortcut reads"
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
  def new_deals(%{now: now}, args, resolution) do
    requested_fields = requested_page_fact_fields(resolution)

    build_connection(
      args,
      fn window ->
        Repo.repeatable_read_transaction(
          fn ->
            now
            |> new_offer_page(window)
            |> hydrate_offer_page(requested_fields, now, window.fetch_limit - 1)
            |> deal_rows(:new_offer)
          end,
          "home New deal reads"
        )
      end,
      &deal_edge/2
    )
  end

  @spec trending_deals(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def trending_deals(%{now: now}, args, resolution) do
    requested_fields = requested_page_fact_fields(resolution)

    build_connection(
      args,
      fn window ->
        Repo.repeatable_read_transaction(
          fn ->
            now
            |> trending_offer_page(window)
            |> hydrate_offer_page(requested_fields, now, window.fetch_limit - 1)
            |> deal_rows(:trending_below_median)
          end,
          "home Trending deal reads"
        )
      end,
      &deal_edge/2
    )
  end

  @spec viewer_deals(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, map()} | {:error, String.t()}
  def viewer_deals(%{current_user: nil}, args, _resolution) do
    build_connection(args, fn _window -> {:ok, []} end, &deal_edge/2)
  end

  def viewer_deals(
        %{current_user: user, now: now, selected_slugs: selected_slugs},
        args,
        resolution
      ) do
    requested_fields = requested_page_fact_fields(resolution)

    build_connection(
      args,
      fn window ->
        Repo.repeatable_read_transaction(
          fn ->
            viewer_deal_rows(
              user,
              selected_slugs,
              requested_fields,
              now,
              window
            )
          end,
          "home signed-in For You deal reads"
        )
      end,
      &deal_edge/2
    )
  end

  @spec price_signal(map(), map(), Absinthe.Resolution.t()) ::
          {:ok, atom()}
  def price_signal(offer, _args, _resolution), do: {:ok, price_signal_code(offer)}

  defp workspace_rows(products, requested_fields, now, page_size) do
    product_ids = Enum.map(products, & &1.id)
    highlights_by_product_id = Specs.home_specification_highlights(product_ids, limit: 3)
    empty_fields = MapSet.new()

    offers_by_product_id =
      Pricing.home_offer_summaries(product_ids,
        now: now,
        requested_fields: empty_fields
      )

    products
    |> Enum.flat_map(fn product ->
      case Map.get(offers_by_product_id, product.id) do
        nil ->
          []

        offer ->
          [
            %{
              product: product,
              highlights: Map.get(highlights_by_product_id, product.id, []),
              offer: Map.put(offer, :product_id, product.id)
            }
          ]
      end
    end)
    |> hydrate_row_page(requested_fields, now, page_size)
  end

  defp viewer_deal_rows(user, selected_slugs, requested_fields, now, window) do
    current_product_ids =
      selected_slugs
      |> Catalog.home_workspace_selected_products()
      |> Enum.map(& &1.id)

    relevance_query = Alerts.home_relevance_candidates_query(user.id, current_product_ids)

    case Pricing.home_viewer_deal_candidates(relevance_query, now: now, offset: 0, limit: 1) do
      [] ->
        fallback_deal_rows(requested_fields, now, window)

      [_match] ->
        relevance_query
        |> Pricing.home_viewer_deal_candidates(
          now: now,
          offset: window.offset,
          limit: window.fetch_limit
        )
        |> hydrate_offer_page(requested_fields, now, window.fetch_limit - 1)
        |> viewer_rows()
    end
  end

  defp fallback_deal_rows(requested_fields, now, window) do
    [now: now]
    |> CommerceAttribution.trending_product_candidates_query()
    |> Pricing.home_fallback_deal_candidates(
      now: now,
      offset: window.offset,
      limit: window.fetch_limit
    )
    |> hydrate_offer_page(requested_fields, now, window.fetch_limit - 1)
    |> Enum.map(fn offer ->
      deal(offer.product, offer, reason(fallback_reason_code(offer.reason_rank)))
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
    Enum.map(offers, fn offer ->
      deal(offer.product, offer, viewer_reason(offer))
    end)
  end

  defp deal_rows(offers, reason_code) do
    Enum.map(offers, fn offer ->
      deal(offer.product, offer, reason(reason_code))
    end)
  end

  defp hydrate_offer_page(offers, requested_fields, now, page_size) do
    facts = page_facts(offers, requested_fields, now, page_size)

    offers
    |> Enum.with_index()
    |> Enum.map(fn {offer, index} ->
      if index < page_size do
        Map.merge(offer, Map.get(facts, offer.merchant_product_id, %{}))
      else
        offer
      end
    end)
  end

  defp hydrate_row_page(rows, requested_fields, now, page_size) do
    facts =
      rows
      |> Enum.map(& &1.offer)
      |> page_facts(requested_fields, now, page_size)

    rows
    |> Enum.with_index()
    |> Enum.map(fn {row, index} ->
      if index < page_size do
        Map.update!(row, :offer, fn offer ->
          Map.merge(offer, Map.get(facts, offer.merchant_product_id, %{}))
        end)
      else
        row
      end
    end)
  end

  defp page_facts(offers, requested_fields, now, page_size) do
    offers
    |> Enum.take(page_size)
    |> Pricing.home_offer_page_facts(requested_fields, now: now)
  end

  defp deal(product, offer, reason),
    do: %{product: product, offer: offer, reasons: [reason]}

  defp reason(code), do: %{code: code, watch_target: nil}

  defp fallback_reason_code(0), do: :new_offer
  defp fallback_reason_code(1), do: :trending_below_median

  defp viewer_reason(%{reason_rank: 0, watch_target: target}),
    do: %{code: :watch_target, watch_target: target}

  defp viewer_reason(%{reason_rank: 1}),
    do: %{code: :saved_comparison, watch_target: nil}

  defp viewer_reason(%{reason_rank: 2}),
    do: %{code: :current_comparison, watch_target: nil}

  defp build_connection(args, rows_fun, edge_fun \\ nil) do
    with {:ok, window} <- Connection.batch_window_result(args),
         :ok <- validate_home_window(window),
         {:ok, rows} <- rows_fun.(window),
         {:ok, connection} <- connection_from_prefetched_page(rows, window) do
      {:ok, maybe_map_edges(connection, edge_fun)}
    else
      {:error, :invalid_first} -> {:error, "invalid first"}
      {:error, :invalid_cursor} -> {:error, "invalid cursor"}
      {:error, message} when is_binary(message) -> {:error, message}
    end
  end

  defp validate_home_window(%{offset: offset, fetch_limit: fetch_limit}) do
    if offset + fetch_limit <= @homepage_traversal_limit,
      do: :ok,
      else: {:error, "invalid cursor"}
  end

  defp connection_from_prefetched_page(rows, %{offset: offset, fetch_limit: fetch_limit}) do
    first = fetch_limit - 1

    RelayConnection.from_slice(Enum.take(rows, first), offset,
      has_previous_page: offset > 0,
      has_next_page: length(rows) > first
    )
  end

  defp requested_page_fact_fields(%Resolution{} = resolution) do
    resolution
    |> projected_field_identifiers()
    |> MapSet.intersection(page_fact_fields())
  end

  defp requested_page_fact_fields(_direct_call), do: page_fact_fields()

  defp page_fact_fields do
    Enum.reduce(@page_fact_field_identifiers, MapSet.new(), &MapSet.put(&2, &1))
  end

  defp projected_field_identifiers(%Resolution{} = resolution) do
    resolution
    |> Resolution.project()
    |> collect_projected_field_identifiers(resolution, MapSet.new())
  end

  defp collect_projected_field_identifiers(fields, resolution, identifiers) do
    Enum.reduce(fields, identifiers, fn field, acc ->
      acc =
        case field.schema_node do
          %{identifier: identifier} -> MapSet.put(acc, identifier)
          _introspection_field -> acc
        end

      case field.selections do
        [] ->
          acc

        _selections ->
          child_resolution = %{
            resolution
            | definition: field,
              path: [field | resolution.path]
          }

          child_resolution
          |> Resolution.project()
          |> collect_projected_field_identifiers(child_resolution, acc)
      end
    end)
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

  defp price_signal_code(%{median_30d: nil}), do: :no_30_day_baseline
  defp price_signal_code(%{below_30_day_median?: true}), do: :below_30_day_median
  defp price_signal_code(_offer), do: :at_or_above_30_day_median
end
