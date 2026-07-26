defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport do
  @moduledoc """
  Manually imports one page of CJ shopping products.
  """

  use Mix.Task

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Programs
  alias Mix.Tasks.ProductCompare.Ingestion.CjImport.Runner

  @shortdoc "Imports one manual CJ shopping product page"

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
    if Keyword.get(opts, :check_credentials, false) do
      {:ok, Options.credential_report(opts)}
    else
      opts = Options.normalize_program_import_opts!(opts)

      if Programs.requested?(opts) do
        import_program_feeds(opts)
      else
        do_import(opts)
      end
    end
  end

  defp do_import(opts) do
    with {:ok, report} <- Runner.run(opts) do
      maybe_print_report(report, opts)
      report_result(report)
    end
  end

  defp import_program_feeds(opts) do
    {result, report} = Programs.run(opts)
    maybe_print_feed_report(report, opts)
    result
  end

  defp maybe_print_feed_report(report, opts) do
    if Keyword.get(opts, :print_report, true) do
      IO.puts(
        "feed_count=#{report.feed_count} imported_feeds=#{report.imported_feeds} skipped_feeds=#{report.feeds_skipped} feed_failures=#{report.feed_failures} fetched=#{report.fetched} normalized=#{report.normalized} persisted=#{report.persisted} failed=#{report.failed} pages_fetched=#{report.pages_fetched}"
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
