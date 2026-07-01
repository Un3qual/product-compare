defmodule ProductCompare.Ingestion.CJCandidateCohort do
  @moduledoc """
  Safe read-only CJ candidate cohort read model.

  The summary uses merchant feed candidates as the source of truth and returns
  only aggregate review counts plus explicitly selected review-safe shortlisted
  candidate fields. It does not load raw metadata, credentials, tracking
  parameters, provider payloads, or any source artifact payloads.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @default_limit 10
  @min_limit 1
  @max_limit 50
  @fit_score_fragment """
  (CASE
    WHEN ? >= 10000 THEN 50
    WHEN ? >= 1000 THEN 35
    WHEN ? >= 100 THEN 20
    WHEN ? > 0 THEN 10
    ELSE 0
  END) +
  (CASE WHEN upper(coalesce(?, '')) = 'US' THEN 20 ELSE 0 END) +
  (CASE WHEN upper(coalesce(?, '')) = 'USD' THEN 15 ELSE 0 END) +
  (CASE WHEN upper(coalesce(?, '')) = 'EN' THEN 10 ELSE 0 END) +
  (CASE WHEN coalesce(?, '') != '' THEN 5 ELSE 0 END)
  """

  @type review_status_counts :: %{
          pending: non_neg_integer(),
          shortlisted: non_neg_integer(),
          dismissed: non_neg_integer(),
          total: non_neg_integer()
        }

  @type safe_candidate :: %{
          id: pos_integer(),
          provider: String.t(),
          provider_feed_id: String.t(),
          advertiser_id: String.t() | nil,
          advertiser_name: String.t() | nil,
          advertiser_country: String.t() | nil,
          source_feed_type: String.t() | nil,
          currency: String.t() | nil,
          language: String.t() | nil,
          feed_name: String.t() | nil,
          product_count: non_neg_integer() | nil,
          review_status: String.t(),
          review_note: String.t() | nil,
          reviewed_at: DateTime.t() | nil,
          provider_last_updated_at: DateTime.t() | nil,
          last_seen_at: DateTime.t(),
          inserted_at: DateTime.t(),
          updated_at: DateTime.t(),
          fit_score: non_neg_integer()
        }

  @type summary :: %{
          review_status_counts: review_status_counts(),
          top_shortlisted_candidates: [safe_candidate()],
          limit: pos_integer()
        }

  @spec summary(keyword()) :: summary()
  def summary(opts \\ []) when is_list(opts) do
    limit = limit(opts)

    %{
      review_status_counts: review_status_counts(),
      top_shortlisted_candidates: top_shortlisted_candidates(limit),
      limit: limit
    }
  end

  defp review_status_counts do
    base_counts = %{pending: 0, shortlisted: 0, dismissed: 0}

    counts =
      MerchantFeedCandidate
      |> where([candidate], candidate.provider == @provider)
      |> group_by([candidate], candidate.review_status)
      |> select([candidate], {candidate.review_status, count(candidate.id)})
      |> Repo.all()
      |> Enum.reduce(base_counts, fn
        {"pending", count}, counts -> %{counts | pending: count}
        {"shortlisted", count}, counts -> %{counts | shortlisted: count}
        {"dismissed", count}, counts -> %{counts | dismissed: count}
        {_unknown, _count}, counts -> counts
      end)

    Map.put(counts, :total, counts.pending + counts.shortlisted + counts.dismissed)
  end

  defp top_shortlisted_candidates(limit) do
    MerchantFeedCandidate
    |> where(
      [candidate],
      candidate.provider == @provider and candidate.review_status == "shortlisted"
    )
    |> order_by([candidate],
      desc:
        fragment(
          @fit_score_fragment,
          candidate.product_count,
          candidate.product_count,
          candidate.product_count,
          candidate.product_count,
          candidate.advertiser_country,
          candidate.currency,
          candidate.language,
          candidate.source_feed_type
        ),
      desc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.provider_feed_id,
      asc: candidate.id
    )
    |> limit(^limit)
    |> select([candidate], %{
      id: candidate.id,
      provider: candidate.provider,
      provider_feed_id: candidate.provider_feed_id,
      advertiser_id: candidate.advertiser_id,
      advertiser_name: candidate.advertiser_name,
      advertiser_country: candidate.advertiser_country,
      source_feed_type: candidate.source_feed_type,
      currency: candidate.currency,
      language: candidate.language,
      feed_name: candidate.feed_name,
      product_count: candidate.product_count,
      review_status: candidate.review_status,
      review_note: candidate.review_note,
      reviewed_at: candidate.reviewed_at,
      provider_last_updated_at: candidate.provider_last_updated_at,
      last_seen_at: candidate.last_seen_at,
      inserted_at: candidate.inserted_at,
      updated_at: candidate.updated_at,
      fit_score:
        fragment(
          @fit_score_fragment,
          candidate.product_count,
          candidate.product_count,
          candidate.product_count,
          candidate.product_count,
          candidate.advertiser_country,
          candidate.currency,
          candidate.language,
          candidate.source_feed_type
        )
    })
    |> Repo.all()
  end

  defp limit(opts) do
    opts
    |> Keyword.get(:limit, @default_limit)
    |> normalize_limit()
    |> max(@min_limit)
    |> min(@max_limit)
  end

  defp normalize_limit(value) when is_integer(value), do: value

  defp normalize_limit(value) when is_binary(value) do
    case Integer.parse(value) do
      {limit, ""} -> limit
      _invalid -> @default_limit
    end
  end

  defp normalize_limit(_value), do: @default_limit
end
