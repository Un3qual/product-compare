defmodule ProductCompare.Seo.Sitemaps do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.Seo.{Categories, Metadata, QualificationPolicy}
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Pricing.Merchant
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
    now
    |> Categories.qualified_products_query()
    |> order_by([product], asc: product.id)
    |> limit(^limit)
    |> select([product], {
      fragment("'/products/' || ?", product.slug),
      fragment(
        "GREATEST(?, COALESCE((SELECT max(pac.selected_at) FROM product_attribute_current pac WHERE pac.product_id = ?), ?), COALESCE((SELECT max(pm.observed_at) FROM product_media pm WHERE pm.product_id = ?), ?), COALESCE((SELECT max(pp.observed_at) FROM price_points pp INNER JOIN merchant_products mp ON mp.id = pp.merchant_product_id WHERE mp.product_id = ?), ?))",
        product.updated_at,
        product.id,
        product.updated_at,
        product.id,
        product.updated_at,
        product.id,
        product.updated_at
      )
    })
    |> Repo.all()
  end

  defp sitemap_query(:merchants, now, limit) do
    eligible_merchants =
      now
      |> Categories.eligible_offer_scope()
      |> select([offer], %{merchant_id: offer.merchant_id})
      |> distinct(true)

    Merchant
    |> join(:inner, [merchant], eligible in subquery(eligible_merchants),
      on: eligible.merchant_id == merchant.id
    )
    |> order_by([merchant], asc: merchant.id)
    |> limit(^limit)
    |> select([merchant], {
      fragment("'/merchants/' || ?", merchant.slug),
      fragment(
        "GREATEST(?, COALESCE((SELECT max(mp.updated_at) FROM merchant_products mp WHERE mp.merchant_id = ?), ?), COALESCE((SELECT max(pp.observed_at) FROM price_points pp INNER JOIN merchant_products mp ON mp.id = pp.merchant_product_id WHERE mp.merchant_id = ?), ?))",
        merchant.updated_at,
        merchant.id,
        merchant.updated_at,
        merchant.id,
        merchant.updated_at
      )
    })
    |> Repo.all()
  end

  defp sitemap_query(:categories, now, limit) do
    qualifying_products = Categories.qualified_products_query(now)
    minimum_description_length = QualificationPolicy.minimum_description_length()
    minimum_category_products = QualificationPolicy.minimum_category_products()

    Taxon
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
    |> select([taxon, _closure, product], {
      fragment("'/categories/' || ?", taxon.seo_slug),
      fragment(
        "GREATEST(?, COALESCE(max(?), ?), COALESCE((SELECT max(pac.selected_at) FROM product_attribute_current pac INNER JOIN products p ON p.id = pac.product_id INNER JOIN taxon_closure tc ON tc.descendant_id = p.primary_type_taxon_id WHERE tc.ancestor_id = ?), ?), COALESCE((SELECT max(pp.observed_at) FROM price_points pp INNER JOIN merchant_products mp ON mp.id = pp.merchant_product_id INNER JOIN products p ON p.id = mp.product_id INNER JOIN taxon_closure tc ON tc.descendant_id = p.primary_type_taxon_id WHERE tc.ancestor_id = ?), ?))",
        taxon.updated_at,
        product.updated_at,
        taxon.updated_at,
        taxon.id,
        taxon.updated_at,
        taxon.id,
        taxon.updated_at
      )
    })
    |> Repo.all()
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
    |> Enum.filter(&Metadata.snapshot_qualified?/1)
    |> Enum.map(fn snapshot ->
      {"/compare/shared/#{snapshot.public_token}", snapshot.inserted_at}
    end)
  end
end
