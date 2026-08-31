defmodule ProductCompare.Ingestion.CJCandidateFreshness do
  @moduledoc """
  Safe read-only CJ feed freshness aggregate.

  The summary buckets persisted CJ merchant feeds by `last_seen_at` age and
  reports each feed under its linked program stage or `:unmatched`. It does not
  mutate program state, run discovery, or expose raw feed metadata.
  """

  import Ecto.Query

  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @default_fresh_hours 48
  @default_stale_hours 168
  @stages Map.values(CJProgram.stage_keys()) ++ [:unmatched]
  @buckets [:fresh, :aging, :stale]

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
    fresh_after = DateTime.add(now, -fresh_hours * 3_600, :second)
    stale_before = DateTime.add(now, -stale_hours * 3_600, :second)

    MerchantFeedCandidate
    |> join(:left, [feed], program in CJProgram, on: program.id == feed.cj_program_id)
    |> join(:inner, [feed, _program], source in assoc(feed, :source))
    |> where([_feed, _program, source], source.provider == @provider)
    |> group_by([_feed, program], program.stage)
    |> select([feed, program], %{
      stage: program.stage,
      candidate_count: count(feed.id),
      fresh_count: filter(count(feed.id), feed.last_seen_at >= ^fresh_after),
      stale_count:
        filter(
          count(feed.id),
          feed.last_seen_at < ^fresh_after and feed.last_seen_at <= ^stale_before
        )
    })
    |> Repo.all()
    |> Enum.reduce(empty_buckets(), fn row, buckets ->
      stage = CJPrograms.normalize_report_stage(row.stage)
      aging_count = row.candidate_count - row.fresh_count - row.stale_count

      buckets
      |> add_count(:fresh, stage, row.fresh_count)
      |> add_count(:aging, stage, aging_count)
      |> add_count(:stale, stage, row.stale_count)
    end)
  end

  defp add_count(buckets, bucket, stage, count) do
    update_in(buckets, [bucket], fn summary ->
      %{
        candidate_count: summary.candidate_count + count,
        stage_counts: Map.update!(summary.stage_counts, stage, &(&1 + count))
      }
    end)
  end

  defp empty_buckets do
    Map.new(@buckets, fn bucket ->
      {bucket, %{candidate_count: 0, stage_counts: empty_stage_counts()}}
    end)
  end

  defp empty_stage_counts, do: Map.new(@stages, &{&1, 0})
end
