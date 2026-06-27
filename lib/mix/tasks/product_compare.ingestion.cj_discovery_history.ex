defmodule Mix.Tasks.ProductCompare.Ingestion.CjDiscoveryHistory do
  @moduledoc "Reports recent CJ feed discovery runs."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @shortdoc "Reports recent CJ feed discovery runs"
  @default_limit 10
  @min_limit 1
  @max_limit 50
  @provider "cj"
  @surface "shoppingProductFeeds"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> parse_argv()
    |> query_runs()
    |> render_lines()
    |> IO.write()
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          limit: :integer
        ]
      )

    normalize_limit(Keyword.get(opts, :limit))
  end

  defp normalize_limit(limit) when is_integer(limit) and limit < @min_limit, do: @min_limit
  defp normalize_limit(limit) when is_integer(limit) and limit > @max_limit, do: @max_limit
  defp normalize_limit(limit) when is_integer(limit), do: limit
  defp normalize_limit(_invalid), do: @default_limit

  defp query_runs(limit) do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == @surface)
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> limit(^limit)
    |> Repo.all()
  end

  defp render_lines(runs) do
    runs
    |> Enum.map(fn run ->
      [
        {:run_id, run.id},
        {:status, run.status},
        {:started_at, run.started_at},
        {:finished_at, run.finished_at},
        {:cursor_start, run.cursor_start},
        {:cursor_end, run.cursor_end},
        {:pages_requested, run.pages_requested},
        {:pages_fetched, run.pages_fetched},
        {:records_fetched, run.records_fetched},
        {:records_persisted, run.records_persisted},
        {:records_failed, run.records_failed},
        {:error_summary, sanitized_error_summary(run.error_summary)}
      ]
      |> Enum.map_join(" ", fn {key, value} ->
        "#{key}=#{format_value(value)}"
      end)
    end)
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp sanitized_error_summary(nil), do: ""

  defp sanitized_error_summary(error_summary) when is_binary(error_summary) do
    if String.trim(error_summary) == "", do: "", else: "redacted"
  end

  defp sanitized_error_summary(_error_summary), do: ""

  defp format_value(nil), do: ""
  defp format_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp format_value(value), do: to_string(value)
end
