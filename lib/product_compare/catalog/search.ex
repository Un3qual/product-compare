defmodule ProductCompare.Catalog.Search do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog.GTIN
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier

  @similarity_threshold 0.35
  @minimum_trigram_length 3
  @structured_query_pattern ~r/(?:^|\s)(?:OR(?:\s|$)|-\S)/u
  @product_pattern_candidate_fields [:name, :slug, :model_number, :description]
  @product_trigram_candidate_fields [:name, :slug, :model_number]

  @spec apply_match(Ecto.Queryable.t(), String.t() | nil) :: Ecto.Query.t()
  def apply_match(query, value) when is_binary(value) and value != "" do
    terms = search_terms(value)

    query
    |> ensure_brand_join()
    |> maybe_bound_candidates(terms)
    |> where(^match_expression(terms))
  end

  def apply_match(query, _value), do: query

  @spec order_by_relevance(Ecto.Queryable.t(), String.t()) :: Ecto.Query.t()
  def order_by_relevance(query, value) when is_binary(value) and value != "" do
    terms = search_terms(value)

    order_expressions = [
      asc: relevance_tier(terms),
      desc: full_text_rank(terms),
      desc: greatest_similarity(terms),
      asc: dynamic([product: product], fragment("lower(?)", product.name)),
      asc: dynamic([product: product], product.id)
    ]

    query
    |> ensure_brand_join()
    |> order_by(^order_expressions)
  end

  defp search_terms(value) do
    structured? = structured_query?(value)

    %{
      query: value,
      contains_pattern: "%#{escape_like_pattern(value)}%",
      prefix_pattern: "#{escape_like_pattern(value)}%",
      gtin: normalized_gtin(value),
      structured?: structured?,
      trigram?: not structured? and String.length(value) >= @minimum_trigram_length
    }
  end

  defp structured_query?(value) do
    String.contains?(value, "\"") or Regex.match?(@structured_query_pattern, value)
  end

  defp maybe_bound_candidates(query, %{structured?: true}), do: query
  defp maybe_bound_candidates(query, %{trigram?: false}), do: query

  defp maybe_bound_candidates(query, terms) do
    candidate_ids = candidate_product_ids_for_terms(terms)
    where(query, [product: product], product.id in subquery(candidate_ids))
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
      where: fragment("lower(?) LIKE lower(?)", field(product, ^field_name), ^pattern),
      select: %{product_id: product.id}
  end

  defp brand_pattern_candidate(pattern) do
    from brand in Brand,
      join: product in Product,
      on: product.brand_id == brand.id,
      where: fragment("lower(?) LIKE lower(?)", brand.name, ^pattern),
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
        where: identifier.scheme == :gtin,
        where: identifier.verification_status == :validated,
        where: identifier.normalized_value == ^normalized_gtin,
        select: %{product_id: identifier.product_id}

    [candidate | candidates]
  end

  defp maybe_add_trigram_candidates(candidates, %{trigram?: true, query: query}) do
    product_candidates =
      Enum.map(@product_trigram_candidate_fields, fn field_name ->
        product_trigram_candidate(field_name, query)
      end)

    [brand_trigram_candidate(query) | product_candidates] ++ candidates
  end

  defp product_trigram_candidate(field_name, query) do
    threshold = @similarity_threshold

    from product in Product,
      where:
        fragment(
          "show_trgm(lower(coalesce(?, ''))) && show_trgm(lower(?))",
          field(product, ^field_name),
          ^query
        ),
      where:
        fragment(
          "similarity(lower(coalesce(?, '')), lower(?)) >= ?",
          field(product, ^field_name),
          ^query,
          ^threshold
        ),
      select: %{product_id: product.id}
  end

  defp brand_trigram_candidate(query) do
    threshold = @similarity_threshold

    from brand in Brand,
      join: product in Product,
      on: product.brand_id == brand.id,
      where: fragment("show_trgm(lower(?)) && show_trgm(lower(?))", brand.name, ^query),
      where: fragment("similarity(lower(?), lower(?)) >= ?", brand.name, ^query, ^threshold),
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

  defp match_expression(%{structured?: true, query: query}) do
    full_text_expression(query)
  end

  defp match_expression(terms) do
    gtin = validated_gtin_expression(terms.gtin)
    exact = exact_text_expression(terms.query)
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
        where: identifier.scheme == :gtin,
        where: identifier.verification_status == :validated,
        where: identifier.normalized_value == ^normalized_gtin

    dynamic([product: _product], exists(identifier_query))
  end

  defp exact_text_expression(query) do
    dynamic(
      [product: product, brand: brand],
      fragment("lower(?) = lower(?)", product.name, ^query) or
        fragment("lower(?) = lower(?)", product.slug, ^query) or
        fragment("lower(coalesce(?, '')) = lower(?)", product.model_number, ^query) or
        fragment("lower(coalesce(?, '')) = lower(?)", brand.name, ^query)
    )
  end

  defp text_pattern_expression(pattern) do
    dynamic(
      [product: product, brand: brand],
      ilike(product.name, ^pattern) or
        ilike(product.slug, ^pattern) or
        ilike(coalesce(product.model_number, ""), ^pattern) or
        ilike(coalesce(brand.name, ""), ^pattern)
    )
  end

  defp full_text_expression(query) do
    dynamic(
      [product: product],
      fragment(
        """
        ?.search_document @@ (
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

  defp trigram_expression(%{trigram?: true, query: query}) do
    threshold = @similarity_threshold

    dynamic(
      [product: product, brand: brand],
      fragment(
        "similarity(lower(coalesce(?, '')), lower(?)) >= ?",
        product.name,
        ^query,
        ^threshold
      ) or
        fragment(
          "similarity(lower(coalesce(?, '')), lower(?)) >= ?",
          product.slug,
          ^query,
          ^threshold
        ) or
        fragment(
          "similarity(lower(coalesce(?, '')), lower(?)) >= ?",
          product.model_number,
          ^query,
          ^threshold
        ) or
        fragment(
          "similarity(lower(coalesce(?, '')), lower(?)) >= ?",
          brand.name,
          ^query,
          ^threshold
        )
    )
  end

  defp description_contains_expression(pattern) do
    dynamic(
      [product: product],
      ilike(coalesce(product.description, ""), ^pattern)
    )
  end

  defp relevance_tier(%{structured?: true, query: query}) do
    full_text = full_text_expression(query)

    dynamic(
      [product: _product],
      fragment("CASE WHEN ? THEN 5 ELSE 8 END", ^full_text)
    )
  end

  defp relevance_tier(terms) do
    tier_one = tier_one_expression(terms)
    tier_two = tier_two_expression(terms.query)
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
        fragment(
          "lower(coalesce(?, '')) = lower(?)",
          product.model_number,
          ^terms.query
        )
    )
  end

  defp tier_two_expression(query) do
    dynamic(
      [product: product],
      fragment("lower(?) = lower(?)", product.name, ^query) or
        fragment("lower(?) = lower(?)", product.slug, ^query)
    )
  end

  defp full_text_rank(%{structured?: true, query: query}) do
    full_text_rank_expression(query, full_text_expression(query))
  end

  defp full_text_rank(terms) do
    tier_one = tier_one_expression(terms)
    tier_two = tier_two_expression(terms.query)
    tier_three = text_pattern_expression(terms.prefix_pattern)
    tier_four = text_pattern_expression(terms.contains_pattern)
    full_text = full_text_expression(terms.query)

    eligible =
      dynamic(
        [product: _product, brand: _brand],
        ^full_text and not (^tier_one) and not (^tier_two) and not (^tier_three) and
          not (^tier_four)
      )

    full_text_rank_expression(terms.query, eligible)
  end

  defp full_text_rank_expression(query, eligible) do
    dynamic(
      [product: product],
      fragment(
        """
        CASE
          WHEN ? THEN
            ts_rank_cd(
              ?.search_document,
              websearch_to_tsquery('simple', ?) ||
              websearch_to_tsquery('english', ?)
            )
          ELSE 0.0
        END
        """,
        ^eligible,
        product,
        ^query,
        ^query
      )
    )
  end

  defp greatest_similarity(%{structured?: true}) do
    dynamic(fragment("CAST(0 AS real)"))
  end

  defp greatest_similarity(%{query: query}) do
    dynamic(
      [product: product, brand: brand],
      fragment(
        """
        greatest(
          similarity(lower(coalesce(?, '')), lower(?)),
          similarity(lower(coalesce(?, '')), lower(?)),
          similarity(lower(coalesce(?, '')), lower(?)),
          similarity(lower(coalesce(?, '')), lower(?))
        )
        """,
        product.name,
        ^query,
        product.slug,
        ^query,
        product.model_number,
        ^query,
        brand.name,
        ^query
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
