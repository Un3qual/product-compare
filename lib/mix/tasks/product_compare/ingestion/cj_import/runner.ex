defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport.Runner do
  @moduledoc false

  require Logger

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Options
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.CJFailureDiagnostics
  alias ProductCompare.Ingestion.CJRunCompletion
  alias ProductCompare.Ingestion.Sources.CJ.ProductParser
  alias ProductCompare.Ingestion.Sources.CJ.SourceResolver
  alias ProductCompareSchemas.Specs.Source

  @fetch_failure_summary "fetch_failed"

  def run(opts) do
    fetcher = Keyword.get(opts, :fetcher, &ProductParser.fetch_batch/2)
    cursor = Keyword.get(opts, :cursor)
    fetch_opts = Options.fetch_opts(opts)
    pages = Options.page_count(opts)

    with {:ok, source} <- import_source(opts),
         {:ok, import_run} <-
           start_import_run(
             source,
             cursor,
             fetch_opts,
             pages,
             Keyword.get(opts, :complete_scope, false)
           ) do
      case fetch_pages(source, fetcher, cursor, fetch_opts, pages, import_run) do
        {:ok, report, next_cursor} ->
          with {:ok, _completed_run} <- complete_import_run(import_run, report, next_cursor) do
            {:ok, Map.put(report, :next_cursor, next_cursor)}
          end

        {:error, reason, report, next_cursor} ->
          case fail_import_run(import_run, report, next_cursor) do
            {:ok, _completed_run} -> fetch_failure_result(reason, report)
            {:error, finalization_reason} -> {:error, finalization_reason}
          end
      end
    end
  end

  defp start_import_run(source, cursor, fetch_opts, pages, complete_scope) do
    Ingestion.start_import_run(%{
      complete_scope: complete_scope,
      source_id: source.id,
      provider: "cj",
      surface: "shoppingProducts",
      query: import_run_query(fetch_opts),
      cursor_start: cursor || 0,
      page_size: Keyword.fetch!(fetch_opts, :limit),
      pages_requested: pages
    })
  end

  defp import_run_query(fetch_opts) do
    %{
      "currency" => Keyword.fetch!(fetch_opts, :currency),
      "keywords" => Keyword.fetch!(fetch_opts, :keywords),
      "serviceableAreas" => serviceable_areas_for_query(fetch_opts)
    }
    |> put_query_field("adIds", Keyword.fetch!(fetch_opts, :ad_ids))
    |> put_query_field("partnerIds", Keyword.fetch!(fetch_opts, :partner_ids))
    |> put_query_field(
      "merchantFeedCandidateId",
      Keyword.fetch!(fetch_opts, :merchant_feed_candidate_id)
    )
    |> put_query_field("providerFeedId", Keyword.fetch!(fetch_opts, :provider_feed_id))
    |> put_query_field("feedName", Keyword.fetch!(fetch_opts, :feed_name))
  end

  defp put_query_field(query, _key, nil), do: query
  defp put_query_field(query, _key, []), do: query
  defp put_query_field(query, key, value), do: Map.put(query, key, value)

  defp complete_import_run(import_run, report, next_cursor) do
    CJRunCompletion.complete(import_run, run_counts(report), next_cursor)
  end

  defp fail_import_run(import_run, report, next_cursor) do
    CJRunCompletion.fail(import_run, run_counts(report), next_cursor, @fetch_failure_summary)
  end

  defp run_counts(report) do
    %{
      pages_fetched: report.pages_fetched,
      records_fetched: report.fetched,
      records_normalized: report.normalized,
      records_persisted: report.persisted,
      records_failed: report.failed
    }
  end

  defp serviceable_areas_for_query(fetch_opts) do
    fetch_opts
    |> Keyword.fetch!(:serviceable_areas)
    |> case do
      value when is_binary(value) -> [value]
      value when is_list(value) -> value
    end
  end

  defp import_source(opts) do
    case Keyword.get(opts, :source) do
      %Source{} = source -> {:ok, source}
      _source -> SourceResolver.fetch_source()
    end
  end

  defp fetch_pages(source, fetcher, cursor, fetch_opts, pages, import_run) do
    Enum.reduce_while(1..pages, {:ok, initial_aggregate_report(), cursor}, fn _page,
                                                                              {:ok, report,
                                                                               current_cursor} ->
      case fetch_page(source, fetcher, current_cursor, fetch_opts, import_run) do
        {:ok, page_report, next_cursor} ->
          report =
            report
            |> merge_report(page_report)
            |> Map.update!(:pages_fetched, &(&1 + 1))

          if is_nil(next_cursor) do
            {:halt, {:ok, report, next_cursor}}
          else
            {:cont, {:ok, report, next_cursor}}
          end

        {:error, reason} ->
          {:halt, {:error, reason, report, current_cursor}}
      end
    end)
  end

  defp fetch_page(source, fetcher, current_cursor, fetch_opts, import_run) do
    case fetcher.(current_cursor, fetch_opts) do
      {:ok, records, next_cursor} ->
        {:ok, persist_records(source, records, import_run), next_cursor}

      {:error, reason} ->
        {:error, reason}
    end
  rescue
    exception ->
      log_runner_failure(:error, exception, __STACKTRACE__)
      {:error, :runner_exception}
  catch
    kind, reason ->
      log_runner_failure(kind, reason, __STACKTRACE__)
      {:error, :runner_exception}
  end

  defp log_runner_failure(kind, reason, stacktrace) do
    Logger.error(fn ->
      "CJ product import runner failed " <>
        "kind=#{kind} reason=#{CJFailureDiagnostics.category(reason)}\n" <>
        Exception.format_stacktrace(CJFailureDiagnostics.sanitize_stacktrace(stacktrace))
    end)
  end

  defp initial_aggregate_report do
    %{
      failed: 0,
      fetched: 0,
      normalized: 0,
      pages_fetched: 0,
      persisted: 0
    }
  end

  defp merge_report(report, page_report) do
    report
    |> Map.update!(:failed, &(&1 + page_report.failed))
    |> Map.update!(:fetched, &(&1 + page_report.fetched))
    |> Map.update!(:normalized, &(&1 + page_report.normalized))
    |> Map.update!(:persisted, &(&1 + page_report.persisted))
  end

  defp persist_records(source, records, import_run) do
    Enum.reduce(records, initial_report(records), fn record, report ->
      case ProductParser.normalize(record) do
        {:ok, listing} ->
          report = Map.update!(report, :normalized, &(&1 + 1))

          case Ingestion.persist_normalized_listing(source, listing, import_run: import_run) do
            {:ok, _persisted} -> Map.update!(report, :persisted, &(&1 + 1))
            {:error, _reason} -> Map.update!(report, :failed, &(&1 + 1))
          end

        {:error, _reason} ->
          Map.update!(report, :failed, &(&1 + 1))
      end
    end)
  end

  defp initial_report(records) do
    %{
      failed: 0,
      fetched: length(records),
      normalized: 0,
      persisted: 0
    }
  end

  defp fetch_failure_result(reason, report) do
    if partial_report?(report) do
      {:error, {:fetch_failed, reason, report}}
    else
      {:error, reason}
    end
  end

  defp partial_report?(report) do
    Enum.any?(
      ~w(failed fetched normalized pages_fetched persisted)a,
      &(Map.get(report, &1, 0) > 0)
    )
  end
end
