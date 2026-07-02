defmodule ProductCompare.Ingestion.CJCandidateFreshness do
  @moduledoc """
  Safe read-only CJ candidate freshness aggregate.

  The summary buckets persisted CJ merchant feed candidates by `last_seen_at`
  age and returns aggregate counts only. It does not mutate review state, run
  discovery, expose raw metadata, or add any operator command surface.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @default_fresh_hours 48
  @default_stale_hours 168
  @review_statuses [:pending, :shortlisted, :dismissed]
  @buckets [:fresh, :aging, :stale]

  @type review_status_counts :: %{
          pending: non_neg_integer(),
          shortlisted: non_neg_integer(),
          dismissed: non_neg_integer(),
          total: non_neg_integer()
        }

  @type bucket_summary :: %{
          candidate_count: non_neg_integer(),
          review_status_counts: review_status_counts()
        }

  @type summary :: %{
          provider: String.t(),
          fresh_hours: pos_integer(),
          stale_hours: pos_integer(),
          buckets: %{fresh: bucket_summary(), aging: bucket_summary(), stale: bucket_summary()}
        }

  @spec summary(keyword() | map() | term()) :: summary()
  def summary(opts \\ []) do
    summary(opts, DateTime.utc_now())
  end

  @spec summary(keyword() | map() | term(), DateTime.t()) :: summary()
  def summary(opts, %DateTime{} = now) do
    thresholds = thresholds(opts)

    %{
      provider: @provider,
      fresh_hours: thresholds.fresh_hours,
      stale_hours: thresholds.stale_hours,
      buckets: bucket_counts(now, thresholds)
    }
  end

  defp thresholds(opts) when is_list(opts) or is_map(opts) do
    opts = Map.new(opts)
    fresh_hours = positive_integer(Map.get(opts, :fresh_hours), @default_fresh_hours)
    stale_hours = positive_integer(Map.get(opts, :stale_hours), @default_stale_hours)

    %{fresh_hours: fresh_hours, stale_hours: max(stale_hours, fresh_hours)}
  end

  defp thresholds(_opts), do: thresholds([])

  defp positive_integer(value, _default) when is_integer(value) and value > 0, do: value
  defp positive_integer(_value, default), do: default

  defp bucket_counts(now, %{fresh_hours: fresh_hours, stale_hours: stale_hours}) do
    bucketed_candidates =
      MerchantFeedCandidate
      |> where([candidate], candidate.provider == @provider)
      |> select([candidate], %{
        id: candidate.id,
        bucket:
          fragment(
            """
            CASE
              WHEN EXTRACT(EPOCH FROM (? - ?)) / 3600 <= ? THEN 'fresh'
              WHEN EXTRACT(EPOCH FROM (? - ?)) / 3600 >= ? THEN 'stale'
              ELSE 'aging'
            END
            """,
            ^now,
            candidate.last_seen_at,
            ^fresh_hours,
            ^now,
            candidate.last_seen_at,
            ^stale_hours
          ),
        review_status: candidate.review_status
      })

    rows =
      bucketed_candidates
      |> subquery()
      |> group_by([candidate], [candidate.bucket, candidate.review_status])
      |> select([candidate], %{
        bucket: candidate.bucket,
        review_status: candidate.review_status,
        candidate_count: count(candidate.id)
      })
      |> Repo.all()

    Enum.reduce(rows, empty_buckets(), fn row, buckets ->
      bucket = String.to_existing_atom(row.bucket)
      review_status = String.to_existing_atom(row.review_status)

      update_in(buckets, [bucket], fn summary ->
        status_counts =
          Map.update!(summary.review_status_counts, review_status, &(&1 + row.candidate_count))

        status_counts = Map.update!(status_counts, :total, &(&1 + row.candidate_count))

        %{
          candidate_count: summary.candidate_count + row.candidate_count,
          review_status_counts: status_counts
        }
      end)
    end)
  end

  defp empty_buckets do
    Map.new(@buckets, fn bucket ->
      {bucket,
       %{
         candidate_count: 0,
         review_status_counts: empty_review_status_counts()
       }}
    end)
  end

  defp empty_review_status_counts do
    @review_statuses
    |> Map.new(&{&1, 0})
    |> Map.put(:total, 0)
  end
end
