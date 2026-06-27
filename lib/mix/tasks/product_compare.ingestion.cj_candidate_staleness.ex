defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateStaleness do
  @moduledoc """
  Reports stale CJ feed candidates without contacting CJ.
  """

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareWeb.GraphQL.GlobalId
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports stale CJ feed candidates"
  @allowed_statuses ~w(pending shortlisted dismissed all)
  @default_max_age_hours 168
  @default_limit 25
  @max_limit 100
  @provider "cj"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    opts = parse_argv(argv)

    opts
    |> load_candidates()
    |> enforce_require_fresh(opts)
    |> render_report(opts)
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          max_age_hours: :integer,
          require_fresh: :boolean,
          limit: :integer,
          status: :string
        ]
      )

    %{
      max_age_hours: normalize_max_age_hours(Keyword.get(opts, :max_age_hours)),
      require_fresh: Keyword.get(opts, :require_fresh, false),
      limit: normalize_limit(Keyword.get(opts, :limit)),
      status: normalize_status(Keyword.get(opts, :status))
    }
  end

  defp normalize_max_age_hours(value) when is_integer(value) and value > 0 do
    value
  end

  defp normalize_max_age_hours(_value), do: @default_max_age_hours

  defp normalize_limit(value) when is_integer(value) and value > 0 do
    min(value, @max_limit)
  end

  defp normalize_limit(_value), do: @default_limit

  defp normalize_status(status) when is_binary(status) do
    status = status |> String.trim() |> String.downcase()

    if status in @allowed_statuses do
      status
    else
      Mix.raise("invalid review status: #{status}")
    end
  end

  defp normalize_status(_status), do: "all"

  defp load_candidates(%{max_age_hours: max_age_hours, status: status, limit: limit}) do
    cutoff =
      DateTime.utc_now()
      |> DateTime.add(-max_age_hours, :hour)

    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> where([candidate], candidate.last_seen_at < ^cutoff)
    |> maybe_filter_status(status)
    |> order_by([candidate],
      asc: candidate.last_seen_at,
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.id
    )
    |> limit(^limit)
    |> Repo.all()
  end

  defp maybe_filter_status(query, "all"), do: query

  defp maybe_filter_status(query, status),
    do: where(query, [candidate], candidate.review_status == ^status)

  defp enforce_require_fresh(candidates, %{require_fresh: true}) when length(candidates) > 0 do
    Mix.raise("stale CJ feed candidates found")
  end

  defp enforce_require_fresh(candidates, _opts), do: candidates

  defp render_report(candidates, %{max_age_hours: max_age_hours, status: status})
       when is_integer(max_age_hours) do
    [
      "provider=#{@provider} max_age_hours=#{max_age_hours} stale_count=#{length(candidates)} status=#{status}"
      | Enum.map(candidates, &render_candidate/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_candidate(candidate) do
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
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join(" ")
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
