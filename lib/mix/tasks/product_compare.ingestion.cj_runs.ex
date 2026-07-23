defmodule Mix.Tasks.ProductCompare.Ingestion.CjRuns do
  @moduledoc "Reports and resumes CJ ingestion runs from one operator task."

  use Mix.Task
  require Logger

  import Ecto.Query

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport
  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.Options
  alias ProductCompare.Ingestion.CJFeedDiscovery
  alias ProductCompare.Ingestion.CJRunReadiness
  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompare.MixTasks.RepoOnlyStartup
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @shortdoc "Reports or resumes CJ ingestion runs"
  @provider "cj"
  @import_surface "shoppingProducts"
  @discovery_surface "shoppingProductFeeds"
  @default_import_limit 25
  @default_discovery_limit 25
  @default_keywords ["shoe"]
  @default_currency "USD"
  @default_serviceable_areas ["US"]

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    opts = parse_argv(argv)

    if Keyword.fetch!(opts, :resume) do
      run_resume(opts)
    else
      run_report(opts)
    end

    :ok
  end

  @spec run_report(keyword()) :: :ok
  def run_report(opts) do
    opts = normalize_report_opts(opts)

    case Keyword.fetch!(opts, :report) do
      "latest" -> print_latest(opts)
      "history" -> print_history(opts)
      "failed" -> print_failed(opts)
    end
  end

  @spec run_resume(keyword()) :: {:ok, map()} | {:error, :no_resume_cursor} | :ok
  def run_resume(opts) do
    opts = normalize_resume_opts(opts)
    surface = Keyword.fetch!(opts, :surface)
    latest_run = latest_success!(surface)

    case latest_run.cursor_end do
      nil -> handle_missing_cursor!(opts)
      _cursor -> resume_run!(latest_run, opts)
    end
  end

  defp parse_argv(argv), do: Options.parse_argv(argv)
  defp normalize_report_opts(opts), do: Options.normalize_report_opts(opts)
  defp normalize_resume_opts(opts), do: Options.normalize_resume_opts(opts)

  defp print_latest(opts) do
    surface = Keyword.fetch!(opts, :surface)
    latest_run = latest_run(surface)
    latest_success = CJRunReadiness.latest_success(surface)
    fresh = CJRunReadiness.fresh?(latest_success, Keyword.fetch!(opts, :max_age_hours))

    enforce_required_success!(
      surface,
      latest_success,
      fresh,
      Keyword.fetch!(opts, :require_success)
    )

    [
      {:provider, @provider},
      {:surface, surface},
      {:report, "latest"},
      {:latest_status, field(latest_run, :status)},
      {:latest_started_at, field(latest_run, :started_at)},
      {:latest_finished_at, field(latest_run, :finished_at)},
      {:latest_pages_fetched, field(latest_run, :pages_fetched)},
      {:latest_records_fetched, field(latest_run, :records_fetched)},
      {:latest_records_normalized, field(latest_run, :records_normalized)},
      {:latest_records_persisted, field(latest_run, :records_persisted)},
      {:latest_records_failed, field(latest_run, :records_failed)},
      {:latest_error_summary, sanitized_error_summary(latest_run)},
      {:latest_success_status, field(latest_success, :status)},
      {:latest_success_finished_at, field(latest_success, :finished_at)},
      {:fresh, fresh}
    ]
    |> maybe_add_candidate_count(surface)
    |> render_key_value_lines()
    |> IO.write()
  end

  defp enforce_required_success!(_surface, _latest_success, _fresh, false), do: :ok

  defp enforce_required_success!(surface, nil, _fresh, true) do
    Mix.raise("no successful CJ #{surface_label(surface)} found")
  end

  defp enforce_required_success!(surface, %ImportRun{}, false, true) do
    Mix.raise("latest successful CJ #{surface_label(surface)} is stale")
  end

  defp enforce_required_success!(_surface, %ImportRun{}, true, true), do: :ok

  defp surface_label(@import_surface), do: "product import"
  defp surface_label(@discovery_surface), do: "feed discovery run"

  defp print_history(opts) do
    surface = Keyword.fetch!(opts, :surface)
    limit = Keyword.fetch!(opts, :limit)
    runs = history_runs(surface, limit)

    header =
      [
        {:provider, @provider},
        {:surface, surface},
        {:report, "history"},
        {:count, length(runs)}
      ]
      |> maybe_add_candidate_count(surface)
      |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)

    ([header] ++ Enum.map(runs, &render_run/1))
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()
  end

  defp print_failed(opts) do
    surface = Keyword.fetch!(opts, :surface)
    limit = Keyword.fetch!(opts, :limit)
    {runs, failed_count} = failed_runs(surface, limit)

    [
      "provider=#{@provider} failed_count=#{failed_count} surface=#{surface}"
      | Enum.map(runs, &render_run/1)
    ]
    |> Enum.join("\n")
    |> Kernel.<>("\n")
    |> IO.write()

    if Keyword.fetch!(opts, :require_clean) and failed_count > 0 do
      Mix.raise("failed CJ ingestion runs found")
    end

    :ok
  end

  defp latest_run(surface) do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == ^surface)
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> limit(1)
    |> Repo.one()
  end

  defp latest_success!(surface) do
    CJRunReadiness.latest_success(surface) ||
      Mix.raise("no successful CJ #{surface_label(surface)} found")
  end

  defp history_runs(surface, limit) do
    ImportRun
    |> where([run], run.provider == @provider)
    |> where([run], run.surface == ^surface)
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> limit(^limit)
    |> Repo.all()
  end

  defp failed_runs("all", limit) do
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

  defp failed_runs(surface, limit) do
    query =
      ImportRun
      |> where([run], run.provider == @provider)
      |> where([run], run.surface == ^surface)
      |> where([run], run.status == "failed")

    runs =
      query
      |> order_by([run], desc: run.started_at, desc: run.id)
      |> limit(^limit)
      |> Repo.all()

    {runs, Repo.aggregate(query, :count, :id)}
  end

  defp resume_run!(%ImportRun{} = latest_run, opts) do
    case Keyword.fetch!(opts, :surface) do
      @import_surface -> resume_import!(latest_run, opts)
      @discovery_surface -> resume_discovery!(latest_run, opts)
    end
  end

  defp resume_import!(latest_run, opts) do
    runner_opts = import_runner_opts(latest_run, opts)
    runner = Keyword.fetch!(opts, :runner) || (&CjImport.run_import/1)

    case safe_run(runner, runner_opts) do
      {:ok, report} ->
        render_import_resume(runner_opts, report) |> IO.puts()
        {:ok, report}

      _error ->
        Mix.raise("CJ product import resume failed")
    end
  end

  defp resume_discovery!(latest_run, opts) do
    runner_opts = discovery_runner_opts(latest_run, opts)
    runner = Keyword.fetch!(opts, :runner) || (&CJFeedDiscovery.run/1)

    case safe_run(runner, runner_opts) do
      {:ok, report} ->
        render_discovery_resume(runner_opts, report) |> IO.puts()
        {:ok, report}

      _error ->
        Mix.raise("CJ feed discovery resume failed")
    end
  end

  defp safe_run(runner, runner_opts) do
    runner.(runner_opts)
  rescue
    exception ->
      log_runner_failure(:error, exception, __STACKTRACE__, runner_opts)
      {:error, :runner_exception}
  catch
    kind, reason ->
      log_runner_failure(kind, reason, __STACKTRACE__, runner_opts)
      {:error, :runner_exception}
  end

  defp handle_missing_cursor!(opts) do
    surface = Keyword.fetch!(opts, :surface)

    if Keyword.fetch!(opts, :require_cursor) do
      Mix.raise("latest successful CJ #{surface_label(surface)} has no cursor to resume")
    end

    IO.puts("provider=#{@provider} surface=#{surface} resumable=false")
    {:error, :no_resume_cursor}
  end

  defp import_runner_opts(%ImportRun{} = latest_run, opts) do
    query = latest_run.query || %{}

    [
      cursor: latest_run.cursor_end,
      keywords: query_keywords(query),
      currency: query_currency(query),
      serviceable_areas: query_serviceable_areas(query),
      ad_ids: query_ids(query, "adIds") || query_ids(query, "providerFeedId"),
      partner_ids: query_ids(query, "partnerIds") || query_ids(query, "advertiserIds"),
      provider_feed_id: query_value(query, "providerFeedId"),
      merchant_feed_candidate_id: query_value(query, "merchantFeedCandidateId"),
      feed_name: query_value(query, "feedName"),
      limit:
        Keyword.fetch!(opts, :limit) ||
          CliOptions.positive_integer_or_default(latest_run.page_size, @default_import_limit),
      pages: Keyword.fetch!(opts, :pages),
      print_report: false
    ]
  end

  defp discovery_runner_opts(%ImportRun{} = latest_run, opts) do
    [
      cursor: latest_run.cursor_end,
      advertiser_country: advertiser_country(latest_run),
      limit:
        Keyword.fetch!(opts, :limit) ||
          CliOptions.positive_integer_or_default(latest_run.page_size, @default_discovery_limit),
      pages: Keyword.fetch!(opts, :pages)
    ]
  end

  defp query_keywords(%{} = query) do
    case Map.fetch(query, "keywords") do
      {:ok, nil} -> nil
      {:ok, []} -> []
      {:ok, [_first | _rest] = keywords} -> keywords
      {:ok, value} when is_binary(value) -> [value]
      :error -> @default_keywords
      {:ok, _value} -> @default_keywords
    end
  end

  defp query_ids(%{} = query, key) do
    case Map.get(query, key) do
      [_first | _rest] = keywords -> keywords
      [] -> []
      value when is_binary(value) -> [value]
      _value -> nil
    end
  end

  defp query_value(%{} = query, key), do: Map.get(query, key)

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

  defp advertiser_country(%ImportRun{query: query}) when is_map(query) do
    Map.get(query, "advertiserCountry") || "US"
  end

  defp log_runner_failure(kind, reason, stacktrace, runner_opts) do
    surface = runner_surface(runner_opts)

    Logger.error(fn ->
      "CJ #{runner_label(surface)} resume runner failed " <>
        runner_context(surface, runner_opts) <>
        "\n" <>
        Exception.format(kind, reason, stacktrace)
    end)
  end

  defp runner_surface(runner_opts) do
    if Keyword.has_key?(runner_opts, :advertiser_country) do
      @discovery_surface
    else
      @import_surface
    end
  end

  defp runner_label(@import_surface), do: "import"
  defp runner_label(@discovery_surface), do: "discovery"

  defp runner_context(@import_surface, runner_opts) do
    [
      {:surface, @import_surface},
      {:cursor, Keyword.get(runner_opts, :cursor)},
      {:limit, Keyword.get(runner_opts, :limit)},
      {:pages, Keyword.get(runner_opts, :pages)},
      {:keywords_count, value_count(Keyword.get(runner_opts, :keywords))},
      {:serviceable_areas_count, value_count(Keyword.get(runner_opts, :serviceable_areas))},
      {:ad_ids_count, value_count(Keyword.get(runner_opts, :ad_ids))},
      {:partner_ids_count, value_count(Keyword.get(runner_opts, :partner_ids))},
      {:has_provider_feed_id, present?(Keyword.get(runner_opts, :provider_feed_id))},
      {:has_merchant_feed_candidate_id,
       present?(Keyword.get(runner_opts, :merchant_feed_candidate_id))},
      {:has_feed_name, present?(Keyword.get(runner_opts, :feed_name))}
    ]
    |> format_runner_context()
  end

  defp runner_context(@discovery_surface, runner_opts) do
    [
      {:surface, @discovery_surface},
      {:advertiser_country, Keyword.get(runner_opts, :advertiser_country)},
      {:cursor, Keyword.get(runner_opts, :cursor)},
      {:limit, Keyword.get(runner_opts, :limit)},
      {:pages, Keyword.get(runner_opts, :pages)}
    ]
    |> format_runner_context()
  end

  defp value_count(nil), do: 0
  defp value_count(values) when is_list(values), do: length(values)
  defp value_count(_value), do: 1

  defp present?(nil), do: false
  defp present?(""), do: false
  defp present?([]), do: false
  defp present?(_value), do: true

  defp format_runner_context(fields) do
    fields
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp render_import_resume(runner_opts, report) do
    [
      {:provider, @provider},
      {:surface, @import_surface},
      {:cursor_start, Keyword.fetch!(runner_opts, :cursor)},
      {:pages_requested, Keyword.fetch!(runner_opts, :pages)},
      {:limit, Keyword.fetch!(runner_opts, :limit)},
      {:fetched, report_value(report, :fetched, 0)},
      {:normalized, report_value(report, :normalized, 0)},
      {:persisted, report_value(report, :persisted, 0)},
      {:failed, report_value(report, :failed, 0)},
      {:next_cursor, report_value(report, :next_cursor, nil)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp render_discovery_resume(runner_opts, report) do
    [
      {:provider, @provider},
      {:surface, @discovery_surface},
      {:cursor_start, Keyword.fetch!(runner_opts, :cursor)},
      {:pages_requested, Keyword.fetch!(runner_opts, :pages)},
      {:limit, Keyword.fetch!(runner_opts, :limit)},
      {:feeds_fetched, report_value(report, :feeds_fetched, 0)},
      {:candidates_persisted, report_value(report, :candidates_persisted, 0)},
      {:failed, report_value(report, :failed, 0)},
      {:next_cursor, report_value(report, :next_cursor, nil)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp render_run(%ImportRun{} = run) do
    [
      {:run_id, run.id},
      {:surface, run.surface},
      {:status, run.status},
      {:started_at, run.started_at},
      {:finished_at, run.finished_at},
      {:cursor_start, run.cursor_start},
      {:cursor_end, run.cursor_end},
      {:pages_requested, run.pages_requested},
      {:pages_fetched, run.pages_fetched},
      {:records_fetched, run.records_fetched},
      {:records_normalized, run.records_normalized},
      {:records_persisted, run.records_persisted},
      {:records_failed, run.records_failed},
      {:error_summary, sanitized_error_summary(run)}
    ]
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{format_value(value)}" end)
  end

  defp maybe_add_candidate_count(fields, @discovery_surface),
    do: fields ++ [{:candidate_count, candidate_count()}]

  defp maybe_add_candidate_count(fields, _surface), do: fields

  defp candidate_count do
    MerchantFeedCandidate
    |> where([candidate], candidate.provider == @provider)
    |> Repo.aggregate(:count, :id)
  end

  defp field(nil, _field), do: nil
  defp field(struct, field), do: Map.fetch!(struct, field)

  defp sanitized_error_summary(nil), do: nil

  defp sanitized_error_summary(%ImportRun{error_summary: error_summary})
       when is_binary(error_summary) do
    if String.trim(error_summary) == "", do: nil, else: "redacted"
  end

  defp sanitized_error_summary(%ImportRun{}), do: nil

  defp render_key_value_lines(fields) do
    fields
    |> Enum.map(fn {key, value} -> "#{key}=#{format_value(value)}" end)
    |> Enum.join("\n")
    |> Kernel.<>("\n")
  end

  defp report_value(report, key, default) when is_map(report) do
    Map.get(report, key, Map.get(report, Atom.to_string(key), default))
  end

  defp report_value(_report, _key, default), do: default

  defp format_value(nil), do: ""
  defp format_value(%DateTime{} = value), do: DateTime.to_iso8601(value)
  defp format_value(value) when is_boolean(value), do: to_string(value)
  defp format_value(value) when is_integer(value), do: Integer.to_string(value)
  defp format_value(value) when is_binary(value), do: String.replace(value, ~r/[\r\n]+/, " ")
  defp format_value(value), do: to_string(value)
end
