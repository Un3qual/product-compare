defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeedsResume do
  @moduledoc "Resumes CJ shopping product feed discovery from the latest stored cursor."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.Ingestion.CJFeedDiscovery
  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @shortdoc "Resumes the latest CJ feed discovery cursor"
  @default_limit 25
  @provider "cj"
  @surface "shoppingProductFeeds"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> parse_argv()
    |> run_resume()
  end

  @spec run_resume(keyword()) :: :ok
  def run_resume(opts) do
    opts = normalize_opts(opts)
    latest_run = latest_success!()

    if is_nil(latest_run.cursor_end) do
      handle_missing_cursor(opts)
    else
      latest_run
      |> runner_opts(opts)
      |> run_discovery(opts)
      |> render_report(latest_run, opts)
      |> IO.puts()
    end
  end

  defp parse_argv(argv) do
    opts =
      CliOptions.parse!(argv,
        limit: :integer,
        pages: :integer,
        require_cursor: :boolean
      )

    [
      limit: CliOptions.optional_positive_integer!(Keyword.get(opts, :limit), "--limit"),
      pages: CliOptions.positive_integer!(Keyword.get(opts, :pages), 1, "--pages"),
      require_cursor: Keyword.get(opts, :require_cursor, false)
    ]
  end

  defp normalize_opts(opts) do
    opts
    |> Keyword.put(:pages, positive_integer(Keyword.get(opts, :pages), 1))
    |> Keyword.put(:limit, positive_integer(Keyword.get(opts, :limit), nil))
    |> Keyword.put_new(:require_cursor, false)
    |> Keyword.put_new(:runner, &CJFeedDiscovery.run/1)
  end

  defp positive_integer(value, _default) when is_integer(value) and value > 0, do: value
  defp positive_integer(_value, default), do: default

  defp latest_success! do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == @surface)
    |> where([run], run.status == "succeeded")
    |> order_by([run], desc_nulls_last: run.finished_at, desc: run.started_at, desc: run.id)
    |> limit(1)
    |> Repo.one()
    |> case do
      %ImportRun{} = run -> run
      nil -> Mix.raise("no successful CJ feed discovery run found")
    end
  end

  defp handle_missing_cursor(opts) do
    if Keyword.get(opts, :require_cursor, false) do
      Mix.raise("latest successful CJ feed discovery has no cursor to resume")
    else
      IO.puts("provider=#{@provider} surface=#{@surface} resumable=false")
    end
  end

  defp runner_opts(latest_run, opts) do
    [
      cursor: latest_run.cursor_end,
      advertiser_country: advertiser_country(latest_run),
      limit:
        Keyword.get(opts, :limit) ||
          CliOptions.positive_integer_or_default(latest_run.page_size, @default_limit),
      pages: Keyword.fetch!(opts, :pages)
    ]
  end

  defp advertiser_country(%ImportRun{query: query}) when is_map(query) do
    Map.get(query, "advertiserCountry") || "US"
  end

  defp advertiser_country(%ImportRun{}), do: "US"

  defp run_discovery(runner_opts, opts) do
    opts
    |> Keyword.fetch!(:runner)
    |> then(fn runner -> runner.(runner_opts) end)
    |> case do
      {:ok, report} -> report
      {:error, _reason} -> Mix.raise("CJ feed discovery resume failed")
    end
  rescue
    _exception -> Mix.raise("CJ feed discovery resume failed")
  catch
    _kind, _reason -> Mix.raise("CJ feed discovery resume failed")
  end

  defp render_report(report, latest_run, opts) do
    fields = [
      {:provider, @provider},
      {:surface, @surface},
      {:cursor_start, latest_run.cursor_end},
      {:pages_requested, Keyword.fetch!(opts, :pages)},
      {:limit,
       Keyword.get(opts, :limit) ||
         CliOptions.positive_integer_or_default(latest_run.page_size, @default_limit)},
      {:feeds_fetched, Map.get(report, :feeds_fetched, 0)},
      {:candidates_persisted, Map.get(report, :candidates_persisted, 0)},
      {:failed, Map.get(report, :failed, 0)},
      {:next_cursor, Map.get(report, :next_cursor)}
    ]

    Enum.map_join(fields, " ", fn {key, value} ->
      "#{key}=#{format_value(value)}"
    end)
  end

  defp format_value(nil), do: ""
  defp format_value(value) when is_integer(value), do: Integer.to_string(value)
  defp format_value(value) when is_binary(value), do: value
  defp format_value(value), do: to_string(value)
end
