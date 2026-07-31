defmodule ProductCompareWeb.GraphQL.Loader.ParentSources do
  @moduledoc false

  alias ProductCompare.{Affiliate, Discussions, Pricing, Seo}
  alias ProductCompareWeb.GraphQL.Connection
  alias ProductCompareWeb.GraphQL.Loader.EctoBatchSource

  @spec merchant_detail() :: Dataloader.Source.t()
  def merchant_detail do
    EctoBatchSource.new(&merchant_detail_batch/2)
  end

  defp merchant_detail_batch(:summary, merchants) do
    merchants
    |> Enum.to_list()
    |> Pricing.merchant_details(now: DateTime.utc_now())
  end

  @spec product_evidence() :: Dataloader.Source.t()
  def product_evidence do
    EctoBatchSource.new(&product_evidence_batch/2)
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

  @spec community_connections() :: Dataloader.Source.t()
  def community_connections do
    EctoBatchSource.new(&community_connection_batch/2)
  end

  defp community_connection_batch({kind, connection_args}, parents)
       when kind in [:reviews, :questions, :answers] and is_map(connection_args) do
    parents = Enum.to_list(parents)
    {:ok, window} = Connection.batch_window(connection_args)

    pages =
      Discussions.public_connection_pages(kind, Enum.map(parents, & &1.id), window)

    Map.new(parents, fn parent ->
      {parent,
       pages
       |> Map.fetch!(parent.id)
       |> Connection.from_prefetched_page(connection_args)}
    end)
  end

  @spec viewer_submissions() :: Dataloader.Source.t()
  def viewer_submissions do
    EctoBatchSource.new(&viewer_submission_batch/2)
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

  @spec offer_connections() :: Dataloader.Source.t()
  def offer_connections do
    EctoBatchSource.new(&offer_connection_batch/2)
  end

  defp offer_connection_batch({:product_offers, connection_args, filters}, products)
       when is_map(connection_args) and is_map(filters) do
    products = Enum.to_list(products)
    {:ok, window} = Connection.batch_window(connection_args)

    pages = Pricing.product_offer_pages(Enum.map(products, & &1.id), filters, window)

    project_connection_pages(products, pages, connection_args, & &1.id)
  end

  defp offer_connection_batch({:merchant_offers, connection_args}, merchants)
       when is_map(connection_args) do
    merchants = Enum.to_list(merchants)
    {:ok, window} = Connection.batch_window(connection_args)

    pages = Pricing.merchant_offer_pages(Enum.map(merchants, & &1.id), window)

    project_connection_pages(merchants, pages, connection_args, & &1.id)
  end

  defp offer_connection_batch({:active_coupons, connection_args}, merchant_products)
       when is_map(connection_args) do
    merchant_products = Enum.to_list(merchant_products)
    {:ok, window} = Connection.batch_window(connection_args)
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
    {:ok, window} = Connection.batch_window(connection_args)

    pages =
      merchant_products
      |> Enum.map(& &1.id)
      |> Pricing.price_history_pages(range_filters, window)

    project_connection_pages(merchant_products, pages, connection_args, & &1.id)
  end

  @spec categories() :: Dataloader.Source.t()
  def categories do
    EctoBatchSource.new(&category_batch/2)
  end

  defp category_batch(:lookup, slugs) do
    slugs
    |> Enum.to_list()
    |> Seo.get_categories()
  end

  defp category_batch({:products, connection_args, now}, categories)
       when is_map(connection_args) and is_struct(now, DateTime) do
    categories = Enum.to_list(categories)
    {:ok, window} = Connection.batch_window(connection_args)

    pages =
      categories
      |> Enum.map(& &1.id)
      |> Seo.qualified_product_pages(now, window)

    project_connection_pages(categories, pages, connection_args, & &1.id)
  end

  defp project_connection_pages(parents, pages, connection_args, parent_key) do
    Map.new(parents, fn parent ->
      {parent,
       pages
       |> Map.fetch!(parent_key.(parent))
       |> Connection.from_prefetched_page(connection_args)}
    end)
  end
end
