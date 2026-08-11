defmodule ProductCompareWeb.GraphQL.Loader.ParentSources do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.{Affiliate, Discussions, Pricing, Repo, Seo}
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct}
  alias ProductCompareSchemas.Taxonomy.Taxon

  @spec merchant_detail() :: Dataloader.Ecto.t()
  def merchant_detail do
    Dataloader.Ecto.new(Repo, run_batch: &merchant_detail_batch/5)
  end

  defp merchant_detail_batch(Merchant, query, :summary, merchant_ids, repo_opts) do
    merchants = query |> where([merchant], merchant.id in ^merchant_ids) |> Repo.all(repo_opts)

    details_by_id =
      merchants
      |> Pricing.merchant_details(now: DateTime.utc_now())
      |> Map.new(fn {merchant, detail} -> {merchant.id, detail} end)

    batch_values(merchant_ids, details_by_id)
  end

  @spec product_evidence() :: Dataloader.Ecto.t()
  def product_evidence do
    Dataloader.Ecto.new(Repo, run_batch: &product_evidence_batch/5)
  end

  defp product_evidence_batch(Product, _query, :offer_truth, product_ids, _repo_opts) do
    now = DateTime.utc_now()
    offer_truths = Pricing.current_offer_truths(product_ids, now: now)
    empty_offer_truth = Pricing.current_offer_truth(nil, now: now)

    product_ids
    |> Map.new(&{&1, Map.get(offer_truths, &1, empty_offer_truth)})
    |> then(&batch_values(product_ids, &1))
  end

  defp product_evidence_batch(Product, _query, :review_summary, product_ids, _repo_opts) do
    product_ids
    |> Discussions.review_summaries()
    |> then(&batch_values(product_ids, &1))
  end

  defp product_evidence_batch(Product, query, :seo, product_ids, repo_opts) do
    products = query |> where([product], product.id in ^product_ids) |> Repo.all(repo_opts)

    metadata_by_id =
      products
      |> Seo.product_metadata_batch(now: DateTime.utc_now())
      |> Map.new(fn {product, metadata} -> {product.id, metadata} end)

    batch_values(product_ids, metadata_by_id)
  end

  @spec community_connections() :: Dataloader.Ecto.t()
  def community_connections do
    Dataloader.Ecto.new(Repo, run_batch: &community_connection_batch/5)
  end

  defp community_connection_batch(
         Product,
         _query,
         {kind, connection_args},
         product_ids,
         _repo_opts
       )
       when kind in [:reviews, :questions] and is_map(connection_args) do
    project_connection_pages(kind, product_ids, connection_args)
  end

  defp community_connection_batch(
         ProductThread,
         _query,
         {:answers, connection_args},
         question_ids,
         _repo_opts
       )
       when is_map(connection_args) do
    project_connection_pages(:answers, question_ids, connection_args)
  end

  @spec viewer_submissions() :: Dataloader.Ecto.t()
  def viewer_submissions do
    Dataloader.Ecto.new(Repo, run_batch: &viewer_submission_batch/5)
  end

  defp viewer_submission_batch(
         Product,
         _query,
         {:viewer_submissions, user_id},
         product_ids,
         _repo_opts
       )
       when is_integer(user_id) and user_id > 0 do
    user_id
    |> Discussions.viewer_community_submissions_for_products(product_ids)
    |> then(&batch_values(product_ids, &1))
  end

  @spec offer_connections() :: Dataloader.Ecto.t()
  def offer_connections do
    Dataloader.Ecto.new(Repo, run_batch: &offer_connection_batch/5)
  end

  defp offer_connection_batch(
         Product,
         _query,
         {:product_offers, connection_args, filters},
         product_ids,
         _repo_opts
       )
       when is_map(connection_args) and is_map(filters) do
    {:ok, window} = Connection.batch_window(connection_args)
    pages = Pricing.product_offer_pages(product_ids, filters, window)
    project_prefetched_pages(product_ids, pages, connection_args)
  end

  defp offer_connection_batch(
         Merchant,
         _query,
         {:merchant_offers, connection_args},
         merchant_ids,
         _repo_opts
       )
       when is_map(connection_args) do
    {:ok, window} = Connection.batch_window(connection_args)
    pages = Pricing.merchant_offer_pages(merchant_ids, window)
    project_prefetched_pages(merchant_ids, pages, connection_args)
  end

  defp offer_connection_batch(
         Merchant,
         _query,
         {:active_coupons, connection_args},
         merchant_ids,
         _repo_opts
       )
       when is_map(connection_args) do
    {:ok, window} = Connection.batch_window(connection_args)
    pages = Affiliate.active_coupon_pages(merchant_ids, DateTime.utc_now(), window)
    project_prefetched_pages(merchant_ids, pages, connection_args)
  end

  defp offer_connection_batch(
         MerchantProduct,
         _query,
         {:price_history, connection_args, range_filters},
         merchant_product_ids,
         _repo_opts
       )
       when is_map(connection_args) and is_map(range_filters) do
    {:ok, window} = Connection.batch_window(connection_args)
    pages = Pricing.price_history_pages(merchant_product_ids, range_filters, window)
    project_prefetched_pages(merchant_product_ids, pages, connection_args)
  end

  @spec home_offer_summaries(map()) :: Dataloader.Ecto.t()
  def home_offer_summaries(params) do
    now = Map.get_lazy(params, :graphql_observed_at, &DateTime.utc_now/0)

    Dataloader.Ecto.new(Repo,
      run_batch: fn schema, query, operation, ids, repo_opts ->
        home_offer_summary_batch(schema, query, operation, ids, repo_opts, now)
      end
    )
  end

  defp home_offer_summary_batch(
         MerchantProduct,
         _query,
         :price_signal,
         merchant_product_ids,
         _repo_opts,
         now
       ) do
    signals = Pricing.home_offer_price_signals(merchant_product_ids, now: now)
    batch_values(merchant_product_ids, signals)
  end

  @spec categories() :: Dataloader.Ecto.t()
  def categories do
    Dataloader.Ecto.new(Repo, run_batch: &category_batch/5)
  end

  defp category_batch(
         Taxon,
         _query,
         {:products, connection_args, %DateTime{} = now},
         category_ids,
         _repo_opts
       )
       when is_map(connection_args) do
    {:ok, window} = Connection.batch_window(connection_args)
    pages = Seo.qualified_product_pages(category_ids, now, window)
    project_prefetched_pages(category_ids, pages, connection_args)
  end

  defp project_connection_pages(kind, parent_ids, connection_args) do
    {:ok, window} = Connection.batch_window(connection_args)
    pages = Discussions.public_connection_pages(kind, parent_ids, window)
    project_prefetched_pages(parent_ids, pages, connection_args)
  end

  defp project_prefetched_pages(parent_ids, pages, connection_args) do
    results =
      Map.new(parent_ids, fn parent_id ->
        {:ok, connection} =
          pages
          |> Map.fetch!(parent_id)
          |> Connection.from_prefetched_page(connection_args)

        {parent_id, connection}
      end)

    batch_values(parent_ids, results)
  end

  defp batch_values(ids, values_by_id) do
    Enum.map(ids, &[Map.get(values_by_id, &1)])
  end
end
