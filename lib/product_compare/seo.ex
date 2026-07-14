defmodule ProductCompare.Seo do
  @moduledoc """
  Owns public search qualification, metadata, and bounded sitemap reads.

  Search surfaces call this policy instead of independently guessing whether
  public catalog facts are complete and fresh enough to advertise.
  """

  import Ecto.Query

  alias ProductCompare.Discussions
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.{ComparisonSnapshot, Product}
  alias ProductCompareSchemas.Pricing.{Merchant, MerchantProduct, PricePoint}
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonClosure}

  @minimum_description_length 80
  @minimum_specification_count 2
  @minimum_category_products 3
  @maximum_sitemap_entries 10_000
  @comparison_sitemap_batch_size 200

  @type metadata :: %{
          canonical_path: String.t(),
          description: String.t(),
          image_url: String.t() | nil,
          indexable: boolean(),
          structured_data: map() | nil,
          title: String.t()
        }

  @spec product_metadata(Product.t(), keyword()) :: metadata()
  def product_metadata(%Product{} = product, opts \\ []) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    product = Repo.preload(product, [:brand, :media])
    attributes = Specs.list_current_attributes_for_product(product.id)
    offer_truth = Pricing.current_offer_truth(product.id, now: now)
    rating = Discussions.review_summary(product.id)
    image_url = primary_image_url(product.media)

    indexable =
      length(attributes) >= @minimum_specification_count and
        adequate_product_copy?(product.description, image_url) and
        offer_truth.eligible_offer_count > 0

    description =
      concise_description(
        product.description,
        "Compare accepted specifications and current offer evidence for #{product.name}."
      )

    metadata(
      "#{product.name} specifications and prices | Product Compare",
      description,
      "/products/#{product.slug}",
      image_url,
      indexable,
      if(indexable,
        do: product_structured_data(product, image_url, offer_truth, rating),
        else: nil
      )
    )
  end

  @spec merchant_metadata(Merchant.t(), keyword()) :: metadata()
  def merchant_metadata(%Merchant{} = merchant, opts \\ []) do
    detail = Keyword.get_lazy(opts, :detail, fn -> Pricing.merchant_detail(merchant, opts) end)
    summary = detail && detail.summary
    indexable = not is_nil(summary) and summary.eligible_offer_count > 0

    description =
      "Review #{merchant.name} product coverage, current offer evidence, landed-price completeness, and freshness on Product Compare."

    metadata(
      "#{merchant.name} offers and freshness | Product Compare",
      description,
      "/merchants/#{merchant.slug}",
      nil,
      indexable,
      if(indexable,
        do: %{
          "@context" => "https://schema.org",
          "@type" => "Organization",
          "name" => merchant.name,
          "url" => "/merchants/#{merchant.slug}"
        },
        else: nil
      )
    )
  end

  @spec snapshot_metadata(ComparisonSnapshot.t()) :: metadata()
  def snapshot_metadata(%ComparisonSnapshot{} = snapshot) do
    products = field(snapshot.payload, :products) || []
    names = Enum.map(products, &field(&1, :name))
    indexable = snapshot.search_indexable == true and snapshot_quality?(snapshot)
    title = snapshot.title || Enum.join(names, " vs ")

    description =
      "Compare captured specifications, offer evidence, and recommendation inputs for #{Enum.join(names, ", ")}."

    metadata(
      "#{title} | Product Compare",
      concise_description(description, "Review this captured product comparison."),
      "/compare/shared/#{snapshot.public_token}",
      nil,
      indexable,
      if(indexable,
        do: %{
          "@context" => "https://schema.org",
          "@type" => "ItemList",
          "name" => title,
          "itemListElement" =>
            products
            |> Enum.with_index(1)
            |> Enum.map(fn {product, position} ->
              %{
                "@type" => "ListItem",
                "position" => position,
                "item" => %{
                  "@type" => "Product",
                  "name" => field(product, :name),
                  "url" => "/products/#{field(product, :slug)}"
                }
              }
            end)
        },
        else: nil
      )
    )
  end

  @spec get_category(String.t(), keyword()) :: map() | nil
  def get_category(slug, opts \\ [])

  def get_category(slug, opts) when is_binary(slug) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    with %Taxon{} = taxon <- Taxonomy.get_taxon_by_seo_slug(slug),
         true <- taxon.seo_indexable == true do
      qualified_product_count =
        taxon.id
        |> qualified_products_for_taxon_query(now)
        |> Repo.aggregate(:count, :id)

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
      }
    else
      _ -> nil
    end
  end

  def get_category(_slug, _opts), do: nil

  @spec category_metadata(map()) :: metadata()
  def category_metadata(category) do
    metadata(
      "Compare #{category.name} specifications and prices | Product Compare",
      category.description,
      "/categories/#{category.slug}",
      nil,
      category.indexable,
      if(category.indexable,
        do: %{
          "@context" => "https://schema.org",
          "@type" => "CollectionPage",
          "name" => "Compare #{category.name}",
          "description" => category.description,
          "url" => "/categories/#{category.slug}"
        },
        else: nil
      )
    )
  end

  defp metadata(title, description, canonical_path, image_url, indexable, structured_data) do
    %{
      title: title,
      description: description,
      canonical_path: canonical_path,
      image_url: image_url,
      indexable: indexable,
      structured_data: structured_data
    }
  end

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
    limit
    |> comparison_sitemap_snapshots(nil, [])
    |> Enum.map(fn snapshot ->
      {"/compare/shared/#{snapshot.public_token}", snapshot.inserted_at}
    end)
  end

  defp comparison_sitemap_snapshots(0, _after_id, snapshots), do: Enum.reverse(snapshots)

  defp comparison_sitemap_snapshots(remaining, after_id, snapshots) do
    batch =
      ComparisonSnapshot
      |> where(
        [snapshot],
        snapshot.search_indexable == true and is_nil(snapshot.revoked_at)
      )
      |> maybe_after_snapshot(after_id)
      |> order_by([snapshot], asc: snapshot.id)
      |> limit(^@comparison_sitemap_batch_size)
      |> Repo.all()

    qualified = batch |> Enum.filter(&snapshot_quality?/1) |> Enum.take(remaining)
    snapshots = Enum.reduce(qualified, snapshots, fn snapshot, acc -> [snapshot | acc] end)

    cond do
      length(qualified) == remaining or batch == [] ->
        Enum.reverse(snapshots)

      true ->
        comparison_sitemap_snapshots(
          remaining - length(qualified),
          List.last(batch).id,
          snapshots
        )
    end
  end

  defp maybe_after_snapshot(query, nil), do: query
  defp maybe_after_snapshot(query, id), do: where(query, [snapshot], snapshot.id > ^id)

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

  defp snapshot_quality?(snapshot) do
    products = field(snapshot.payload, :products) || []

    case products do
      [_first, _second] -> Enum.all?(products, &snapshot_product_quality?/1)
      [_first, _second, _third] -> Enum.all?(products, &snapshot_product_quality?/1)
      _other -> false
    end
  end

  defp snapshot_product_quality?(product),
    do: (field(product, :attributes) || []) != [] and (field(product, :offers) || []) != []

  defp adequate_product_copy?(description, image_url),
    do: adequate_text?(description) or is_binary(image_url)

  defp adequate_text?(value) when is_binary(value),
    do: String.length(String.trim(value)) >= @minimum_description_length

  defp adequate_text?(_value), do: false

  defp primary_image_url(media) do
    media
    |> Enum.sort_by(&{if(&1.role == "primary", do: 0, else: 1), &1.position, &1.id})
    |> List.first()
    |> case do
      nil -> nil
      item -> item.url
    end
  end

  defp product_structured_data(product, image_url, offer_truth, rating) do
    %{
      "@context" => "https://schema.org",
      "@type" => "Product",
      "name" => product.name,
      "description" => product.description,
      "url" => "/products/#{product.slug}"
    }
    |> put_if("brand", product.brand && %{"@type" => "Brand", "name" => product.brand.name})
    |> put_if("model", product.model_number)
    |> put_if("image", image_url)
    |> put_if("offers", aggregate_offer(offer_truth))
    |> put_if("aggregateRating", aggregate_rating(rating))
  end

  defp aggregate_offer(%{currency_summaries: [summary]}) do
    best = summary.best_offer

    if best && summary.eligible_offer_count > 0 do
      %{
        "@type" => "AggregateOffer",
        "availability" => "https://schema.org/InStock",
        "lowPrice" => Decimal.to_string(best.landed_price, :normal),
        "offerCount" => summary.eligible_offer_count,
        "priceCurrency" => summary.currency
      }
    end
  end

  defp aggregate_offer(_offer_truth), do: nil

  defp aggregate_rating(%{count: count, average_rating: average})
       when is_integer(count) and count > 0 and not is_nil(average) do
    %{
      "@type" => "AggregateRating",
      "ratingValue" => Decimal.to_string(average, :normal),
      "reviewCount" => count
    }
  end

  defp aggregate_rating(_rating), do: nil

  defp put_if(map, _key, nil), do: map
  defp put_if(map, key, value), do: Map.put(map, key, value)

  defp field(map, key) when is_map(map), do: Map.get(map, key, Map.get(map, Atom.to_string(key)))

  defp concise_description(value, fallback) do
    value = if is_binary(value), do: String.trim(value), else: ""
    value = if value == "", do: fallback, else: value

    if String.length(value) > 160,
      do: String.slice(value, 0, 157) <> "...",
      else: value
  end
end
