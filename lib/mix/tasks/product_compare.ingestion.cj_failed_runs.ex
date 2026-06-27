defmodule Mix.Tasks.ProductCompare.Ingestion.CjFailedRuns do
  @moduledoc "Reports failed CJ ingestion runs."

  use Mix.Task

  import Ecto.Query

  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @shortdoc "Reports failed CJ ingestion runs"

  @provider "cj"
  @default_limit 10
  @max_limit 50
  @default_surface "all"
  @shopping_products_surface "shoppingProducts"
  @shopping_product_feeds_surface "shoppingProductFeeds"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    filters = parse_argv(argv)
    {runs, failed_count} = query_runs(filters)

    runs
    |> render_report(filters.surface, failed_count)
    |> IO.write()

    if filters.require_clean and failed_count > 0 do
      Mix.raise("failed CJ ingestion runs found")
    end
  end

  defp parse_argv(argv) do
    opts =
      CliOptions.parse!(argv,
        surface: :string,
        limit: :integer,
        require_clean: :boolean
      )

    %{
      surface: normalize_surface(Keyword.get(opts, :surface)),
      limit: normalize_limit(Keyword.get(opts, :limit)),
      require_clean: Keyword.get(opts, :require_clean, false)
    }
  end

  defp normalize_surface(nil), do: @default_surface

  defp normalize_surface(@shopping_products_surface), do: @shopping_products_surface

  defp normalize_surface(@shopping_product_feeds_surface), do: @shopping_product_feeds_surface

  defp normalize_surface(@default_surface), do: @default_surface

  defp normalize_surface(surface), do: Mix.raise("invalid surface: #{surface}")

  defp normalize_limit(limit) when is_integer(limit) and limit > 0 do
    min(limit, @max_limit)
  end

  defp normalize_limit(nil), do: @default_limit
  defp normalize_limit(_invalid), do: Mix.raise("invalid --limit: expected a positive integer")

  defp query_runs(%{surface: @default_surface, limit: limit}) do
    query =
      ImportRun
      |> where([run], run.provider == @provider)
      |> where([run], run.status == "failed")

    runs =
      query
      |> order_by([run], desc: run.started_at, desc: run.id)
      |> limit(^limit)
      |> Repo.all()

    {runs, Repo.aggregate(query, :count, :id)}
  end

  defp query_runs(%{surface: surface, limit: limit}) do
    query =
      ImportRun
      |> where([run], run.provider == @provider)
      |> where([run], run.status == "failed")
      |> where([run], run.surface == ^surface)

    runs =
      query
      |> order_by([run], desc: run.started_at, desc: run.id)
      |> limit(^limit)
      |> Repo.all()

    {runs, Repo.aggregate(query, :count, :id)}
  end

  defp render_report(runs, surface, failed_count) do
    run_lines = Enum.map(runs, &render_run/1)

    [
      "provider=#{@provider} failed_count=#{failed_count} surface=#{surface}"
      | run_lines
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp render_run(run) do
    [
      {:run_id, run.id},
      {:surface, run.surface},
      {:started_at, format_datetime(run.started_at)},
      {:finished_at, format_datetime(run.finished_at)},
      {:pages_fetched, run.pages_fetched},
      {:records_fetched, run.records_fetched},
      {:records_persisted, run.records_persisted},
      {:records_failed, run.records_failed},
      {:error_summary, sanitized_error_summary(run.error_summary)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp format_datetime(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp format_datetime(_value), do: ""

  defp format_value(nil), do: ""
  defp format_value(value) when is_integer(value), do: Integer.to_string(value)
  defp format_value(value), do: to_string(value)

  defp sanitized_error_summary(value) when is_binary(value) do
    if String.trim(value) == "", do: "", else: "redacted"
  end

  defp sanitized_error_summary(_), do: ""
end
