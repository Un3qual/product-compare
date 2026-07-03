defmodule ProductCompare.Ingestion.CJApplicationReadiness do
  @moduledoc """
  Safe read-only application readiness aggregate for shortlisted CJ candidates.

  The summary classifies shortlisted CJ feed candidates into ready and blocked
  groups using safe persisted metadata only. It does not submit applications,
  contact merchants, create links, write files, or expose raw provider metadata.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompare.Ingestion.OptionNormalization
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @default_limit 25
  @min_limit 1
  @max_limit 100

  @type reason_code ::
          :missing_advertiser
          | :missing_feed_id
          | :missing_product_count
          | :non_us_market
          | :non_usd_currency
          | :non_english_language

  @type safe_candidate :: %{
          id: pos_integer(),
          provider_feed_id: String.t(),
          advertiser_id: String.t() | nil,
          advertiser_name: String.t() | nil,
          advertiser_country: String.t() | nil,
          currency: String.t() | nil,
          language: String.t() | nil,
          feed_name: String.t() | nil,
          product_count: non_neg_integer() | nil,
          review_status: String.t(),
          reason_codes: [reason_code()]
        }

  @type summary :: %{
          provider: String.t(),
          limit: pos_integer(),
          shortlisted_candidate_count: non_neg_integer(),
          ready_candidate_count: non_neg_integer(),
          blocked_candidate_count: non_neg_integer(),
          ready_candidates: [safe_candidate()],
          blocked_candidates: [safe_candidate()]
        }

  @spec summary(keyword() | map() | term()) :: summary()
  def summary(opts \\ []) do
    limit = limit(opts)
    shortlisted_query = shortlisted_candidate_query()
    ready_query = ready_candidate_query(shortlisted_query)
    blocked_query = blocked_candidate_query(shortlisted_query)

    %{
      provider: @provider,
      limit: limit,
      shortlisted_candidate_count: count_candidates(shortlisted_query),
      ready_candidate_count: count_candidates(ready_query),
      blocked_candidate_count: count_candidates(blocked_query),
      ready_candidates: ready_query |> limited_candidates(limit) |> Enum.map(&candidate_map/1),
      blocked_candidates: blocked_query |> limited_candidates(limit) |> Enum.map(&candidate_map/1)
    }
  end

  defp shortlisted_candidate_query do
    MerchantFeedCandidate
    |> where(
      [candidate],
      candidate.provider == @provider and candidate.review_status == "shortlisted"
    )
  end

  defp ready_candidate_query(query), do: where(query, ^ready_condition())

  defp blocked_candidate_query(query), do: where(query, ^blocked_condition())

  defp ready_condition do
    dynamic(
      [candidate],
      not is_nil(fragment("NULLIF(BTRIM(?), '')", candidate.advertiser_name)) and
        not is_nil(fragment("NULLIF(BTRIM(?), '')", candidate.advertiser_id)) and
        not is_nil(fragment("NULLIF(BTRIM(?), '')", candidate.provider_feed_id)) and
        candidate.product_count > 0 and
        fragment("UPPER(BTRIM(?))", candidate.advertiser_country) == "US" and
        fragment("UPPER(BTRIM(?))", candidate.currency) == "USD" and
        fragment("UPPER(BTRIM(?))", candidate.language) == "EN"
    )
  end

  defp blocked_condition do
    dynamic(
      [candidate],
      is_nil(fragment("NULLIF(BTRIM(?), '')", candidate.advertiser_name)) or
        is_nil(fragment("NULLIF(BTRIM(?), '')", candidate.advertiser_id)) or
        is_nil(fragment("NULLIF(BTRIM(?), '')", candidate.provider_feed_id)) or
        is_nil(candidate.product_count) or
        candidate.product_count <= 0 or
        is_nil(fragment("UPPER(BTRIM(?))", candidate.advertiser_country)) or
        fragment("UPPER(BTRIM(?))", candidate.advertiser_country) != "US" or
        is_nil(fragment("UPPER(BTRIM(?))", candidate.currency)) or
        fragment("UPPER(BTRIM(?))", candidate.currency) != "USD" or
        is_nil(fragment("UPPER(BTRIM(?))", candidate.language)) or
        fragment("UPPER(BTRIM(?))", candidate.language) != "EN"
    )
  end

  defp count_candidates(query), do: Repo.aggregate(query, :count, :id)

  defp limited_candidates(query, limit) do
    query
    |> order_by([candidate],
      desc_nulls_last: candidate.product_count,
      asc: candidate.advertiser_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
    |> select([candidate], %{
      id: candidate.id,
      provider_feed_id: candidate.provider_feed_id,
      advertiser_id: candidate.advertiser_id,
      advertiser_name: candidate.advertiser_name,
      advertiser_country: candidate.advertiser_country,
      currency: candidate.currency,
      language: candidate.language,
      feed_name: candidate.feed_name,
      product_count: candidate.product_count,
      review_status: candidate.review_status
    })
    |> limit(^limit)
    |> Repo.all()
  end

  defp candidate_map(candidate), do: Map.put(candidate, :reason_codes, reason_codes(candidate))

  defp reason_codes(candidate) do
    [
      missing_advertiser_reason(candidate),
      missing_feed_id_reason(candidate),
      missing_product_count_reason(candidate),
      non_us_market_reason(candidate),
      non_usd_currency_reason(candidate),
      non_english_language_reason(candidate)
    ]
    |> Enum.reject(&is_nil/1)
  end

  defp missing_advertiser_reason(candidate) do
    if blank?(candidate.advertiser_name) or blank?(candidate.advertiser_id),
      do: :missing_advertiser
  end

  defp missing_feed_id_reason(candidate) do
    if blank?(candidate.provider_feed_id), do: :missing_feed_id
  end

  defp missing_product_count_reason(candidate) do
    if not (is_integer(candidate.product_count) and candidate.product_count > 0),
      do: :missing_product_count
  end

  defp non_us_market_reason(candidate) do
    if normalize_code(candidate.advertiser_country) != "US", do: :non_us_market
  end

  defp non_usd_currency_reason(candidate) do
    if normalize_code(candidate.currency) != "USD", do: :non_usd_currency
  end

  defp non_english_language_reason(candidate) do
    if normalize_code(candidate.language) != "EN", do: :non_english_language
  end

  defp limit(opts) do
    OptionNormalization.bounded_integer(
      OptionNormalization.option(opts, :limit, @default_limit),
      default: @default_limit,
      min: @min_limit,
      max: @max_limit
    )
  end

  defp normalize_code(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.upcase()
  end

  defp normalize_code(_value), do: nil

  defp blank?(value) when is_binary(value), do: String.trim(value) == ""
  defp blank?(nil), do: true
  defp blank?(_value), do: false
end
