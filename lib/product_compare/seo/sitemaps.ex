defmodule ProductCompare.Seo.Sitemaps do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Repo
  alias ProductCompare.Seo.{Categories, Metadata, QualificationPolicy}
  alias ProductCompareSchemas.Catalog.{ComparisonSnapshot, Product, ProductMedia}
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonClosure}

  @maximum_sitemap_entries 10_000

  @spec entries(:products | :merchants | :categories | :comparisons, keyword()) :: [map()]
  def entries(kind, opts \\ []) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    limit = min(Keyword.get(opts, :limit, @maximum_sitemap_entries), @maximum_sitemap_entries)

    kind
    |> sitemap_query(now, limit)
    |> Enum.map(fn {path, changed_at} -> %{path: path, last_modified: changed_at} end)
  end

  defp sitemap_query(:products, now, limit) do
    attribute_activity = product_attribute_activity_query()
    media_activity = product_media_activity_query()
    price_activity = product_price_activity_query()

    now
    |> Categories.qualified_products_query()
    |> order_by([product], asc: product.id)
    |> limit(^limit)
    |> select([product], %{
      slug: product.slug,
      product_updated_at: product.updated_at,
      attribute_selected_at: subquery(attribute_activity),
      media_observed_at: subquery(media_activity),
      price_observed_at: subquery(price_activity)
    })
    |> Repo.all()
    |> Enum.map(fn row ->
      timestamps = [
        row.product_updated_at,
        row.attribute_selected_at,
        row.media_observed_at,
        row.price_observed_at
      ]

      {"/products/#{row.slug}", latest_datetime(timestamps)}
    end)
  end

  defp sitemap_query(:merchants, now, limit) do
    eligible_merchants =
      now
      |> Categories.eligible_offer_scope()
      |> select([offer], %{merchant_id: offer.merchant_id})
      |> distinct(true)

    offer_activity = merchant_offer_activity_query()
    price_activity = merchant_price_activity_query()

    Merchant
    |> from(as: :merchant)
    |> join(:inner, [merchant], eligible in subquery(eligible_merchants),
      on: eligible.merchant_id == merchant.id
    )
    |> order_by([merchant], asc: merchant.id)
    |> limit(^limit)
    |> select([merchant], %{
      slug: merchant.slug,
      merchant_updated_at: merchant.updated_at,
      offer_updated_at: subquery(offer_activity),
      price_observed_at: subquery(price_activity)
    })
    |> Repo.all()
    |> Enum.map(fn row ->
      timestamps = [row.merchant_updated_at, row.offer_updated_at, row.price_observed_at]
      {"/merchants/#{row.slug}", latest_datetime(timestamps)}
    end)
  end

  defp sitemap_query(:categories, now, limit) do
    qualifying_products = Categories.qualified_products_query(now)
    attribute_activity = category_attribute_activity_query()
    price_activity = category_price_activity_query()
    minimum_description_length = QualificationPolicy.minimum_description_length()
    minimum_category_products = QualificationPolicy.minimum_category_products()

    Taxon
    |> from(as: :taxon)
    |> join(:inner, [taxon], closure in TaxonClosure, on: closure.ancestor_id == taxon.id)
    |> join(:inner, [taxon, closure], product in subquery(qualifying_products),
      on: product.primary_type_taxon_id == closure.descendant_id
    )
    |> where(
      [taxon],
      taxon.seo_indexable == true and not is_nil(taxon.seo_slug) and
        fragment(
          "char_length(trim(coalesce(?, ''))) >= ?",
          taxon.seo_description,
          ^minimum_description_length
        )
    )
    |> group_by([taxon], [taxon.id, taxon.seo_slug, taxon.updated_at])
    |> having(
      [taxon, _closure, product],
      count(product.id, :distinct) >= ^minimum_category_products
    )
    |> order_by([taxon], asc: taxon.id)
    |> limit(^limit)
    |> select([taxon, _closure, product], %{
      slug: taxon.seo_slug,
      taxon_updated_at: taxon.updated_at,
      product_updated_at: max(product.updated_at),
      attribute_selected_at: subquery(attribute_activity),
      price_observed_at: subquery(price_activity)
    })
    |> Repo.all()
    |> Enum.map(fn row ->
      timestamps = [
        row.taxon_updated_at,
        row.product_updated_at,
        row.attribute_selected_at,
        row.price_observed_at
      ]

      {"/categories/#{row.slug}", latest_datetime(timestamps)}
    end)
  end

  defp sitemap_query(:comparisons, _now, limit) do
    ComparisonSnapshot
    |> where(
      [snapshot],
      snapshot.search_indexable == true and snapshot.search_qualified == true and
        is_nil(snapshot.revoked_at)
    )
    |> order_by([snapshot], asc: snapshot.inserted_at, asc: snapshot.id)
    |> limit(^limit)
    |> Repo.all()
    |> ComparisonSnapshots.hydrate_many()
    |> Enum.filter(&Metadata.snapshot_qualified?/1)
    |> Enum.map(fn snapshot ->
      {"/compare/shared/#{snapshot.public_token}", snapshot.inserted_at}
    end)
  end

  defp product_attribute_activity_query do
    from current in ProductAttributeCurrent,
      where: current.product_id == parent_as(:product).id,
      select: max(current.selected_at)
  end

  defp product_media_activity_query do
    from media in ProductMedia,
      where: media.product_id == parent_as(:product).id,
      select: max(media.observed_at)
  end

  defp product_price_activity_query do
    from price in PricePoint,
      join: offer in MerchantProduct,
      on: offer.id == price.merchant_product_id,
      where: offer.product_id == parent_as(:product).id,
      select: max(price.observed_at)
  end

  defp merchant_offer_activity_query do
    from offer in MerchantProduct,
      where: offer.merchant_id == parent_as(:merchant).id,
      select: max(offer.updated_at)
  end

  defp merchant_price_activity_query do
    from price in PricePoint,
      join: offer in MerchantProduct,
      on: offer.id == price.merchant_product_id,
      where: offer.merchant_id == parent_as(:merchant).id,
      select: max(price.observed_at)
  end

  defp category_attribute_activity_query do
    from current in ProductAttributeCurrent,
      join: product in Product,
      on: product.id == current.product_id,
      join: closure in TaxonClosure,
      on: closure.descendant_id == product.primary_type_taxon_id,
      where: closure.ancestor_id == parent_as(:taxon).id,
      select: max(current.selected_at)
  end

  defp category_price_activity_query do
    from price in PricePoint,
      join: offer in MerchantProduct,
      on: offer.id == price.merchant_product_id,
      join: product in Product,
      on: product.id == offer.product_id,
      join: closure in TaxonClosure,
      on: closure.descendant_id == product.primary_type_taxon_id,
      where: closure.ancestor_id == parent_as(:taxon).id,
      select: max(price.observed_at)
  end

  defp latest_datetime(timestamps) do
    timestamps
    |> Enum.reject(&is_nil/1)
    |> Enum.max_by(&DateTime.to_unix(&1, :microsecond))
  end
end
