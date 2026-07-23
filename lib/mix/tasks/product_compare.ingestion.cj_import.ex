defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport do
  @moduledoc """
  Manually imports one page of CJ shopping products.
  """

  use Mix.Task

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Options
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.Sources.CJ.ProductParser
  alias ProductCompare.Ingestion.Sources.CJ.SourceResolver
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  @shortdoc "Imports one manual CJ shopping product page"
  @fetch_failure_summary "fetch_failed"

  @impl Mix.Task
  def run(argv) do
    opts = Options.parse_argv(argv)
    check_credentials? = Keyword.get(opts, :check_credentials, false)

    unless check_credentials? do
      Mix.Task.run("app.start")
    end

    opts
    |> run_import()
    |> case do
      {:ok, report} when check_credentials? ->
        print_credential_report(report)
        maybe_require_ready!(opts, report)
        :ok

      {:ok, _report} ->
        :ok

      {:error, reason} ->
        Mix.raise("CJ import failed: #{inspect(reason)}")
    end
  end

  @spec run_import(keyword()) :: {:ok, map()} | {:error, term()}
  def run_import(opts) do
    do_run_import(opts)
  end

  defp do_run_import(opts) do
    cond do
      Keyword.get(opts, :check_credentials, false) ->
        {:ok, Options.credential_report(opts)}

      candidate_import_requested?(opts) ->
        import_candidates(opts)

      true ->
        do_import(opts)
    end
  end

  defp do_import(opts) do
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
            report = Map.put(report, :next_cursor, next_cursor)

            maybe_print_report(report, opts)

            report_result(report)
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
    status = if report.failed == 0, do: "succeeded", else: "failed"

    Ingestion.complete_import_run(import_run, %{
      status: status,
      cursor_end: next_cursor,
      pages_fetched: report.pages_fetched,
      records_fetched: report.fetched,
      records_normalized: report.normalized,
      records_persisted: report.persisted,
      records_failed: report.failed
    })
  end

  defp fail_import_run(import_run, report, next_cursor) do
    Ingestion.complete_import_run(import_run, %{
      error_summary: @fetch_failure_summary,
      status: "failed",
      cursor_end: next_cursor,
      pages_fetched: report.pages_fetched,
      records_failed: report.failed,
      records_fetched: report.fetched,
      records_normalized: report.normalized,
      records_persisted: report.persisted
    })
  end

  defp serviceable_areas_for_query(fetch_opts) do
    fetch_opts
    |> Keyword.fetch!(:serviceable_areas)
    |> case do
      value when is_binary(value) -> [value]
      value when is_list(value) -> value
    end
  end

  defp fetch_source do
    SourceResolver.fetch_source()
  end

  defp import_source(opts) do
    case Keyword.get(opts, :source) do
      %Source{} = source -> {:ok, source}
      _source -> fetch_source()
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
    _exception -> {:error, :runner_exception}
  catch
    _kind, _reason -> {:error, :runner_exception}
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

  defp candidate_import_requested?(opts) do
    Keyword.get(opts, :from_candidates, false) ||
      opts
      |> Keyword.get(:provider_feed_ids, [])
      |> Enum.any?()
  end

  defp import_candidates(opts) do
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
        candidates
        |> Enum.reduce(
          initial_candidate_report(length(candidates)),
          &import_candidate(&1, &2, opts)
        )
        |> then(fn report ->
          maybe_print_candidate_report(report, opts)
          candidate_report_result(report, opts)
        end)

      missing_feed_ids ->
        report = initial_candidate_report(length(candidates))
        maybe_print_candidate_report(report, opts)
        {:error, {:provider_feed_candidates_not_found, missing_feed_ids}}
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
    |> limit(^Options.candidate_limit(provider_feed_ids, Keyword.get(opts, :candidate_limit)))
    |> preload(:source)
  end

  defp maybe_filter_provider_feed_ids(query, []), do: query

  defp maybe_filter_provider_feed_ids(query, provider_feed_ids) do
    where(query, [candidate], candidate.provider_feed_id in ^provider_feed_ids)
  end

  defp maybe_filter_review_status(query, [_first | _rest], _review_status), do: query

  defp maybe_filter_review_status(query, [], review_status) do
    status = Options.normalize_review_status(review_status || "shortlisted")

    where(query, [candidate], candidate.review_status == ^status)
  end

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
    initial_aggregate_report()
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
        case do_import(import_opts) do
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
    |> merge_report(import_report)
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

  defp maybe_print_candidate_report(report, opts) do
    if Keyword.get(opts, :print_report, true) do
      IO.puts(
        "candidate_count=#{report.candidates_matched} imported_candidates=#{report.candidates_imported} skipped_candidates=#{report.candidates_skipped} candidate_failures=#{report.candidate_failures} fetched=#{report.fetched} normalized=#{report.normalized} persisted=#{report.persisted} failed=#{report.failed} pages_fetched=#{report.pages_fetched}"
      )
    end
  end

  defp print_report(report) do
    IO.puts(
      "fetched=#{report.fetched} normalized=#{report.normalized} persisted=#{report.persisted} failed=#{report.failed} pages_fetched=#{report.pages_fetched}"
    )
  end

  defp maybe_print_report(report, opts) do
    if Keyword.get(opts, :print_report, true) do
      print_report(report)
    end
  end

  defp print_credential_report(report) do
    IO.puts(
      "provider=#{report.provider} surface=#{report.surface} ready=#{report.ready} missing_required=#{Enum.join(report.missing_required, ",")}"
    )
  end

  defp maybe_require_ready!(opts, %{ready: false, missing_required: missing_required}) do
    if Keyword.get(opts, :require_ready, false) do
      Mix.raise("missing CJ credentials: #{Enum.join(missing_required, ",")}")
    end

    :ok
  end

  defp maybe_require_ready!(_opts, _report), do: :ok

  defp report_result(%{failed: 0} = report), do: {:ok, report}
  defp report_result(report), do: {:error, {:row_failures, report}}
end
