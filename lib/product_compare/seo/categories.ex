defmodule ProductCompare.Seo.Categories do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.{Input, Repo}
  alias ProductCompare.Seo.QualificationPolicy
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.{MerchantProduct, PricePoint}
  alias ProductCompareSchemas.Taxonomy.{Taxon, TaxonClosure}

  @spec get(String.t(), keyword()) :: map() | nil
  def get(slug, opts \\ [])

  def get(slug, opts) when is_binary(slug) do
    [slug]
    |> get_many(opts)
    |> Map.fetch!(slug)
  end

  def get(_slug, _opts), do: nil

  @spec get_many([String.t()], keyword()) :: %{String.t() => map() | nil}
  def get_many(slugs, opts \\ []) when is_list(slugs) do
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

        {taxon.seo_slug, category_summary(taxon, qualified_product_count, now)}
      end)

    Map.new(requested_slugs, &{&1, Map.get(categories_by_slug, &1)})
  end

  @spec home_shortcuts(keyword()) :: [map()]
  def home_shortcuts(opts) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    offset = opts |> Keyword.get(:offset, 0) |> Input.clamp_non_negative(0)
    limit = required_positive_limit(opts)
    qualifying_products = homepage_qualified_products_query(now)
    minimum_description_length = QualificationPolicy.minimum_description_length()
    minimum_products = QualificationPolicy.minimum_category_products()

    Taxon
    |> join(:inner, [taxon], closure in TaxonClosure, on: closure.ancestor_id == taxon.id)
    |> join(:inner, [_taxon, closure], product in subquery(qualifying_products),
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
    |> group_by([taxon], taxon.id)
    |> having([_taxon, _closure, product], count(product.id, :distinct) >= ^minimum_products)
    |> order_by([taxon, _closure, product],
      desc: count(product.id, :distinct),
      asc: fragment("lower(coalesce(?, ''))", taxon.name),
      asc: taxon.id
    )
    |> offset(^offset)
    |> limit(^limit)
    |> select([taxon, _closure, product], {taxon, count(product.id, :distinct)})
    |> Repo.all()
    |> Enum.map(fn {taxon, qualified_product_count} ->
      category_summary(taxon, qualified_product_count, now)
    end)
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

  @spec qualified_product_pages(
          [pos_integer()],
          DateTime.t(),
          non_neg_integer(),
          non_neg_integer()
        ) :: %{optional(pos_integer()) => [Product.t()]}
  def qualified_product_pages(taxon_ids, %DateTime{} = now, offset, fetch_limit) do
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

  @doc false
  @spec qualified_products_query(DateTime.t()) :: Ecto.Query.t()
  def qualified_products_query(%DateTime{} = now), do: qualified_products_query(Product, now)

  @doc false
  @spec eligible_offer_scope(DateTime.t()) :: Ecto.Query.t()
  def eligible_offer_scope(%DateTime{} = now) do
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

  defp homepage_qualified_products_query(now) do
    homepage_eligible_products =
      now
      |> homepage_eligible_offer_scope()
      |> select([offer], %{product_id: offer.product_id})
      |> distinct(true)

    now
    |> qualified_products_query()
    |> join(:inner, [product], eligible in subquery(homepage_eligible_products),
      on: eligible.product_id == product.id
    )
  end

  defp homepage_eligible_offer_scope(now) do
    now
    |> eligible_offer_scope()
    |> where([offer], offer.currency == ^"USD")
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

  defp qualified_products_query(queryable, %DateTime{} = now) do
    minimum_description_length = QualificationPolicy.minimum_description_length()
    minimum_specification_count = QualificationPolicy.minimum_specification_count()

    eligible_products =
      now
      |> eligible_offer_scope()
      |> select([offer], %{product_id: offer.product_id})
      |> distinct(true)

    queryable
    |> join(:inner, [product], eligible in subquery(eligible_products),
      on: eligible.product_id == product.id
    )
    |> where(
      [product],
      fragment(
        "(SELECT count(*) FROM product_attribute_current pac WHERE pac.product_id = ?) >= ?",
        product.id,
        ^minimum_specification_count
      )
    )
    |> where(
      [product],
      fragment(
        "char_length(trim(coalesce(?, ''))) >= ?",
        product.description,
        ^minimum_description_length
      ) or
        fragment("EXISTS (SELECT 1 FROM product_media pm WHERE pm.product_id = ?)", product.id)
    )
  end

  defp latest_prices_query do
    from price in PricePoint,
      distinct: price.merchant_product_id,
      order_by: [asc: price.merchant_product_id, desc: price.observed_at, desc: price.id]
  end

  defp category_summary(taxon, qualified_product_count, now) do
    %{
      id: taxon.id,
      entropy_id: taxon.entropy_id,
      name: taxon.name,
      slug: taxon.seo_slug,
      description: taxon.seo_description,
      qualified_product_count: qualified_product_count,
      indexable:
        QualificationPolicy.adequate_text?(taxon.seo_description) and
          qualified_product_count >= QualificationPolicy.minimum_category_products(),
      now: now
    }
  end

  defp required_positive_limit(opts) do
    case Keyword.fetch(opts, :limit) do
      {:ok, limit} when is_integer(limit) and limit > 0 -> limit
      _missing_or_invalid -> raise ArgumentError, "home category limit must be a positive integer"
    end
  end

  defp stale_boundary(now) do
    policy = ProductCompare.Pricing.OfferTruth.policy()
    DateTime.add(now, -policy.stale_after_seconds, :second)
  end
end
