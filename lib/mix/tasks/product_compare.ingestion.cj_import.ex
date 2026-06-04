defmodule Mix.Tasks.ProductCompare.Ingestion.CjImport do
  @moduledoc """
  Manually imports one page of CJ shopping products.
  """

  use Mix.Task

  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.Sources.CJ.ProductParser
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  @shortdoc "Imports one manual CJ shopping product page"

  @impl Mix.Task
  def run(argv) do
    Mix.Task.run("app.start")

    argv
    |> parse_argv()
    |> run_import()
    |> case do
      {:ok, _report} -> :ok
      {:error, reason} -> Mix.raise("CJ import failed: #{inspect(reason)}")
    end
  end

  @spec run_import(keyword()) :: {:ok, map()} | {:error, term()}
  def run_import(opts) do
    fetcher = Keyword.get(opts, :fetcher, &ProductParser.fetch_batch/2)
    cursor = Keyword.get(opts, :cursor)
    fetch_opts = fetch_opts(opts)

    with {:ok, records, _next_cursor} <- fetcher.(cursor, fetch_opts),
         {:ok, source} <- fetch_source() do
      report = persist_records(source, records)
      print_report(report)

      {:ok, report}
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
          serviceable_area: :string
        ]
      )

    opts
    |> Keyword.update(:keywords, ["shoe"], &parse_keywords/1)
    |> Keyword.put_new(:limit, 25)
    |> Keyword.put_new(:cursor, Keyword.get(opts, :offset))
    |> Keyword.put_new(:currency, "USD")
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
      serviceable_areas: Keyword.get(opts, :serviceable_areas, "US")
    ]
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

  defp print_report(report) do
    IO.puts(
      "fetched=#{report.fetched} normalized=#{report.normalized} persisted=#{report.persisted} failed=#{report.failed}"
    )
  end
end
