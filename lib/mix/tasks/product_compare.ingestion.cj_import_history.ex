defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportHistory do
  @moduledoc "Reports persisted CJ product import history."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @shortdoc "Reports recent CJ product import runs"
  @default_limit 10
  @min_limit 1
  @max_limit 50
  @provider "cj"
  @surface "shoppingProducts"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> parse_limit()
    |> fetch_runs()
    |> render_report()
    |> IO.write()
  end

  defp parse_limit(argv) do
    opts = CliOptions.parse!(argv, limit: :integer)

    normalize_limit(Keyword.get(opts, :limit))
  end

  defp normalize_limit(value) when is_integer(value) and value < @min_limit, do: @min_limit
  defp normalize_limit(value) when is_integer(value) and value > @max_limit, do: @max_limit
  defp normalize_limit(value) when is_integer(value), do: value
  defp normalize_limit(_), do: @default_limit

  defp fetch_runs(limit) do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == @surface)
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> limit(^limit)
    |> Repo.all()
  end

  defp render_report(runs) do
    runs
    |> Enum.map(&render_run/1)
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_run(%ImportRun{} = run) do
    [
      {:run_id, run.id},
      {:status, run.status},
      {:started_at, format_datetime(run.started_at)},
      {:finished_at, format_datetime(run.finished_at)},
      {:cursor_start, run.cursor_start},
      {:cursor_end, run.cursor_end},
      {:pages_requested, run.pages_requested},
      {:pages_fetched, run.pages_fetched},
      {:records_fetched, run.records_fetched},
      {:records_normalized, run.records_normalized},
      {:records_persisted, run.records_persisted},
      {:records_failed, run.records_failed},
      {:error_summary, sanitized_error_summary(run.error_summary)}
    ]
    |> Enum.map(fn {field_name, value} -> "#{field_name}=#{format_value(value)}" end)
    |> Enum.join(" ")
  end

  defp sanitized_error_summary(value) when is_binary(value) do
    if String.trim(value) == "" do
      ""
    else
      "redacted"
    end
  end

  defp sanitized_error_summary(_), do: ""

  defp format_datetime(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp format_datetime(_), do: ""

  defp format_value(value), do: to_string(value)
end
