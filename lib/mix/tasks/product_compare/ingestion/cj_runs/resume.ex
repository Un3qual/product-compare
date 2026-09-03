defmodule Mix.Tasks.ProductCompare.Ingestion.CjRuns.Resume do
  @moduledoc false

  require Logger

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport
  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.ValueFormatter
  alias ProductCompare.Ingestion.CJFeedDiscovery
  alias ProductCompare.Ingestion.CJFailureDiagnostics
  alias ProductCompare.Ingestion.CJRunReadiness
  alias ProductCompare.MixTasks.CliOptions
  alias ProductCompareSchemas.Ingestion.ImportRun

  @provider "cj"
  @import_surface "shoppingProducts"
  @discovery_surface "shoppingProductFeeds"
  @default_import_limit 25
  @default_discovery_limit 25
  @default_keywords ["shoe"]
  @default_currency "USD"
  @default_serviceable_areas ["US"]

  @spec run_resume(keyword()) :: {:ok, map()} | {:error, :no_resume_cursor} | :ok
  def run_resume(opts) do
    opts = Options.normalize_resume_opts(opts)
    surface = Keyword.fetch!(opts, :surface)
    latest_run = latest_success!(surface)

    case latest_run.cursor_end do
      nil -> handle_missing_cursor!(opts)
      _cursor -> resume_run!(latest_run, opts)
    end
  end

  defp latest_success!(surface) do
    CJRunReadiness.latest_success(surface) ||
      Mix.raise("no successful CJ #{surface_label(surface)} found")
  end

  defp surface_label(@import_surface), do: "product import"
  defp surface_label(@discovery_surface), do: "feed discovery run"

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

  defp advertiser_country(%ImportRun{query: query}) do
    Map.get(query, "advertiserCountry") || "US"
  end

  defp log_runner_failure(kind, reason, stacktrace, runner_opts) do
    surface = runner_surface(runner_opts)

    Logger.error(fn ->
      "CJ #{runner_label(surface)} resume runner failed " <>
        runner_context(surface, runner_opts) <>
        " kind=#{kind} reason=#{CJFailureDiagnostics.category(reason)}\n" <>
        Exception.format_stacktrace(CJFailureDiagnostics.sanitize_stacktrace(stacktrace))
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
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{ValueFormatter.format(value)}" end)
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
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{ValueFormatter.format(value)}" end)
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
    |> Enum.map_join(" ", fn {key, value} -> "#{key}=#{ValueFormatter.format(value)}" end)
  end

  defp report_value(report, key, default) when is_map(report) do
    Map.get(report, key, Map.get(report, Atom.to_string(key), default))
  end

  defp report_value(_report, _key, default), do: default
end
