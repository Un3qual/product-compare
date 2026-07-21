defmodule ProductCompareWeb.GraphQL.Loader do
  @moduledoc """
  Builds the request-scoped GraphQL dataloader sources.
  """

  import Ecto.Query

  alias ProductCompare.{Affiliate, Catalog, Discussions, Pricing, Seo}
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.SpecificationCorrection
  alias ProductCompareSchemas.Specs.SourceArtifact

  @merchant_detail_source {__MODULE__, :merchant_detail}
  @product_evidence_source {__MODULE__, :product_evidence}
  @community_connection_source {__MODULE__, :community_connections}
  @offer_connection_source {__MODULE__, :offer_connections}

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
      @offer_connection_source,
      Dataloader.KV.new(&offer_connection_batch/2, async?: false)
    )
  end

  @spec merchant_detail_source() :: {module(), :merchant_detail}
  def merchant_detail_source, do: @merchant_detail_source

  @spec product_evidence_source() :: {module(), :product_evidence}
  def product_evidence_source, do: @product_evidence_source

  @spec community_connection_source() :: {module(), :community_connections}
  def community_connection_source, do: @community_connection_source

  @spec offer_connection_source() :: {module(), :offer_connections}
  def offer_connection_source, do: @offer_connection_source

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

  defp project_connection_pages(parents, pages, connection_args, parent_key) do
    Map.new(parents, fn parent ->
      {parent,
       pages
       |> Map.fetch!(parent_key.(parent))
       |> ProductCompareWeb.GraphQL.Connection.from_prefetched_page(connection_args)}
    end)
  end
end
