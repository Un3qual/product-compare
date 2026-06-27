defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportResume do
  @moduledoc "Resumes the latest successful CJ product import cursor."

  use Mix.Task

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport
  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @shortdoc "Resumes the latest CJ product import cursor"
  @default_currency "USD"
  @default_keywords ["shoe"]
  @default_limit 25
  @default_pages 1
  @default_serviceable_areas ["US"]
  @provider "cj"
  @surface "shoppingProducts"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> parse_argv()
    |> run_resume()

    :ok
  end

  @spec run_resume(keyword()) :: {:ok, map()} | {:error, :no_resume_cursor}
  def run_resume(opts) do
    opts = normalize_opts(opts)
    latest_run = latest_success!()

    case latest_run.cursor_end do
      nil ->
        handle_missing_cursor!(opts)

      _cursor ->
        resume_run!(latest_run, opts)
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
      pages: CliOptions.positive_integer!(Keyword.get(opts, :pages), @default_pages, "--pages"),
      require_cursor: Keyword.get(opts, :require_cursor, false)
    ]
  end

  defp normalize_opts(opts) do
    [
      limit: positive_integer_or_nil(Keyword.get(opts, :limit)),
      pages: positive_integer(Keyword.get(opts, :pages), @default_pages),
      require_cursor: Keyword.get(opts, :require_cursor, false),
      runner: Keyword.get(opts, :runner, &CjImport.run_import/1)
    ]
  end

  defp positive_integer(value, _default) when is_integer(value) and value > 0, do: value
  defp positive_integer(_value, default), do: default

  defp positive_integer_or_nil(value) when is_integer(value) and value > 0, do: value
  defp positive_integer_or_nil(_value), do: nil

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
      nil -> Mix.raise("no successful CJ product import found")
    end
  end

  defp handle_missing_cursor!(opts) do
    if Keyword.fetch!(opts, :require_cursor) do
      Mix.raise("latest successful CJ product import has no cursor to resume")
    end

    IO.puts("provider=#{@provider} surface=#{@surface} resumable=false")
    {:error, :no_resume_cursor}
  end

  defp resume_run!(%ImportRun{} = latest_run, opts) do
    runner_opts = runner_opts(latest_run, opts)
    runner = Keyword.fetch!(opts, :runner)

    case run_runner(runner, runner_opts) do
      {:ok, report} ->
        IO.puts(render_success(runner_opts, report))
        {:ok, report}

      _error ->
        Mix.raise("CJ product import resume failed")
    end
  end

  defp runner_opts(%ImportRun{} = latest_run, opts) do
    query = latest_run.query || %{}

    [
      cursor: latest_run.cursor_end,
      keywords: query_keywords(query),
      currency: query_currency(query),
      serviceable_areas: query_serviceable_areas(query),
      limit:
        Keyword.fetch!(opts, :limit) ||
          CliOptions.positive_integer_or_default(latest_run.page_size, @default_limit),
      pages: Keyword.fetch!(opts, :pages),
      print_report: false
    ]
  end

  defp query_keywords(%{} = query) do
    case Map.get(query, "keywords") do
      [_first | _rest] = keywords -> keywords
      value when is_binary(value) -> [value]
      _value -> @default_keywords
    end
  end

  defp query_currency(%{} = query) do
    case Map.get(query, "currency") do
      value when is_binary(value) and value != "" -> value
      _value -> @default_currency
    end
  end

  defp query_serviceable_areas(%{} = query) do
    case Map.get(query, "serviceableAreas") do
      [_first | _rest] = areas -> areas
      value when is_binary(value) -> [value]
      _value -> @default_serviceable_areas
    end
  end

  defp run_runner(runner, runner_opts) do
    runner.(runner_opts)
  rescue
    _exception -> {:error, :runner_exception}
  catch
    _kind, _reason -> {:error, :runner_exception}
  end

  defp render_success(runner_opts, report) do
    [
      {:provider, @provider},
      {:surface, @surface},
      {:cursor_start, Keyword.fetch!(runner_opts, :cursor)},
      {:pages_requested, Keyword.fetch!(runner_opts, :pages)},
      {:limit, Keyword.fetch!(runner_opts, :limit)},
      {:fetched, report_value(report, :fetched, 0)},
      {:normalized, report_value(report, :normalized, 0)},
      {:persisted, report_value(report, :persisted, 0)},
      {:failed, report_value(report, :failed, 0)},
      {:next_cursor, report_value(report, :next_cursor, nil)}
    ]
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join(" ")
  end

  defp report_value(report, key, default) when is_map(report) do
    Map.get(report, key, Map.get(report, Atom.to_string(key), default))
  end

  defp report_value(_report, _key, default), do: default

  defp format_value(nil), do: ""
  defp format_value(value), do: to_string(value)
end
