defmodule ProductCompareWeb.GraphQL.Loader.RootSources do
  @moduledoc false

  alias ProductCompare.{
    Accounts,
    Alerts,
    Affiliate,
    Catalog,
    CommerceAttribution,
    ComparisonSnapshots,
    Discussions,
    Ingestion,
    Pricing,
    Specs
  }

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareWeb.GraphQL.Connection

  @spec comparison() :: Dataloader.Source.t()
  def comparison do
    Dataloader.KV.new(&comparison_batch/2, async?: false)
  end

  defp comparison_batch(:products, slug_selections) do
    slug_selections = Enum.to_list(slug_selections)
    products_by_selection = Catalog.list_products_by_slug_selections(slug_selections)

    Map.new(Enum.zip(slug_selections, products_by_selection))
  end

  defp comparison_batch(:recommendation, requests) do
    requests = Enum.to_list(requests)

    products_by_request =
      requests
      |> Enum.map(&elem(&1, 0))
      |> Catalog.list_products_by_slug_selections()

    recommendations =
      requests
      |> Enum.zip(products_by_request)
      |> Enum.filter(fn {{slugs, _profile}, products} ->
        length(slugs) in 2..3 and Enum.all?(products)
      end)
      |> then(fn valid_requests ->
        results =
          valid_requests
          |> Enum.map(fn {{_slugs, profile}, products} ->
            {Enum.map(products, & &1.id), profile}
          end)
          |> ProductCompare.Recommendations.compare_many([])

        valid_requests
        |> Enum.map(&elem(&1, 0))
        |> Enum.zip(results)
        |> Map.new()
      end)

    Map.new(requests, fn {_slugs, _profile} = request ->
      result =
        case Map.fetch(recommendations, request) do
          {:ok, recommendation} -> recommendation
          :error -> {:ok, {:error, "recommendations require two or three existing products"}}
        end

      {request, result}
    end)
  end

  @spec discovery_roots() :: Dataloader.Source.t()
  def discovery_roots do
    Dataloader.KV.new(&discovery_root_batch/2, async?: false)
  end

  defp discovery_root_batch({:products, filters, connection_args}, roots)
       when is_map(filters) and is_map(connection_args) do
    result =
      Product
      |> ProductCompare.Catalog.Filtering.apply_filters(filters)
      |> Connection.from_query_result(connection_args, Repo)

    Map.new(roots, &{&1, result})
  end

  defp discovery_root_batch({:product_filter_metadata, filters}, roots) when is_map(filters) do
    result = Catalog.product_filter_metadata(filters)
    Map.new(roots, &{&1, {:ok, result}})
  end

  defp discovery_root_batch({:merchants, connection_args}, roots) when is_map(connection_args) do
    result =
      Pricing.list_merchants_query()
      |> Connection.from_query_result(connection_args, Repo)

    Map.new(roots, &{&1, result})
  end

  defp discovery_root_batch({:merchant_products, attrs, connection_args}, roots)
       when is_map(attrs) and is_map(connection_args) do
    result =
      attrs
      |> Pricing.list_merchant_products_query()
      |> Connection.from_query_result(connection_args, Repo)

    Map.new(roots, &{&1, result})
  end

  @spec operator_reporting() :: Dataloader.Source.t()
  def operator_reporting do
    Dataloader.KV.new(&operator_reporting_batch/2, async?: false)
  end

  defp operator_reporting_batch(
         {:active_coupons, operator_id, merchant_id, observation_time, connection_args},
         requests
       )
       when is_integer(operator_id) and operator_id > 0 and is_integer(merchant_id) and
              merchant_id > 0 and
              (is_nil(observation_time) or is_struct(observation_time, DateTime)) and
              is_map(connection_args) do
    observed_at = observation_time || DateTime.utc_now()

    result =
      merchant_id
      |> Affiliate.list_active_coupons_query(observed_at)
      |> Connection.from_query_result(connection_args, Repo)

    Map.new(requests, &{&1, result})
  end

  defp operator_reporting_batch(
         {:revenue_summary, operator_id, filters, connection_args},
         requests
       )
       when is_integer(operator_id) and operator_id > 0 and is_map(filters) and
              is_map(connection_args) do
    result =
      try do
        {:ok, CommerceAttribution.dashboard_revenue_summary(filters)}
      rescue
        ArgumentError -> {:error, :invalid_revenue_summary_filters}
      end

    Map.new(requests, &{&1, {:ok, result}})
  end

  @spec public_slugs() :: Dataloader.Source.t()
  def public_slugs do
    Dataloader.KV.new(&public_slug_batch/2, async?: false)
  end

  defp public_slug_batch(:product, slugs) do
    slugs
    |> Enum.to_list()
    |> Catalog.get_products_by_slugs()
  end

  defp public_slug_batch(:merchant, slugs) do
    slugs
    |> Enum.to_list()
    |> Pricing.get_merchants_by_slugs()
  end

  @spec public_opaque_keys() :: Dataloader.Source.t()
  def public_opaque_keys do
    Dataloader.KV.new(&public_opaque_batch/2, async?: false)
  end

  defp public_opaque_batch(:source_artifact, ids) do
    ids
    |> Enum.to_list()
    |> then(&project_lookup_results(&1, Specs.get_source_artifacts(&1)))
  end

  defp public_opaque_batch(:product_question, entropy_ids) do
    entropy_ids
    |> Enum.to_list()
    |> then(&project_lookup_results(&1, Discussions.get_public_questions(&1)))
  end

  defp public_opaque_batch(:comparison_snapshot, tokens) do
    tokens
    |> Enum.to_list()
    |> then(&project_lookup_results(&1, ComparisonSnapshots.get_public_many(&1)))
  end

  @spec authorized_nodes() :: Dataloader.Source.t()
  def authorized_nodes do
    Dataloader.KV.new(&authorized_node_batch/2, async?: false)
  end

  defp authorized_node_batch({:operator, type, operator_id}, ids)
       when type in [:affiliate_network, :affiliate_program, :affiliate_link, :coupon] and
              is_integer(operator_id) and operator_id > 0 do
    ids
    |> Enum.to_list()
    |> then(&Affiliate.get_affiliate_nodes(type, &1))
  end

  defp authorized_node_batch({:owner, :saved_comparison_set, user_id}, entropy_ids)
       when is_integer(user_id) and user_id > 0 do
    entropy_ids
    |> Enum.to_list()
    |> then(&Catalog.get_saved_comparison_sets_for_user(%User{id: user_id}, &1))
  end

  defp authorized_node_batch({:owner, :api_token, user_id}, entropy_ids)
       when is_integer(user_id) and user_id > 0 do
    entropy_ids
    |> Enum.to_list()
    |> then(&Accounts.get_api_tokens_for_user(%User{id: user_id}, &1))
  end

  @spec authorized_connections() :: Dataloader.Source.t()
  def authorized_connections do
    Dataloader.KV.new(&authorized_connection_batch/2, async?: false)
  end

  defp authorized_connection_batch(
         {:owner, kind, owner_id, role, filters, connection_args},
         requests
       )
       when kind in [
              :specification_corrections,
              :price_watches,
              :alert_events,
              :api_tokens,
              :saved_comparison_sets,
              :comparison_snapshots
            ] and is_integer(owner_id) and owner_id > 0 and role in [:member, :operator] and
              is_map(filters) and is_map(connection_args) do
    result =
      kind
      |> authorized_owner_connection_query(owner_id, filters)
      |> Connection.from_query_result(connection_args, Repo)

    Map.new(requests, &{&1, result})
  end

  defp authorized_connection_batch(
         {:operator, kind, operator_id, :operator, filters, connection_args},
         requests
       )
       when kind in [:specification_correction_moderation_queue, :merchant_feed_candidates] and
              is_integer(operator_id) and operator_id > 0 and is_map(filters) and
              is_map(connection_args) do
    result =
      kind
      |> authorized_operator_connection_query(filters)
      |> Connection.from_query_result(connection_args, Repo)

    Map.new(requests, &{&1, result})
  end

  defp authorized_owner_connection_query(:specification_corrections, owner_id, filters) do
    Specs.list_user_corrections_query(owner_id, status: Map.get(filters, :status))
  end

  defp authorized_owner_connection_query(:price_watches, owner_id, filters) do
    Alerts.list_watch_rules_query(owner_id, enabled: Map.get(filters, :enabled))
  end

  defp authorized_owner_connection_query(:alert_events, owner_id, filters) do
    Alerts.list_alert_events_query(owner_id, unread_only: Map.fetch!(filters, :unread_only))
  end

  defp authorized_owner_connection_query(:api_tokens, owner_id, filters) do
    Accounts.list_api_tokens_query(owner_id, status: Map.fetch!(filters, :status))
  end

  defp authorized_owner_connection_query(:saved_comparison_sets, owner_id, _filters) do
    Catalog.list_saved_comparison_sets_query(owner_id)
  end

  defp authorized_owner_connection_query(:comparison_snapshots, owner_id, _filters) do
    ComparisonSnapshots.active_for_owner_query(owner_id)
  end

  defp authorized_operator_connection_query(:specification_correction_moderation_queue, filters) do
    Specs.list_correction_moderation_query(status: Map.fetch!(filters, :status))
  end

  defp authorized_operator_connection_query(:merchant_feed_candidates, filters) do
    Ingestion.list_merchant_feed_candidates_query(
      review_status: Map.fetch!(filters, :review_status),
      sort: Map.fetch!(filters, :sort)
    )
  end

  defp project_lookup_results(items, values) do
    Map.new(items, &{&1, Map.get(values, &1)})
  end
end
