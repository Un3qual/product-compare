defmodule ProductCompare.Catalog.Search do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog.GTIN
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier

  @similarity_threshold 0.35
  @minimum_trigram_length 3
  @product_pattern_candidate_fields [:name, :slug, :model_number, :description]
  @product_trigram_candidate_fields [:name, :slug, :model_number]

  @spec apply_match(Ecto.Queryable.t(), String.t() | nil) :: Ecto.Query.t()
  def apply_match(query, value) when is_binary(value) and value != "" do
    terms = search_terms(value)
    candidate_ids = candidate_product_ids_for_terms(terms)

    query
    |> ensure_brand_join()
    |> where([product: product], product.id in subquery(candidate_ids))
    |> where(^match_expression(terms))
  end

  def apply_match(query, _value), do: query

  @spec order_by_relevance(Ecto.Queryable.t(), String.t()) :: Ecto.Query.t()
  def order_by_relevance(query, value) when is_binary(value) and value != "" do
    terms = search_terms(value)

    order_expressions = [
      asc: relevance_tier(terms),
      desc: full_text_rank(terms),
      desc: greatest_similarity(terms.normalized),
      asc: dynamic([product: product], fragment("lower(?)", product.name)),
      asc: dynamic([product: product], product.id)
    ]

    query
    |> ensure_brand_join()
    |> order_by(^order_expressions)
  end

  defp search_terms(value) do
    normalized = String.downcase(value)

    %{
      query: value,
      normalized: normalized,
      contains_pattern: "%#{escape_like_pattern(normalized)}%",
      prefix_pattern: "#{escape_like_pattern(normalized)}%",
      gtin: normalized_gtin(value),
      trigram?: String.length(value) >= @minimum_trigram_length
    }
  end

  defp candidate_product_ids_for_terms(terms) do
    pattern_candidates =
      Enum.map(@product_pattern_candidate_fields, fn field_name ->
        product_pattern_candidate(field_name, terms.contains_pattern)
      end)

    base_candidates =
      pattern_candidates ++
        [
          brand_pattern_candidate(terms.contains_pattern),
          full_text_candidate(terms.query)
        ]

    candidates =
      base_candidates
      |> maybe_add_validated_gtin_candidate(terms.gtin)
      |> maybe_add_trigram_candidates(terms)

    [first | rest] = candidates

    union_query =
      Enum.reduce(rest, first, fn candidate, union_query ->
        union_all(union_query, ^candidate)
      end)

    from candidate in subquery(union_query),
      distinct: true,
      select: candidate.product_id
  end

  defp product_pattern_candidate(field_name, pattern) do
    from product in Product,
      where: fragment("lower(?) LIKE ?", field(product, ^field_name), ^pattern),
      select: %{product_id: product.id}
  end

  defp brand_pattern_candidate(pattern) do
    from brand in Brand,
      join: product in Product,
      on: product.brand_id == brand.id,
      where: fragment("lower(?) LIKE ?", brand.name, ^pattern),
      select: %{product_id: product.id}
  end

  defp full_text_candidate(query) do
    Product
    |> from(as: :product)
    |> where(^full_text_expression(query))
    |> select([product: product], %{product_id: product.id})
  end

  defp maybe_add_validated_gtin_candidate(candidates, nil), do: candidates

  defp maybe_add_validated_gtin_candidate(candidates, normalized_gtin) do
    candidate =
      from identifier in ProductIdentifier,
        where: identifier.scheme == "gtin",
        where: identifier.verification_status == "validated",
        where: identifier.normalized_value == ^normalized_gtin,
        select: %{product_id: identifier.product_id}

    [candidate | candidates]
  end

  defp maybe_add_trigram_candidates(candidates, %{trigram?: false}), do: candidates

  defp maybe_add_trigram_candidates(candidates, %{trigram?: true, normalized: normalized}) do
    product_candidates =
      Enum.map(@product_trigram_candidate_fields, fn field_name ->
        product_trigram_candidate(field_name, normalized)
      end)

    [brand_trigram_candidate(normalized) | product_candidates] ++ candidates
  end

  defp product_trigram_candidate(field_name, normalized) do
    threshold = @similarity_threshold

    from product in Product,
      where:
        fragment(
          "show_trgm(lower(coalesce(?, ''))) && show_trgm(?)",
          field(product, ^field_name),
          ^normalized
        ),
      where:
        fragment(
          "similarity(lower(coalesce(?, '')), ?) >= ?",
          field(product, ^field_name),
          ^normalized,
          ^threshold
        ),
      select: %{product_id: product.id}
  end

  defp brand_trigram_candidate(normalized) do
    threshold = @similarity_threshold

    from brand in Brand,
      join: product in Product,
      on: product.brand_id == brand.id,
      where: fragment("show_trgm(lower(?)) && show_trgm(?)", brand.name, ^normalized),
      where: fragment("similarity(lower(?), ?) >= ?", brand.name, ^normalized, ^threshold),
      select: %{product_id: product.id}
  end

  defp normalized_gtin(value) do
    case GTIN.normalize(value) do
      {:ok, normalized} -> normalized
      {:error, :invalid_gtin} -> nil
    end
  end

  defp escape_like_pattern(value) do
    value
    |> String.replace("\\", "\\\\")
    |> String.replace("%", "\\%")
    |> String.replace("_", "\\_")
  end

  defp match_expression(terms) do
    gtin = validated_gtin_expression(terms.gtin)
    exact = exact_text_expression(terms.normalized)
    prefix = text_pattern_expression(terms.prefix_pattern)
    contains = text_pattern_expression(terms.contains_pattern)
    full_text = full_text_expression(terms.query)
    trigram = trigram_expression(terms)
    description = description_contains_expression(terms.contains_pattern)

    dynamic(
      [product: _product, brand: _brand],
      ^gtin or ^exact or ^prefix or ^contains or ^full_text or ^trigram or ^description
    )
  end

  defp validated_gtin_expression(nil), do: dynamic(false)

  defp validated_gtin_expression(normalized_gtin) do
    identifier_query =
      from identifier in ProductIdentifier,
        where: identifier.product_id == parent_as(:product).id,
        where: identifier.scheme == "gtin",
        where: identifier.verification_status == "validated",
        where: identifier.normalized_value == ^normalized_gtin

    dynamic([product: _product], exists(identifier_query))
  end

  defp exact_text_expression(normalized) do
    dynamic(
      [product: product, brand: brand],
      fragment("lower(?)", product.name) == ^normalized or
        fragment("lower(?)", product.slug) == ^normalized or
        fragment("lower(coalesce(?, ''))", product.model_number) == ^normalized or
        fragment("lower(coalesce(?, ''))", brand.name) == ^normalized
    )
  end

  defp text_pattern_expression(pattern) do
    dynamic(
      [product: product, brand: brand],
      ilike(product.name, ^pattern) or
        ilike(product.slug, ^pattern) or
        ilike(fragment("coalesce(?, '')", product.model_number), ^pattern) or
        ilike(fragment("coalesce(?, '')", brand.name), ^pattern)
    )
  end

  defp full_text_expression(query) do
    dynamic(
      [product: product],
      fragment(
        """
        coalesce(?.search_document, ''::tsvector) @@ (
          websearch_to_tsquery('simple', ?) ||
          websearch_to_tsquery('english', ?)
        )
        """,
        product,
        ^query,
        ^query
      )
    )
  end

  defp trigram_expression(%{trigram?: false}), do: dynamic(false)

  defp trigram_expression(%{trigram?: true, normalized: normalized}) do
    threshold = @similarity_threshold

    dynamic(
      [product: product, brand: brand],
      fragment(
        "similarity(lower(coalesce(?, '')), ?) >= ?",
        product.name,
        ^normalized,
        ^threshold
      ) or
        fragment(
          "similarity(lower(coalesce(?, '')), ?) >= ?",
          product.slug,
          ^normalized,
          ^threshold
        ) or
        fragment(
          "similarity(lower(coalesce(?, '')), ?) >= ?",
          product.model_number,
          ^normalized,
          ^threshold
        ) or
        fragment(
          "similarity(lower(coalesce(?, '')), ?) >= ?",
          brand.name,
          ^normalized,
          ^threshold
        )
    )
  end

  defp description_contains_expression(pattern) do
    dynamic(
      [product: product],
      ilike(fragment("coalesce(?, '')", product.description), ^pattern)
    )
  end

  defp relevance_tier(terms) do
    tier_one = tier_one_expression(terms)
    tier_two = tier_two_expression(terms.normalized)
    tier_three = text_pattern_expression(terms.prefix_pattern)
    tier_four = text_pattern_expression(terms.contains_pattern)
    tier_five = full_text_expression(terms.query)
    tier_six = trigram_expression(terms)
    tier_seven = description_contains_expression(terms.contains_pattern)

    dynamic(
      [product: _product, brand: _brand],
      fragment(
        """
        CASE
          WHEN ? THEN 1
          WHEN ? THEN 2
          WHEN ? THEN 3
          WHEN ? THEN 4
          WHEN ? THEN 5
          WHEN ? THEN 6
          WHEN ? THEN 7
          ELSE 8
        END
        """,
        ^tier_one,
        ^tier_two,
        ^tier_three,
        ^tier_four,
        ^tier_five,
        ^tier_six,
        ^tier_seven
      )
    )
  end

  defp tier_one_expression(terms) do
    gtin = validated_gtin_expression(terms.gtin)

    dynamic(
      [product: product],
      ^gtin or
        fragment("lower(coalesce(?, ''))", product.model_number) == ^terms.normalized
    )
  end

  defp tier_two_expression(normalized) do
    dynamic(
      [product: product],
      fragment("lower(?)", product.name) == ^normalized or
        fragment("lower(?)", product.slug) == ^normalized
    )
  end

  defp full_text_rank(terms) do
    tier_one = tier_one_expression(terms)
    tier_two = tier_two_expression(terms.normalized)
    tier_three = text_pattern_expression(terms.prefix_pattern)
    tier_four = text_pattern_expression(terms.contains_pattern)
    full_text = full_text_expression(terms.query)

    dynamic(
      [product: product, brand: _brand],
      fragment(
        """
        CASE
          WHEN ? AND NOT (?) AND NOT (?) AND NOT (?) AND NOT (?) THEN
            ts_rank_cd(
              coalesce(?.search_document, ''::tsvector),
              websearch_to_tsquery('simple', ?) ||
              websearch_to_tsquery('english', ?)
            )
          ELSE 0.0
        END
        """,
        ^full_text,
        ^tier_one,
        ^tier_two,
        ^tier_three,
        ^tier_four,
        product,
        ^terms.query,
        ^terms.query
      )
    )
  end

  defp greatest_similarity(normalized) do
    dynamic(
      [product: product, brand: brand],
      fragment(
        """
        greatest(
          similarity(lower(coalesce(?, '')), ?),
          similarity(lower(coalesce(?, '')), ?),
          similarity(lower(coalesce(?, '')), ?),
          similarity(lower(coalesce(?, '')), ?)
        )
        """,
        product.name,
        ^normalized,
        product.slug,
        ^normalized,
        product.model_number,
        ^normalized,
        brand.name,
        ^normalized
      )
    )
  end

  @doc """
  Ensures a catalog query has the shared named `:brand` binding.
  """
  @spec ensure_brand_join(Ecto.Queryable.t()) :: Ecto.Query.t()
  def ensure_brand_join(query) do
    if has_named_binding?(query, :brand) do
      query
    else
      join(query, :left, [product: product], brand in Brand,
        on: brand.id == product.brand_id,
        as: :brand
      )
    end
  end
end
