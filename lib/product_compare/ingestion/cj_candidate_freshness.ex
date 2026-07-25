defmodule ProductCompare.Ingestion.CJCandidateFreshness do
  @moduledoc """
  Safe read-only CJ feed freshness aggregate.

  The summary buckets persisted CJ merchant feeds by `last_seen_at` age and
  reports each feed under its linked program stage or `:unmatched`. It does not
  mutate program state, run discovery, or expose raw feed metadata.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @default_fresh_hours 48
  @default_stale_hours 168
  @stages Enum.map(CJProgram.stages(), &String.to_atom/1) ++ [:unmatched]
  @stage_keys Map.new(@stages, &{Atom.to_string(&1), &1})
  @buckets [:fresh, :aging, :stale]
  @bucket_keys Map.new(@buckets, &{Atom.to_string(&1), &1})

  @type stage_counts :: %{
          new: non_neg_integer(),
          considering: non_neg_integer(),
          selected: non_neg_integer(),
          applied: non_neg_integer(),
          accepted: non_neg_integer(),
          not_pursuing: non_neg_integer(),
          declined: non_neg_integer(),
          unmatched: non_neg_integer()
        }

  @type bucket_summary :: %{
          candidate_count: non_neg_integer(),
          stage_counts: stage_counts()
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

  defp thresholds(opts) when is_list(opts) do
    if Keyword.keyword?(opts) do
      thresholds(Map.new(opts))
    else
      thresholds(%{})
    end
  end

  defp thresholds(opts) when is_map(opts) do
    fresh_hours = positive_integer(option(opts, :fresh_hours), @default_fresh_hours)
    stale_hours = positive_integer(option(opts, :stale_hours), @default_stale_hours)

    %{fresh_hours: fresh_hours, stale_hours: max(stale_hours, fresh_hours)}
  end

  defp thresholds(_opts), do: thresholds(%{})

  defp option(opts, key), do: Map.get(opts, key, Map.get(opts, Atom.to_string(key)))

  defp positive_integer(value, _default) when is_integer(value) and value > 0, do: value
  defp positive_integer(_value, default), do: default

  defp bucket_counts(now, %{fresh_hours: fresh_hours, stale_hours: stale_hours}) do
    MerchantFeedCandidate
    |> join(:left, [feed], program in CJProgram, on: program.id == feed.cj_program_id)
    |> where([feed], feed.provider == @provider)
    |> select([feed, program], %{
      id: feed.id,
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
          feed.last_seen_at,
          ^fresh_hours,
          ^now,
          feed.last_seen_at,
          ^stale_hours
        ),
      stage: fragment("COALESCE(?, 'unmatched')", program.stage)
    })
    |> subquery()
    |> group_by([feed], [feed.bucket, feed.stage])
    |> select([feed], %{
      bucket: feed.bucket,
      stage: feed.stage,
      candidate_count: count(feed.id)
    })
    |> Repo.all()
    |> Enum.reduce(empty_buckets(), fn row, buckets ->
      bucket = Map.fetch!(@bucket_keys, row.bucket)
      stage = Map.get(@stage_keys, row.stage, :unmatched)

      update_in(buckets, [bucket], fn summary ->
        %{
          candidate_count: summary.candidate_count + row.candidate_count,
          stage_counts: Map.update!(summary.stage_counts, stage, &(&1 + row.candidate_count))
        }
      end)
    end)
  end

  defp empty_buckets do
    Map.new(@buckets, fn bucket ->
      {bucket, %{candidate_count: 0, stage_counts: empty_stage_counts()}}
    end)
  end

  defp empty_stage_counts, do: Map.new(@stages, &{&1, 0})
end
