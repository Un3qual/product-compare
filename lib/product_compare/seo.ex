defmodule ProductCompare.Seo do
  @moduledoc """
  Owns public search qualification, metadata, and bounded sitemap reads.

  Search surfaces call this policy instead of independently guessing whether
  public catalog facts are complete and fresh enough to advertise.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.Seo.Metadata
  alias ProductCompareSchemas.Catalog.{ComparisonSnapshot, Product}
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonClosure}

  @minimum_description_length 80
  @minimum_specification_count 2
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

  def get_category(slug, opts) when is_binary(slug) do
    [slug]
    |> get_categories(opts)
    |> Map.fetch!(slug)
  end

  def get_category(_slug, _opts), do: nil

  @spec get_categories([String.t()], keyword()) :: %{String.t() => map() | nil}
  def get_categories(slugs, opts \\ []) when is_list(slugs) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    requested_slugs = slugs |> Enum.filter(&is_binary/1) |> Enum.uniq()

    query_slugs = Enum.reject(requested_slugs, &(String.trim(&1) == ""))

    taxons =
      if query_slugs == [] do
        []
      else
        Taxon
        |> where([taxon], taxon.seo_slug in ^query_slugs and taxon.seo_indexable == true)
        |> Repo.all()
      end

    counts = qualified_product_counts(Enum.map(taxons, & &1.id), now)

    categories_by_slug =
      Map.new(taxons, fn taxon ->
        qualified_product_count = Map.fetch!(counts, taxon.id)

        {taxon.seo_slug,
         %{
           id: taxon.id,
           entropy_id: taxon.entropy_id,
           name: taxon.name,
           slug: taxon.seo_slug,
           description: taxon.seo_description,
           qualified_product_count: qualified_product_count,
           indexable:
             adequate_text?(taxon.seo_description) and
               qualified_product_count >= @minimum_category_products,
           now: now
         }}
      end)

    Map.new(requested_slugs, &{&1, Map.get(categories_by_slug, &1)})
  end

  @spec category_metadata(map()) :: metadata()
  def category_metadata(category), do: Metadata.category(category)

  @spec qualified_products_for_taxon_query(pos_integer(), DateTime.t()) :: Ecto.Query.t()
  def qualified_products_for_taxon_query(taxon_id, %DateTime{} = now) do
    Product
    |> join(:inner, [product], closure in TaxonClosure,
      on: closure.descendant_id == product.primary_type_taxon_id
    )
    |> where([_product, closure], closure.ancestor_id == ^taxon_id)
    |> qualified_products_query(now)
    |> order_by([product], asc: product.name, asc: product.id)
  end

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
             is_integer(fetch_limit) and fetch_limit >= 0 do
    taxon_ids =
      taxon_ids
      |> Enum.filter(&(is_integer(&1) and &1 > 0))
      |> Enum.uniq()

    if taxon_ids == [] do
      %{}
    else
      qualifying_products = qualified_products_query(now)

      ranked_products =
        TaxonClosure
        |> join(:inner, [closure], product in subquery(qualifying_products),
          on: product.primary_type_taxon_id == closure.descendant_id
        )
        |> where([closure], closure.ancestor_id in ^taxon_ids)
        |> windows(
          [closure, product],
          category_product_page: [
            partition_by: closure.ancestor_id,
            order_by: [asc: product.name, asc: product.id]
          ]
        )
        |> select([closure, product], %{
          category_id: closure.ancestor_id,
          product_id: product.id,
          row_number: over(row_number(), :category_product_page)
        })

      products_by_category =
        Product
        |> join(:inner, [product], ranked in subquery(ranked_products),
          on: ranked.product_id == product.id
        )
        |> where(
          [_product, ranked],
          ranked.row_number > ^offset and ranked.row_number <= ^(offset + fetch_limit)
        )
        |> order_by([product, ranked],
          asc: ranked.category_id,
          asc: product.name,
          asc: product.id
        )
        |> select([product, ranked], {ranked.category_id, product})
        |> Repo.all()
        |> Enum.group_by(fn {category_id, _product} -> category_id end, fn {_category_id, product} ->
          product
        end)

      Map.new(taxon_ids, &{&1, Map.get(products_by_category, &1, [])})
    end
  end

  defp qualified_product_counts([], _now), do: %{}

  defp qualified_product_counts(taxon_ids, now) do
    qualifying_products = qualified_products_query(now)

    counts =
      TaxonClosure
      |> join(:inner, [closure], product in subquery(qualifying_products),
        on: product.primary_type_taxon_id == closure.descendant_id
      )
      |> where([closure], closure.ancestor_id in ^taxon_ids)
      |> group_by([closure], closure.ancestor_id)
      |> select([closure, product], {closure.ancestor_id, count(product.id, :distinct)})
      |> Repo.all()
      |> Map.new()

    Map.new(taxon_ids, &{&1, Map.get(counts, &1, 0)})
  end

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
    |> qualified_products_query()
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
    qualifying_products = qualified_products_query(now)

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

  defp qualified_products_query(%DateTime{} = now), do: qualified_products_query(Product, now)

  defp qualified_products_query(queryable, %DateTime{} = now) do
    eligible_products = eligible_product_ids_query(now)

    queryable
    |> join(:inner, [product], eligible in subquery(eligible_products),
      on: eligible.product_id == product.id
    )
    |> where(
      [product],
      fragment(
        "(SELECT count(*) FROM product_attribute_current pac WHERE pac.product_id = ?) >= ?",
        product.id,
        ^@minimum_specification_count
      )
    )
    |> where(
      [product],
      fragment(
        "char_length(trim(coalesce(?, ''))) >= ?",
        product.description,
        ^@minimum_description_length
      ) or
        fragment("EXISTS (SELECT 1 FROM product_media pm WHERE pm.product_id = ?)", product.id)
    )
  end

  defp eligible_product_ids_query(now) do
    now
    |> eligible_offer_scope()
    |> select([offer], %{product_id: offer.product_id})
    |> distinct(true)
  end

  defp eligible_merchant_ids_query(now) do
    now
    |> eligible_offer_scope()
    |> select([offer], %{merchant_id: offer.merchant_id})
    |> distinct(true)
  end

  defp eligible_offer_scope(now) do
    MerchantProduct
    |> join(:inner, [offer], price in subquery(latest_prices_query()),
      on: price.merchant_product_id == offer.id
    )
    |> where(
      [offer, price],
      offer.is_active == true and price.in_stock == true and not is_nil(price.shipping) and
        price.observed_at >= ^stale_boundary(now)
    )
  end

  defp latest_prices_query do
    from price in PricePoint,
      distinct: price.merchant_product_id,
      order_by: [asc: price.merchant_product_id, desc: price.observed_at, desc: price.id]
  end

  defp stale_boundary(now) do
    policy = ProductCompare.Pricing.OfferTruth.policy()
    DateTime.add(now, -policy.stale_after_seconds, :second)
  end

  defp adequate_text?(value) when is_binary(value),
    do: String.length(String.trim(value)) >= @minimum_description_length

  defp adequate_text?(_value), do: false
end
