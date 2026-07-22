defmodule ProductCompareWeb.GraphQL.Loader do
  @moduledoc """
  Builds the request-scoped GraphQL dataloader sources.
  """

  import Ecto.Query

  alias ProductCompare.{
    Accounts,
    Alerts,
    Affiliate,
    Catalog,
    ComparisonSnapshots,
    Discussions,
    Ingestion,
    Pricing,
    Seo,
    Specs
  }

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection
  alias ProductCompareSchemas.Specs.SourceArtifact

  @merchant_detail_source {__MODULE__, :merchant_detail}
  @product_evidence_source {__MODULE__, :product_evidence}
  @community_connection_source {__MODULE__, :community_connections}
  @viewer_submission_source {__MODULE__, :viewer_community_submissions}
  @offer_connection_source {__MODULE__, :offer_connections}
  @category_source {__MODULE__, :categories}
  @comparison_source {__MODULE__, :comparison}
  @public_slug_source {__MODULE__, :public_slugs}
  @public_opaque_source {__MODULE__, :public_opaque_keys}
  @authorized_node_source {__MODULE__, :authorized_nodes}
  @authorized_connection_source {__MODULE__, :authorized_connections}

  @spec new(map()) :: Dataloader.t()
  def new(params \\ %{}) do
    Dataloader.new()
    |> Dataloader.add_source(Catalog, catalog_source(params))
    |> Dataloader.add_source(Pricing, pricing_source(params))
    |> Dataloader.add_source(
      @merchant_detail_source,
      Dataloader.KV.new(&merchant_detail_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @product_evidence_source,
      Dataloader.KV.new(&product_evidence_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @community_connection_source,
      Dataloader.KV.new(&community_connection_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @viewer_submission_source,
      Dataloader.KV.new(&viewer_submission_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @offer_connection_source,
      Dataloader.KV.new(&offer_connection_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @category_source,
      Dataloader.KV.new(&category_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @comparison_source,
      Dataloader.KV.new(&comparison_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @public_slug_source,
      Dataloader.KV.new(&public_slug_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @public_opaque_source,
      Dataloader.KV.new(&public_opaque_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @authorized_node_source,
      Dataloader.KV.new(&authorized_node_batch/2, async?: false)
    )
    |> Dataloader.add_source(
      @authorized_connection_source,
      Dataloader.KV.new(&authorized_connection_batch/2, async?: false)
    )
  end

  @spec merchant_detail_source() :: {module(), :merchant_detail}
  def merchant_detail_source, do: @merchant_detail_source

  @spec product_evidence_source() :: {module(), :product_evidence}
  def product_evidence_source, do: @product_evidence_source

  @spec community_connection_source() :: {module(), :community_connections}
  def community_connection_source, do: @community_connection_source

  @spec viewer_submission_source() :: {module(), :viewer_community_submissions}
  def viewer_submission_source, do: @viewer_submission_source

  @spec offer_connection_source() :: {module(), :offer_connections}
  def offer_connection_source, do: @offer_connection_source

  @spec category_source() :: {module(), :categories}
  def category_source, do: @category_source

  @spec comparison_source() :: {module(), :comparison}
  def comparison_source, do: @comparison_source

  @spec public_slug_source() :: {module(), :public_slugs}
  def public_slug_source, do: @public_slug_source

  @spec public_opaque_source() :: {module(), :public_opaque_keys}
  def public_opaque_source, do: @public_opaque_source

  @spec authorized_node_source() :: {module(), :authorized_nodes}
  def authorized_node_source, do: @authorized_node_source

  @spec authorized_connection_source() :: {module(), :authorized_connections}
  def authorized_connection_source, do: @authorized_connection_source

  defp catalog_source(params) do
    Dataloader.Ecto.new(Repo, query: &catalog_query/2, default_params: params)
  end

  defp pricing_source(params) do
    Dataloader.Ecto.new(Repo,
      query: &pricing_query/2,
      default_params: params,
      run_batch: &pricing_run_batch/5
    )
  end

  defp catalog_query(ProductAttributeCurrent, _params) do
    ProductAttributeCurrent
    |> join(:inner, [current], attribute in assoc(current, :attribute))
    |> order_by([_current, attribute], asc: attribute.display_name, asc: attribute.code)
    |> preload([_current, attribute],
      attribute: attribute,
      claim: [:unit, :enum_option, evidence_links: [artifact: :source]]
    )
  end

  defp catalog_query(ProductMedia, _params) do
    ProductMedia
    |> order_by([media], asc: media.position, asc: media.url, asc: media.id)
    |> preload([media], source_artifact: [:source])
  end

  defp catalog_query(SpecificationCorrection, _params) do
    SpecificationCorrection
    |> where([correction], correction.status in [:pending, :accepted])
    |> order_by([correction], asc: correction.attribute_id, asc: correction.id)
  end

  defp catalog_query(queryable, _params), do: queryable
  defp pricing_query(SourceArtifact, _params), do: preload(SourceArtifact, :source)
  defp pricing_query(queryable, _params), do: queryable

  defp pricing_run_batch(PricePoint, query, :latest_price, merchant_product_ids, repo_opts) do
    latest_prices =
      query
      |> Pricing.latest_prices_query(merchant_product_ids)
      |> Repo.all(repo_opts)
      |> Map.new(&{&1.merchant_product_id, &1})

    for merchant_product_id <- merchant_product_ids do
      [Map.get(latest_prices, merchant_product_id)]
    end
  end

  defp pricing_run_batch(queryable, query, col, inputs, repo_opts) do
    Dataloader.Ecto.run_batch(Repo, queryable, query, col, inputs, repo_opts)
  end

  defp merchant_detail_batch(:summary, merchants) do
    merchants
    |> Enum.to_list()
    |> Pricing.merchant_details(now: DateTime.utc_now())
  end

  defp product_evidence_batch(batch_key, products) do
    products = Enum.to_list(products)
    now = DateTime.utc_now()

    case batch_key do
      :offer_truth ->
        offer_truths = Pricing.current_offer_truths(Enum.map(products, & &1.id), now: now)
        empty_offer_truth = Pricing.current_offer_truth(nil, now: now)

        Map.new(products, fn product ->
          {product, Map.get(offer_truths, product.id, empty_offer_truth)}
        end)

      :review_summary ->
        summaries = Discussions.review_summaries(Enum.map(products, & &1.id))

        Map.new(products, fn product ->
          {product, Map.fetch!(summaries, product.id)}
        end)

      :seo ->
        Seo.product_metadata_batch(products, now: now)
    end
  end

  defp community_connection_batch({kind, connection_args}, parents)
       when kind in [:reviews, :questions, :answers] and is_map(connection_args) do
    parents = Enum.to_list(parents)
    {:ok, window} = ProductCompareWeb.GraphQL.Connection.batch_window(connection_args)

    pages =
      Discussions.public_connection_pages(kind, Enum.map(parents, & &1.id), window)

    Map.new(parents, fn parent ->
      {parent,
       pages
       |> Map.fetch!(parent.id)
       |> ProductCompareWeb.GraphQL.Connection.from_prefetched_page(connection_args)}
    end)
  end

  defp viewer_submission_batch(user_id, products)
       when is_integer(user_id) and user_id > 0 do
    products = Enum.to_list(products)

    submissions =
      Discussions.viewer_community_submissions_for_products(
        user_id,
        Enum.map(products, & &1.id)
      )

    Map.new(products, fn product ->
      {product, Map.fetch!(submissions, product.id)}
    end)
  end

  defp offer_connection_batch({:product_offers, connection_args, filters}, products)
       when is_map(connection_args) and is_map(filters) do
    products = Enum.to_list(products)
    {:ok, window} = ProductCompareWeb.GraphQL.Connection.batch_window(connection_args)

    pages = Pricing.product_offer_pages(Enum.map(products, & &1.id), filters, window)

    project_connection_pages(products, pages, connection_args, & &1.id)
  end

  defp offer_connection_batch({:merchant_offers, connection_args}, merchants)
       when is_map(connection_args) do
    merchants = Enum.to_list(merchants)
    {:ok, window} = ProductCompareWeb.GraphQL.Connection.batch_window(connection_args)

    pages = Pricing.merchant_offer_pages(Enum.map(merchants, & &1.id), window)

    project_connection_pages(merchants, pages, connection_args, & &1.id)
  end

  defp offer_connection_batch({:active_coupons, connection_args}, merchant_products)
       when is_map(connection_args) do
    merchant_products = Enum.to_list(merchant_products)
    {:ok, window} = ProductCompareWeb.GraphQL.Connection.batch_window(connection_args)
    now = DateTime.utc_now()

    pages =
      merchant_products
      |> Enum.map(& &1.merchant_id)
      |> Enum.uniq()
      |> Affiliate.active_coupon_pages(now, window)

    project_connection_pages(
      merchant_products,
      pages,
      connection_args,
      & &1.merchant_id
    )
  end

  defp offer_connection_batch(
         {:price_history, connection_args, range_filters},
         merchant_products
       )
       when is_map(connection_args) and is_map(range_filters) do
    merchant_products = Enum.to_list(merchant_products)
    {:ok, window} = ProductCompareWeb.GraphQL.Connection.batch_window(connection_args)

    pages =
      merchant_products
      |> Enum.map(& &1.id)
      |> Pricing.price_history_pages(range_filters, window)

    project_connection_pages(merchant_products, pages, connection_args, & &1.id)
  end

  defp category_batch(:lookup, slugs) do
    slugs
    |> Enum.to_list()
    |> Seo.get_categories()
  end

  defp category_batch({:products, connection_args, now}, categories)
       when is_map(connection_args) and is_struct(now, DateTime) do
    categories = Enum.to_list(categories)
    {:ok, window} = ProductCompareWeb.GraphQL.Connection.batch_window(connection_args)

    pages =
      categories
      |> Enum.map(& &1.id)
      |> Seo.qualified_product_pages(now, window)

    project_connection_pages(categories, pages, connection_args, & &1.id)
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
      |> ProductCompareWeb.GraphQL.Connection.from_query_result(connection_args, Repo)

    Map.new(requests, &{&1, result})
  end

  defp authorized_connection_batch(
         {:operator, kind, operator_id, role, filters, connection_args},
         requests
       )
       when kind in [:specification_correction_moderation_queue, :merchant_feed_candidates] and
              is_integer(operator_id) and operator_id > 0 and role == :operator and
              is_map(filters) and is_map(connection_args) do
    result =
      kind
      |> authorized_operator_connection_query(filters)
      |> ProductCompareWeb.GraphQL.Connection.from_query_result(connection_args, Repo)

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

  defp project_connection_pages(parents, pages, connection_args, parent_key) do
    Map.new(parents, fn parent ->
      {parent,
       pages
       |> Map.fetch!(parent_key.(parent))
       |> ProductCompareWeb.GraphQL.Connection.from_prefetched_page(connection_args)}
    end)
  end
end
