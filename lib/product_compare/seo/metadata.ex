defmodule ProductCompare.Seo.Metadata do
  @moduledoc false

  alias ProductCompare.Discussions
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Seo.QualificationPolicy
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Catalog.{ComparisonSnapshot, Product}
  alias ProductCompareSchemas.Pricing.Merchant

  @type metadata :: %{
          canonical_path: String.t(),
          description: String.t(),
          image_url: String.t() | nil,
          indexable: boolean(),
          structured_data: map() | nil,
          title: String.t()
        }

  @spec product(Product.t(), keyword()) :: metadata()
  def product(%Product{} = product, opts \\ []) do
    product_batch([product], opts)
    |> Map.fetch!(product)
  end

  @spec product_batch([Product.t()], keyword()) :: %{Product.t() => metadata()}
  def product_batch(products, opts \\ []) when is_list(products) do
    now = Keyword.get(opts, :now, DateTime.utc_now())
    products_by_id = products |> Repo.preload([:brand, :media]) |> Map.new(&{&1.id, &1})
    product_ids = Map.keys(products_by_id)
    attributes_by_product = Specs.list_current_attributes_for_products(product_ids)
    offer_truths_by_product = Pricing.current_offer_truths(product_ids, now: now)
    ratings_by_product = Discussions.review_summaries(product_ids)

    Map.new(products, fn original_product ->
      product = Map.fetch!(products_by_id, original_product.id)

      {original_product,
       product_from_evidence(
         product,
         Map.fetch!(attributes_by_product, product.id),
         Map.fetch!(offer_truths_by_product, product.id),
         Map.fetch!(ratings_by_product, product.id)
       )}
    end)
  end

  defp product_from_evidence(product, attributes, offer_truth, rating) do
    image_url = primary_image_url(product.media)

    indexable =
      length(attributes) >= QualificationPolicy.minimum_specification_count() and
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

  @spec merchant(Merchant.t(), keyword()) :: metadata()
  def merchant(%Merchant{} = merchant, opts \\ []) do
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

  @spec snapshot(ComparisonSnapshot.t()) :: metadata()
  def snapshot(%ComparisonSnapshot{} = snapshot) do
    products = field(snapshot.payload, :products) || []
    names = Enum.map(products, &field(&1, :name))

    indexable =
      snapshot.search_indexable == true and snapshot.search_qualified == true and
        snapshot_qualified?(snapshot)

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

  @spec snapshot_qualified?(ComparisonSnapshot.t() | map()) :: boolean()
  def snapshot_qualified?(%ComparisonSnapshot{payload: payload}), do: snapshot_qualified?(payload)

  def snapshot_qualified?(payload) when is_map(payload) do
    products = field(payload, :products) || []

    case products do
      [_first, _second] -> Enum.all?(products, &snapshot_product_quality?/1)
      [_first, _second, _third] -> Enum.all?(products, &snapshot_product_quality?/1)
      _other -> false
    end
  end

  def snapshot_qualified?(_payload), do: false

  @spec category(map()) :: metadata()
  def category(category) do
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

  defp snapshot_product_quality?(product),
    do: (field(product, :attributes) || []) != [] and (field(product, :offers) || []) != []

  defp adequate_product_copy?(description, image_url),
    do: QualificationPolicy.adequate_text?(description) or is_binary(image_url)

  defp primary_image_url(media) do
    media
    |> Enum.sort_by(&{if(&1.role == :primary, do: 0, else: 1), &1.position, &1.id})
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
