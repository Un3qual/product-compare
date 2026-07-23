defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport.Candidates do
  @moduledoc false

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Runner
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  def requested?(opts) do
    Keyword.get(opts, :from_candidates, false) ||
      opts
      |> Keyword.get(:provider_feed_ids, [])
      |> Enum.any?()
  end

  def run(opts) do
    opts =
      Keyword.update(
        opts,
        :provider_feed_ids,
        [],
        &Options.normalize_provider_feed_id_list!/1
      )

    candidates = import_candidates_query(opts) |> Repo.all()

    case missing_provider_feed_ids(candidates, opts) do
      [] ->
        report =
          Enum.reduce(
            candidates,
            initial_candidate_report(length(candidates)),
            &import_candidate(&1, &2, opts)
          )

        {candidate_report_result(report, opts), report}

      missing_feed_ids ->
        report = initial_candidate_report(length(candidates))
        {{:error, {:provider_feed_candidates_not_found, missing_feed_ids}}, report}
    end
  end

  defp import_candidates_query(opts) do
    provider_feed_ids = Keyword.get(opts, :provider_feed_ids, [])

    MerchantFeedCandidate
    |> where([candidate], candidate.provider == "cj")
    |> maybe_filter_provider_feed_ids(provider_feed_ids)
    |> maybe_filter_review_status(provider_feed_ids, Keyword.get(opts, :review_status))
    |> order_by([candidate],
      asc: candidate.advertiser_name,
      asc: candidate.feed_name,
      asc: candidate.id
    )
    |> limit(^candidate_limit(provider_feed_ids, Keyword.get(opts, :candidate_limit)))
    |> preload(:source)
  end

  defp maybe_filter_provider_feed_ids(query, []), do: query

  defp maybe_filter_provider_feed_ids(query, provider_feed_ids) do
    where(query, [candidate], candidate.provider_feed_id in ^provider_feed_ids)
  end

  defp maybe_filter_review_status(query, [_first | _rest], _review_status), do: query

  defp maybe_filter_review_status(query, [], review_status) do
    status = normalize_review_status(review_status || "shortlisted")

    where(query, [candidate], candidate.review_status == ^status)
  end

  defp normalize_review_status(status) when status in ~w(pending shortlisted dismissed),
    do: status

  defp normalize_review_status(status), do: Mix.raise("invalid review status: #{status}")

  defp candidate_limit([_first | _rest] = provider_feed_ids, _candidate_limit),
    do: length(provider_feed_ids)

  defp candidate_limit([], value) when is_integer(value) and value > 0, do: min(value, 50)
  defp candidate_limit([], _value), do: 10

  defp missing_provider_feed_ids(candidates, opts) do
    matched_feed_ids =
      candidates
      |> Enum.map(&Options.normalize_string(&1.provider_feed_id))
      |> Enum.reject(&is_nil/1)
      |> MapSet.new()

    opts
    |> Keyword.get(:provider_feed_ids, [])
    |> Enum.reject(&MapSet.member?(matched_feed_ids, &1))
  end

  defp initial_candidate_report(candidate_count) do
    %{
      failed: 0,
      fetched: 0,
      normalized: 0,
      pages_fetched: 0,
      persisted: 0
    }
    |> Map.merge(%{
      candidate_failures: 0,
      candidates_imported: 0,
      candidates_matched: candidate_count,
      candidates_skipped: 0
    })
  end

  defp import_candidate(%MerchantFeedCandidate{} = candidate, report, opts) do
    case candidate_import_opts(candidate, opts) do
      {:ok, import_opts} ->
        case run_import(import_opts) do
          {:ok, import_report} ->
            report
            |> merge_candidate_import_report(import_report)
            |> Map.update!(:candidates_imported, &(&1 + 1))

          {:error, {:row_failures, import_report}} when is_map(import_report) ->
            report
            |> merge_candidate_import_report(import_report)
            |> Map.update!(:candidate_failures, &(&1 + 1))

          {:error, {:fetch_failed, _reason, import_report}} when is_map(import_report) ->
            report
            |> merge_candidate_import_report(import_report)
            |> Map.update!(:candidate_failures, &(&1 + 1))

          {:error, _reason} ->
            Map.update!(report, :candidate_failures, &(&1 + 1))
        end

      :skip ->
        Map.update!(report, :candidates_skipped, &(&1 + 1))
    end
  end

  defp run_import(opts) do
    with {:ok, report} <- Runner.run(opts) do
      report_result(report)
    end
  end

  defp candidate_import_opts(%MerchantFeedCandidate{} = candidate, opts) do
    case Options.normalize_string(candidate.provider_feed_id) do
      nil ->
        :skip

      provider_feed_id ->
        {:ok,
         opts
         |> Keyword.put(:source, candidate.source)
         |> Keyword.put(:ad_ids, [provider_feed_id])
         |> Keyword.put(
           :partner_ids,
           List.wrap(Options.normalize_string(candidate.advertiser_id))
         )
         |> Keyword.put(
           :currency,
           Options.normalize_string(candidate.currency) || Keyword.get(opts, :currency, "USD")
         )
         |> Keyword.put(:keywords, Keyword.get(opts, :keywords, nil))
         |> Keyword.put(:merchant_feed_candidate_id, candidate.id)
         |> Keyword.put(:provider_feed_id, provider_feed_id)
         |> Keyword.put(:feed_name, candidate.feed_name)
         |> Keyword.put(:print_report, false)}
    end
  end

  defp merge_candidate_import_report(report, import_report) do
    report
    |> Map.update!(:failed, &(&1 + import_report.failed))
    |> Map.update!(:fetched, &(&1 + import_report.fetched))
    |> Map.update!(:normalized, &(&1 + import_report.normalized))
    |> Map.update!(:persisted, &(&1 + import_report.persisted))
    |> Map.update!(:pages_fetched, &(&1 + Map.get(import_report, :pages_fetched, 0)))
  end

  defp candidate_report_result(%{candidates_matched: 0} = report, opts) do
    case Keyword.get(opts, :provider_feed_ids, []) do
      [] -> {:ok, report}
      provider_feed_ids -> {:error, {:provider_feed_candidates_not_found, provider_feed_ids}}
    end
  end

  defp candidate_report_result(%{candidate_failures: 0, failed: 0} = report, _opts),
    do: {:ok, report}

  defp candidate_report_result(report, _opts), do: {:error, {:candidate_import_failures, report}}

  defp report_result(%{failed: 0} = report), do: {:ok, report}
  defp report_result(report), do: {:error, {:row_failures, report}}
end
