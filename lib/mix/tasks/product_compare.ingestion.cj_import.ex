defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport do
  @moduledoc """
  Manually imports one page of CJ shopping products.
  """

  use Mix.Task

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.Sources.CJ.ProductParser
  alias ProductCompare.Ingestion.Sources.CJ.SourceResolver

  @shortdoc "Imports one manual CJ shopping product page"
  @credential_requirements [
    {"CJ_API_TOKEN", :api_token},
    {"CJ_ACCOUNT_ID", :company_id}
  ]
  @fetch_failure_summary "fetch_failed"

  @impl Mix.Task
  def run(argv) do
    opts = parse_argv(argv)
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
    if Keyword.get(opts, :check_credentials, false) do
      {:ok, credential_report(opts)}
    else
      do_import(opts)
    end
  end

  defp do_import(opts) do
    fetcher = Keyword.get(opts, :fetcher, &ProductParser.fetch_batch/2)
    cursor = Keyword.get(opts, :cursor)
    fetch_opts = fetch_opts(opts)
    pages = page_count(opts)

    with {:ok, source} <- fetch_source(),
         {:ok, import_run} <- start_import_run(source, cursor, fetch_opts, pages) do
      case fetch_pages(source, fetcher, cursor, fetch_opts, pages) do
        {:ok, report, next_cursor} ->
          with {:ok, _completed_run} <- complete_import_run(import_run, report, next_cursor) do
            report = Map.put(report, :next_cursor, next_cursor)

            maybe_print_report(report, opts)

            report_result(report)
          end

        {:error, reason, report, next_cursor} ->
          _completed_run =
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

          {:error, reason}
      end
    end
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          currency: :string,
          keywords: :string,
          limit: :integer,
          offset: :integer,
          pages: :integer,
          serviceable_area: :string,
          check_credentials: :boolean,
          require_ready: :boolean
        ]
      )

    opts
    |> Keyword.update(:keywords, ["shoe"], &parse_keywords/1)
    |> Keyword.put_new(:limit, 25)
    |> Keyword.put_new(:cursor, Keyword.get(opts, :offset))
    |> Keyword.put_new(:currency, "USD")
    |> Keyword.put_new(:pages, 1)
    |> Keyword.put_new(:check_credentials, false)
    |> Keyword.put_new(:require_ready, false)
    |> Keyword.put_new(:serviceable_areas, Keyword.get(opts, :serviceable_area, "US"))
  end

  defp parse_keywords(value) do
    value
    |> String.split(",", trim: true)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
    |> case do
      [] -> ["shoe"]
      keywords -> keywords
    end
  end

  defp fetch_opts(opts) do
    [
      currency: Keyword.get(opts, :currency, "USD"),
      keywords: Keyword.get(opts, :keywords, ["shoe"]),
      limit: Keyword.get(opts, :limit, 25),
      serviceable_areas: Keyword.get(opts, :serviceable_areas, ["US"])
    ]
  end

  defp page_count(opts) do
    case Keyword.get(opts, :pages, 1) do
      value when is_integer(value) and value > 0 -> value
      _invalid -> 1
    end
  end

  defp start_import_run(source, cursor, fetch_opts, pages) do
    Ingestion.start_import_run(%{
      source_id: source.id,
      provider: "cj",
      surface: "shoppingProducts",
      query: %{
        "currency" => Keyword.fetch!(fetch_opts, :currency),
        "keywords" => Keyword.fetch!(fetch_opts, :keywords),
        "serviceableAreas" => serviceable_areas_for_query(fetch_opts)
      },
      cursor_start: cursor || 0,
      page_size: Keyword.fetch!(fetch_opts, :limit),
      pages_requested: pages
    })
  end

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

  defp fetch_pages(source, fetcher, cursor, fetch_opts, pages) do
    Enum.reduce_while(1..pages, {:ok, initial_aggregate_report(), cursor}, fn _page,
                                                                              {:ok, report,
                                                                               current_cursor} ->
      case fetcher.(current_cursor, fetch_opts) do
        {:ok, records, next_cursor} ->
          page_report = persist_records(source, records)

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

  defp persist_records(source, records) do
    Enum.reduce(records, initial_report(records), fn record, report ->
      case ProductParser.normalize(record) do
        {:ok, listing} ->
          report = Map.update!(report, :normalized, &(&1 + 1))

          case Ingestion.persist_normalized_listing(source, listing) do
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

  defp credential_report(opts) do
    missing_required =
      @credential_requirements
      |> Enum.reject(fn {env_var, opt_key} -> credential_present?(opts, env_var, opt_key) end)
      |> Enum.map(fn {env_var, _opt_key} -> env_var end)

    %{
      provider: "cj",
      surface: "shoppingProducts",
      ready: missing_required == [],
      missing_required: missing_required
    }
  end

  defp credential_present?(opts, env_var, opt_key) do
    opts
    |> Keyword.get(opt_key)
    |> blank_to_nil()
    |> case do
      nil -> env_var |> System.get_env() |> blank_to_nil()
      value -> value
    end
    |> is_nil()
    |> Kernel.not()
  end

  defp blank_to_nil(value) when is_binary(value) do
    value
    |> String.trim()
    |> case do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp blank_to_nil(value), do: value

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
