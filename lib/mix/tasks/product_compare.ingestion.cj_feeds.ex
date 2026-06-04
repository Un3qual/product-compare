defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeeds do
  @moduledoc """
  Manually discovers CJ shopping product feeds.
  """

  use Mix.Task

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.Sources.CJ.Client
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  @shortdoc "Discovers manual CJ shopping product feeds"

  @impl Mix.Task
  def run(argv) do
    Mix.Task.run("app.start")

    argv
    |> parse_argv()
    |> run_discovery()
    |> case do
      {:ok, _report} -> :ok
      {:error, reason} -> Mix.raise("CJ feed discovery failed: #{inspect(reason)}")
    end
  end

  @spec run_discovery(keyword()) :: {:ok, map()} | {:error, term()}
  def run_discovery(opts) do
    with_quiet_logger(fn ->
      do_run_discovery(opts)
    end)
  end

  defp do_run_discovery(opts) do
    fetcher = Keyword.get(opts, :fetcher, &Client.fetch_feeds/2)
    cursor = Keyword.get(opts, :cursor)
    fetch_opts = fetch_opts(opts)
    pages = Keyword.get(opts, :pages, 1)

    with {:ok, source} <- fetch_source(),
         {:ok, import_run} <- start_import_run(source, cursor, fetch_opts, pages) do
      case fetch_pages(fetcher, cursor, fetch_opts, pages) do
        {:ok, report, next_cursor} ->
          with {:ok, _completed_run} <- complete_import_run(import_run, report, next_cursor) do
            print_report(report)

            {:ok, report}
          end

        {:error, reason} ->
          _completed_run =
            Ingestion.complete_import_run(import_run, %{
              error_summary: inspect(reason),
              status: "failed"
            })

          {:error, reason}
      end
    end
  end

  defp with_quiet_logger(fun) do
    original_level = Logger.level()
    Logger.configure(level: :warning)

    try do
      fun.()
    after
      Logger.configure(level: original_level)
    end
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

  defp fetch_opts(opts) do
    [
      advertiser_country: Keyword.get(opts, :advertiser_country, "US"),
      limit: Keyword.get(opts, :limit, 25)
    ]
  end

  defp start_import_run(source, cursor, fetch_opts, pages) do
    Ingestion.start_import_run(%{
      source_id: source.id,
      provider: "cj",
      surface: "shoppingProductFeeds",
      query: %{"advertiserCountry" => Keyword.fetch!(fetch_opts, :advertiser_country)},
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
      records_fetched: report.feeds_fetched,
      records_normalized: 0,
      records_persisted: 0,
      records_failed: report.failed
    })
  end

  defp fetch_pages(fetcher, cursor, fetch_opts, pages) do
    Enum.reduce_while(1..pages, {:ok, initial_report(), cursor}, fn _page,
                                                                    {:ok, report, current_cursor} ->
      case fetcher.(current_cursor, fetch_opts) do
        {:ok, feeds, next_cursor} ->
          report =
            report
            |> Map.update!(:feeds_fetched, &(&1 + length(feeds)))
            |> Map.update!(:pages_fetched, &(&1 + 1))

          if is_nil(next_cursor) do
            {:halt, {:ok, report, next_cursor}}
          else
            {:cont, {:ok, report, next_cursor}}
          end

        {:error, reason} ->
          {:halt, {:error, reason}}
      end
    end)
  end

  defp initial_report do
    %{
      failed: 0,
      feeds_fetched: 0,
      pages_fetched: 0
    }
  end

  defp fetch_source do
    case Repo.get_by(Source, name: "CJ", domain: "cj.com") do
      %Source{} = source ->
        {:ok, source}

      nil ->
        %Source{}
        |> Source.changeset(%{kind: "affiliate_feed", name: "CJ", domain: "cj.com"})
        |> Repo.insert()
    end
  end

  defp print_report(report) do
    IO.puts(
      "feeds_fetched=#{report.feeds_fetched} pages_fetched=#{report.pages_fetched} failed=#{report.failed}"
    )
  end
end
