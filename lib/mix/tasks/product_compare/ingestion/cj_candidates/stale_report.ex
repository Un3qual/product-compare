defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates.StaleReport do
  @moduledoc false

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Output
  alias ProductCompare.Ingestion.CJPrograms
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareWeb.GraphQL.GlobalId

  @provider "cj"

  @spec print(keyword()) :: :ok
  def print(opts) do
    candidates = stale_candidates(opts)

    if Keyword.fetch!(opts, :require_fresh) and candidates != [] do
      Mix.raise("stale CJ feed candidates found")
    end

    [
      "provider=#{@provider} report=stale max_age_hours=#{Keyword.fetch!(opts, :max_age_hours)} stale_count=#{length(candidates)} stage=#{Keyword.fetch!(opts, :stage)} include_unmatched=#{Keyword.fetch!(opts, :include_unmatched)}"
      | Enum.map(candidates, &render_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()
  end

  defp stale_candidates(opts) do
    cutoff =
      DateTime.utc_now()
      |> DateTime.add(-Keyword.fetch!(opts, :max_age_hours) * 60 * 60, :second)

    linked_candidates =
      opts
      |> linked_stale_candidates(cutoff)
      |> Repo.all()

    unmatched_candidates =
      if Keyword.fetch!(opts, :include_unmatched) do
        cutoff
        |> unmatched_stale_candidates(Keyword.fetch!(opts, :limit))
        |> Repo.all()
      else
        []
      end

    (linked_candidates ++ unmatched_candidates)
    |> Enum.sort_by(&candidate_sort_key/1)
    |> Enum.take(Keyword.fetch!(opts, :limit))
  end

  defp linked_stale_candidates(opts, cutoff) do
    CJPrograms.list_feeds_query(stage: Options.query_stage(opts))
    |> where([candidate], candidate.last_seen_at < ^cutoff)
    |> exclude(:order_by)
    |> order_by([candidate],
      asc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.id
    )
    |> limit(^Keyword.fetch!(opts, :limit))
  end

  defp unmatched_stale_candidates(cutoff, limit) do
    CJPrograms.list_unmatched_feeds_query()
    |> where([candidate], candidate.last_seen_at < ^cutoff)
    |> exclude(:order_by)
    |> order_by([candidate],
      asc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.id
    )
    |> limit(^limit)
  end

  defp render_candidate(%MerchantFeedCandidate{} = candidate) do
    {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, candidate.id)

    [
      {:candidate_id, candidate_id},
      {:provider_feed_id, candidate.provider_feed_id},
      {:advertiser_id, candidate.advertiser_id},
      {:advertiser_name, candidate.advertiser_name},
      {:product_count, candidate.product_count},
      {:last_seen_at, candidate.last_seen_at},
      {:age_hours, age_hours(candidate.last_seen_at)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{Output.format_value(value)}" end)
  end

  defp age_hours(%DateTime{} = timestamp) do
    DateTime.diff(DateTime.utc_now(), timestamp, :second) |> div(3600)
  end

  defp candidate_sort_key(candidate) do
    {
      DateTime.to_unix(candidate.last_seen_at, :microsecond),
      candidate.advertiser_name || "",
      candidate.feed_name || "",
      candidate.id
    }
  end
end
