defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates.StaleReport do
  @moduledoc false

  import Ecto.Query

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
      "provider=#{@provider} report=stale max_age_hours=#{Keyword.fetch!(opts, :max_age_hours)} stale_count=#{length(candidates)} status=#{Keyword.fetch!(opts, :status)}"
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

    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> where([candidate], candidate.last_seen_at < ^cutoff)
    |> maybe_filter_status(Keyword.fetch!(opts, :status))
    |> order_by([candidate],
      asc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.id
    )
    |> limit(^Keyword.fetch!(opts, :limit))
    |> Repo.all()
  end

  defp maybe_filter_status(query, "all"), do: query

  defp maybe_filter_status(query, status),
    do: where(query, [candidate], candidate.review_status == ^status)

  defp render_candidate(%MerchantFeedCandidate{} = candidate) do
    {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, candidate.id)

    [
      {:candidate_id, candidate_id},
      {:provider_feed_id, candidate.provider_feed_id},
      {:advertiser_id, candidate.advertiser_id},
      {:advertiser_name, candidate.advertiser_name},
      {:review_status, candidate.review_status},
      {:product_count, candidate.product_count},
      {:last_seen_at, candidate.last_seen_at},
      {:age_hours, age_hours(candidate.last_seen_at)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp age_hours(%DateTime{} = timestamp) do
    DateTime.diff(DateTime.utc_now(), timestamp, :second) |> div(3600)
  end

  defp format_value(nil), do: ""
  defp format_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp format_value(value) when is_boolean(value), do: to_string(value)
  defp format_value(value) when is_integer(value), do: Integer.to_string(value)

  defp format_value(value) when is_binary(value) do
    if String.match?(value, ~r/\s/) do
      inspect(value)
    else
      value
    end
  end

  defp format_value(value), do: to_string(value)
end
