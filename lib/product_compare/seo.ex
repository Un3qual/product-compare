defmodule ProductCompare.Seo do
  @moduledoc """
  Owns public search qualification, metadata, and bounded sitemap reads.

  Search surfaces call this policy instead of independently guessing whether
  public catalog facts are complete and fresh enough to advertise.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.Seo.{Categories, Metadata}
  alias ProductCompareSchemas.Catalog.{ComparisonSnapshot, Product}
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonClosure}

  @minimum_description_length 80
  @minimum_category_products 3
  @maximum_sitemap_entries 10_000

  @type metadata :: %{
          canonical_path: String.t(),
          description: String.t(),
          image_url: String.t() | nil,
          indexable: boolean(),
          structured_data: map() | nil,
          title: String.t()
        }

  @spec product_metadata(Product.t(), keyword()) :: metadata()
  def product_metadata(%Product{} = product, opts \\ []), do: Metadata.product(product, opts)

  @spec product_metadata_batch([Product.t()], keyword()) :: %{Product.t() => metadata()}
  def product_metadata_batch(products, opts \\ []) when is_list(products),
    do: Metadata.product_batch(products, opts)

  @spec merchant_metadata(Merchant.t(), keyword()) :: metadata()
  def merchant_metadata(%Merchant{} = merchant, opts \\ []), do: Metadata.merchant(merchant, opts)

  @spec snapshot_metadata(ComparisonSnapshot.t()) :: metadata()
  def snapshot_metadata(%ComparisonSnapshot{} = snapshot), do: Metadata.snapshot(snapshot)

  @spec snapshot_qualified?(ComparisonSnapshot.t() | map()) :: boolean()
  def snapshot_qualified?(snapshot_or_payload),
    do: Metadata.snapshot_qualified?(snapshot_or_payload)

  @spec get_category(String.t(), keyword()) :: map() | nil
  def get_category(slug, opts \\ [])

  def get_category(slug, opts) when is_binary(slug), do: Categories.get(slug, opts)

  def get_category(_slug, _opts), do: nil

  @spec get_categories([String.t()], keyword()) :: %{String.t() => map() | nil}
  def get_categories(slugs, opts \\ []) when is_list(slugs), do: Categories.get_many(slugs, opts)

  @spec category_metadata(map()) :: metadata()
  def category_metadata(category), do: Metadata.category(category)

  @spec qualified_products_for_taxon_query(pos_integer(), DateTime.t()) :: Ecto.Query.t()
  def qualified_products_for_taxon_query(taxon_id, %DateTime{} = now),
    do: Categories.qualified_products_for_taxon_query(taxon_id, now)

  @spec qualified_product_pages(
          [pos_integer()],
          DateTime.t(),
          %{offset: non_neg_integer(), fetch_limit: non_neg_integer()}
        ) :: %{optional(pos_integer()) => [Product.t()]}
  def qualified_product_pages(taxon_ids, %DateTime{} = now, %{
        offset: offset,
        fetch_limit: fetch_limit
      })
      when is_list(taxon_ids) and is_integer(offset) and offset >= 0 and
             is_integer(fetch_limit) and fetch_limit >= 0,
      do:
        Categories.qualified_product_pages(taxon_ids, now, %{
          offset: offset,
          fetch_limit: fetch_limit
        })

  @spec sitemap_entries(:products | :merchants | :categories | :comparisons, keyword()) :: [map()]
  def sitemap_entries(kind, opts \\ []) do
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
    eligible_merchants = eligible_merchant_ids_query(now)

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
          ^@minimum_description_length
        )
    )
    |> group_by([taxon], [taxon.id, taxon.seo_slug, taxon.updated_at])
    |> having(
      [taxon, _closure, product],
      count(product.id, :distinct) >= ^@minimum_category_products
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
    |> Enum.filter(&snapshot_qualified?/1)
    |> Enum.map(fn snapshot ->
      {"/compare/shared/#{snapshot.public_token}", snapshot.inserted_at}
    end)
  end

  defp eligible_merchant_ids_query(now) do
    now
    |> Categories.eligible_offer_scope()
    |> select([offer], %{merchant_id: offer.merchant_id})
    |> distinct(true)
  end
end
