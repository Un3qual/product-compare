defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeeds do
  @moduledoc """
  Manually discovers CJ shopping product feeds.
  """

  use Mix.Task

  alias ProductCompare.Ingestion.CJFeedDiscovery

  @shortdoc "Discovers manual CJ shopping product feeds"

  @impl Mix.Task
  def run(argv) do
    Mix.Task.run("app.start")

    argv
    |> parse_argv()
    |> runner().()
    |> case do
      {:ok, report} ->
        print_report(report)
        :ok

      {:error, {:row_failures, report} = reason} ->
        print_report(report)
        Mix.raise("CJ feed discovery failed: #{inspect(reason)}")

      {:error, reason} ->
        Mix.raise("CJ feed discovery failed: #{inspect(reason)}")
    end
  end

  @spec run_discovery(keyword()) :: {:ok, map()} | {:error, term()}
  def run_discovery(opts) do
    opts
    |> CJFeedDiscovery.run()
    |> tap(fn
      {:ok, report} -> print_report(report)
      {:error, {:row_failures, report}} -> print_report(report)
      {:error, _reason} -> :ok
    end)
  end

  defp parse_argv(argv) do
    {opts, _args, _invalid} =
      OptionParser.parse(argv,
        switches: [
          advertiser_country: :string,
          limit: :integer,
          offset: :integer,
          pages: :integer
        ]
      )

    opts
    |> Keyword.put_new(:advertiser_country, "US")
    |> Keyword.put_new(:limit, 25)
    |> Keyword.put_new(:pages, 1)
    |> Keyword.put_new(:cursor, Keyword.get(opts, :offset))
  end

  defp print_report(report) do
    IO.puts(
      "feeds_fetched=#{report.feeds_fetched} candidates_persisted=#{report.candidates_persisted} pages_fetched=#{report.pages_fetched} failed=#{report.failed}"
    )
  end

  defp runner do
    Application.get_env(:product_compare, :cj_feed_discovery_runner, &CJFeedDiscovery.run/1)
  end
end
