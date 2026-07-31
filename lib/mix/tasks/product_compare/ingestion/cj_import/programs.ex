defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport.Programs do
  @moduledoc false

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Runner
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  def requested?(opts) do
    Keyword.get(opts, :from_programs, false) ||
      opts |> Keyword.fetch!(:provider_feed_ids) |> Enum.any?()
  end

  def run(opts) do
    feeds = import_feeds_query(opts) |> Repo.all()

    case missing_provider_feed_ids(feeds, opts) do
      [] ->
        report =
          Enum.reduce(
            feeds,
            initial_feed_report(length(feeds)),
            &import_feed(&1, &2, opts)
          )

        {feed_report_result(report), report}

      missing_feed_ids ->
        report = initial_feed_report(length(feeds))
        {{:error, {:provider_feeds_not_found, missing_feed_ids}}, report}
    end
  end

  defp import_feeds_query(opts) do
    provider_feed_ids = Keyword.get(opts, :provider_feed_ids, [])
    program_stages = Keyword.fetch!(opts, :program_stages)

    MerchantFeedCandidate
    |> join(:inner, [feed], source in assoc(feed, :source))
    |> where([_feed, source], source.provider == "cj")
    |> maybe_filter_provider_feed_ids(provider_feed_ids)
    |> maybe_filter_program_stages(provider_feed_ids, program_stages)
    |> order_by([feed],
      asc: feed.advertiser_name,
      asc: feed.feed_name,
      asc: feed.id
    )
    |> limit(^feed_limit(provider_feed_ids, Keyword.get(opts, :feed_limit)))
    |> preload([_feed, source], source: source)
  end

  defp maybe_filter_provider_feed_ids(query, []), do: query

  defp maybe_filter_provider_feed_ids(query, provider_feed_ids) do
    where(query, [feed], feed.provider_feed_id in ^provider_feed_ids)
  end

  defp maybe_filter_program_stages(query, [_first | _rest], _program_stages), do: query

  defp maybe_filter_program_stages(query, [], program_stages) do
    query
    |> join(:inner, [feed], program in CJProgram, on: program.id == feed.cj_program_id)
    |> where([_feed, _source, program], program.stage in ^program_stages)
  end

  defp feed_limit([_first | _rest] = provider_feed_ids, _feed_limit),
    do: length(provider_feed_ids)

  defp feed_limit([], value) when is_integer(value) and value > 0, do: min(value, 50)
  defp feed_limit([], _value), do: 10

  defp missing_provider_feed_ids(feeds, opts) do
    matched_feed_ids =
      feeds
      |> Enum.map(&Options.normalize_string(&1.provider_feed_id))
      |> Enum.reject(&is_nil/1)
      |> MapSet.new()

    opts
    |> Keyword.get(:provider_feed_ids, [])
    |> Enum.reject(&MapSet.member?(matched_feed_ids, &1))
  end

  defp initial_feed_report(feed_count) do
    %{
      failed: 0,
      fetched: 0,
      normalized: 0,
      pages_fetched: 0,
      persisted: 0
    }
    |> Map.merge(%{
      feed_count: feed_count,
      feed_failures: 0,
      feeds_skipped: 0,
      imported_feeds: 0
    })
  end

  defp import_feed(%MerchantFeedCandidate{} = feed, report, opts) do
    case feed_import_opts(feed, opts) do
      {:ok, import_opts} ->
        case run_import(import_opts) do
          {:ok, import_report} ->
            report
            |> merge_feed_import_report(import_report)
            |> Map.update!(:imported_feeds, &(&1 + 1))

          {:error, {:row_failures, import_report}} when is_map(import_report) ->
            report
            |> merge_feed_import_report(import_report)
            |> Map.update!(:feed_failures, &(&1 + 1))

          {:error, {:fetch_failed, _reason, import_report}} when is_map(import_report) ->
            report
            |> merge_feed_import_report(import_report)
            |> Map.update!(:feed_failures, &(&1 + 1))

          {:error, _reason} ->
            Map.update!(report, :feed_failures, &(&1 + 1))
        end

      :skip ->
        Map.update!(report, :feeds_skipped, &(&1 + 1))
    end
  end

  defp run_import(opts) do
    with {:ok, report} <- Runner.run(opts) do
      report_result(report)
    end
  end

  defp feed_import_opts(%MerchantFeedCandidate{} = feed, opts) do
    case Options.normalize_string(feed.provider_feed_id) do
      nil ->
        :skip

      provider_feed_id ->
        {:ok,
         opts
         |> Keyword.put(:source, feed.source)
         |> Keyword.put(:ad_ids, [provider_feed_id])
         |> Keyword.put(:partner_ids, List.wrap(Options.normalize_string(feed.advertiser_id)))
         |> Keyword.put(
           :currency,
           Options.normalize_string(feed.currency) || Keyword.get(opts, :currency, "USD")
         )
         |> Keyword.put(:keywords, Keyword.get(opts, :keywords))
         |> Keyword.put(:merchant_feed_candidate_id, feed.id)
         |> Keyword.put(:provider_feed_id, provider_feed_id)
         |> Keyword.put(:feed_name, feed.feed_name)
         |> Keyword.put(:print_report, false)}
    end
  end

  defp merge_feed_import_report(report, import_report) do
    report
    |> Map.update!(:failed, &(&1 + import_report.failed))
    |> Map.update!(:fetched, &(&1 + import_report.fetched))
    |> Map.update!(:normalized, &(&1 + import_report.normalized))
    |> Map.update!(:persisted, &(&1 + import_report.persisted))
    |> Map.update!(:pages_fetched, &(&1 + Map.get(import_report, :pages_fetched, 0)))
  end

  defp feed_report_result(%{feed_failures: 0, failed: 0} = report), do: {:ok, report}

  defp feed_report_result(report), do: {:error, {:feed_import_failures, report}}

  defp report_result(%{failed: 0} = report), do: {:ok, report}
  defp report_result(report), do: {:error, {:row_failures, report}}
end
