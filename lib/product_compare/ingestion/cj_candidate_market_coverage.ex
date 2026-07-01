defmodule ProductCompare.Ingestion.CJCandidateMarketCoverage do
  @moduledoc """
  Safe read-only CJ candidate market coverage aggregate.

  The summary exposes only counts by normalized market dimensions. It does not
  load raw candidate metadata, provider payloads, credentials, account IDs, or
  tracking parameters.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @review_statuses ~w(pending shortlisted dismissed)
  @dimensions [:advertiser_country, :currency, :language, :source_feed_type]

  @type bucket_summary :: %{
          bucket: String.t(),
          candidate_count: non_neg_integer(),
          shortlisted_candidate_count: non_neg_integer()
        }

  @type summary :: %{
          provider: String.t(),
          review_status_filter: String.t() | nil,
          total_candidate_count: non_neg_integer(),
          shortlisted_candidate_count: non_neg_integer(),
          dimensions: %{
            advertiser_country: [bucket_summary()],
            currency: [bucket_summary()],
            language: [bucket_summary()],
            source_feed_type: [bucket_summary()]
          }
        }

  @spec summary(keyword() | map() | term()) :: summary()
  def summary(opts \\ [])

  def summary(opts) when is_list(opts) or is_map(opts) do
    review_status_filter = opts |> Map.new() |> review_status_filter()
    base_query = base_query(review_status_filter)
    totals = totals(base_query)

    %{
      provider: @provider,
      review_status_filter: review_status_filter,
      total_candidate_count: totals.total_candidate_count,
      shortlisted_candidate_count: totals.shortlisted_candidate_count,
      dimensions: dimension_summaries(base_query)
    }
  end

  def summary(_opts), do: summary([])

  defp base_query(review_status_filter) do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> maybe_filter_review_status(review_status_filter)
  end

  defp maybe_filter_review_status(query, nil), do: query

  defp maybe_filter_review_status(query, review_status) do
    where(query, [candidate], candidate.review_status == ^review_status)
  end

  defp review_status_filter(%{review_status: review_status})
       when review_status in @review_statuses do
    review_status
  end

  defp review_status_filter(%{"review_status" => review_status})
       when review_status in @review_statuses do
    review_status
  end

  defp review_status_filter(_opts), do: nil

  defp totals(base_query) do
    base_query
    |> select([candidate], %{
      total_candidate_count: count(candidate.id),
      shortlisted_candidate_count:
        filter(count(candidate.id), candidate.review_status == "shortlisted")
    })
    |> Repo.one()
  end

  defp dimension_summaries(base_query) do
    Map.new(@dimensions, fn dimension ->
      {dimension, dimension_summary(base_query, dimension)}
    end)
  end

  defp dimension_summary(base_query, dimension) do
    base_query
    |> group_by(
      [candidate],
      fragment(
        "COALESCE(NULLIF(UPPER(BTRIM(?)), ''), 'unknown')",
        field(candidate, ^dimension)
      )
    )
    |> order_by([candidate],
      desc: count(candidate.id),
      asc:
        fragment(
          "COALESCE(NULLIF(UPPER(BTRIM(?)), ''), 'unknown')",
          field(candidate, ^dimension)
        )
    )
    |> select([candidate], %{
      bucket:
        fragment(
          "COALESCE(NULLIF(UPPER(BTRIM(?)), ''), 'unknown')",
          field(candidate, ^dimension)
        ),
      candidate_count: count(candidate.id),
      shortlisted_candidate_count:
        filter(count(candidate.id), candidate.review_status == "shortlisted")
    })
    |> Repo.all()
  end
end
