defmodule ProductCompare.Ingestion.CJCandidateMarketCoverage do
  @moduledoc """
  Safe read-only CJ feed market coverage aggregate.

  The summary exposes feed counts by normalized market dimensions and linked
  program stage. CJ feeds without a program are counted as `:unmatched`; raw
  provider metadata, credentials, account IDs, and tracking values are not
  selected.
  """

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @provider "cj"
  @stages Map.values(CJProgram.stage_keys()) ++ [:unmatched]
  @stage_keys Map.new(@stages, &{Atom.to_string(&1), &1})
  @dimensions [:advertiser_country, :currency, :language, :source_feed_type]

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
          bucket: String.t(),
          candidate_count: non_neg_integer(),
          stage_counts: stage_counts()
        }

  @type summary :: %{
          provider: String.t(),
          total_candidate_count: non_neg_integer(),
          stage_counts: stage_counts(),
          dimensions: %{
            advertiser_country: [bucket_summary()],
            currency: [bucket_summary()],
            language: [bucket_summary()],
            source_feed_type: [bucket_summary()]
          }
        }

  @spec summary(keyword() | map() | term()) :: summary()
  def summary(_opts \\ []) do
    base_query = base_query()

    %{
      provider: @provider,
      total_candidate_count: Repo.aggregate(base_query, :count, :id),
      stage_counts: stage_counts(base_query),
      dimensions: dimension_summaries(base_query)
    }
  end

  defp base_query do
    MerchantFeedCandidate
    |> join(:left, [feed], program in CJProgram, on: program.id == feed.cj_program_id)
    |> where([feed], feed.provider == @provider)
  end

  defp stage_counts(base_query) do
    base_query
    |> group_by([_feed, program], program.stage)
    |> select([feed, program], %{
      stage: fragment("COALESCE(?, 'unmatched')", program.stage),
      candidate_count: count(feed.id)
    })
    |> Repo.all()
    |> stage_counts_from_rows()
  end

  defp dimension_summaries(base_query) do
    Map.new(@dimensions, fn dimension ->
      {dimension, dimension_summary(base_query, dimension)}
    end)
  end

  defp dimension_summary(base_query, dimension) do
    base_query
    |> group_by(
      [feed, program],
      [
        fragment(
          "COALESCE(NULLIF(UPPER(BTRIM(?)), ''), 'unknown')",
          field(feed, ^dimension)
        ),
        program.stage
      ]
    )
    |> select([feed, program], %{
      bucket:
        fragment(
          "COALESCE(NULLIF(UPPER(BTRIM(?)), ''), 'unknown')",
          field(feed, ^dimension)
        ),
      stage: fragment("COALESCE(?, 'unmatched')", program.stage),
      candidate_count: count(feed.id)
    })
    |> Repo.all()
    |> Enum.reduce(%{}, fn row, buckets ->
      stage = Map.get(@stage_keys, row.stage, :unmatched)

      Map.update(
        buckets,
        row.bucket,
        %{candidate_count: row.candidate_count, stage_counts: %{stage => row.candidate_count}},
        fn summary ->
          %{
            candidate_count: summary.candidate_count + row.candidate_count,
            stage_counts:
              Map.update(
                summary.stage_counts,
                stage,
                row.candidate_count,
                &(&1 + row.candidate_count)
              )
          }
        end
      )
    end)
    |> Enum.map(fn {bucket, summary} ->
      %{
        bucket: bucket,
        candidate_count: summary.candidate_count,
        stage_counts: complete_stage_counts(summary.stage_counts)
      }
    end)
    |> Enum.sort_by(&{-&1.candidate_count, &1.bucket})
  end

  defp stage_counts_from_rows(rows) do
    rows
    |> Enum.reduce(empty_stage_counts(), fn row, counts ->
      stage = Map.get(@stage_keys, row.stage, :unmatched)
      Map.update!(counts, stage, &(&1 + row.candidate_count))
    end)
  end

  defp complete_stage_counts(counts), do: Map.merge(empty_stage_counts(), counts)
  defp empty_stage_counts, do: Map.new(@stages, &{&1, 0})
end
