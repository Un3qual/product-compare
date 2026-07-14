defmodule ProductCompare.Ingestion.CJProductImportScheduler do
  @moduledoc """
  Periodically runs bounded CJ shopping product imports.
  """

  use GenServer

  require Logger

  alias ProductCompare.Ingestion.Jobs.CJProductImportWorker
  alias ProductCompare.Ingestion.OptionNormalization
  alias ProductCompare.Ingestion.ScheduledCursor

  @default_currency "USD"
  @default_initial_delay_ms 60_000
  @default_interval_ms 86_400_000
  @default_keywords ["shoe"]
  @default_limit 25
  @default_pages 1
  @default_serviceable_areas ["US"]

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts) do
    genserver_opts =
      case Keyword.get(opts, :name) do
        nil -> []
        name -> [name: name]
      end

    GenServer.start_link(__MODULE__, opts, genserver_opts)
  end

  @impl GenServer
  def init(opts) do
    state = %{
      complete_scope: Keyword.get(opts, :complete_scope, false) == true,
      currency: uppercase_string_option(opts, :currency, @default_currency),
      cursor: OptionNormalization.non_negative_integer_option(opts, :cursor, nil),
      cursor_resolver: Keyword.get(opts, :cursor_resolver, &ScheduledCursor.product/1),
      initial_delay_ms:
        OptionNormalization.non_negative_integer_option(
          opts,
          :initial_delay_ms,
          @default_initial_delay_ms
        ),
      interval_ms:
        OptionNormalization.positive_integer_option(opts, :interval_ms, @default_interval_ms),
      keywords: keywords_option(opts),
      limit: OptionNormalization.positive_integer_option(opts, :limit, @default_limit),
      pages: OptionNormalization.positive_integer_option(opts, :pages, @default_pages),
      enqueuer:
        Keyword.get(opts, :enqueuer, Keyword.get(opts, :runner, &CJProductImportWorker.enqueue/1)),
      serviceable_areas: serviceable_areas_option(opts)
    }

    schedule_run(state.initial_delay_ms)

    {:ok, state}
  end

  @impl GenServer
  def handle_info(:run_import, state) do
    opts = resolve_cursor(import_opts(state), state.cursor_resolver, state.cursor)

    result = run_import(state.enqueuer, opts)

    log_result(result, opts)

    state = %{state | cursor: opts[:cursor]}

    schedule_run(state.interval_ms)

    {:noreply, state}
  end

  defp import_opts(state) do
    opts = [
      currency: state.currency,
      keywords: state.keywords,
      limit: state.limit,
      pages: state.pages,
      serviceable_areas: state.serviceable_areas,
      cursor: state.cursor
    ]

    if state.complete_scope, do: Keyword.put(opts, :complete_scope, true), else: opts
  end

  defp schedule_run(delay_ms) do
    Process.send_after(self(), :run_import, delay_ms)
  end

  defp run_import(runner, opts) do
    runner.(opts)
  rescue
    _exception -> {:error, :runner_exception}
  catch
    _kind, _reason -> {:error, :runner_exception}
  end

  defp resolve_cursor(opts, resolver, fallback) do
    case resolver.(opts) do
      cursor when is_integer(cursor) and cursor >= 0 -> Keyword.replace!(opts, :cursor, cursor)
      nil -> Keyword.replace!(opts, :cursor, nil)
      _invalid -> Keyword.replace!(opts, :cursor, fallback)
    end
  rescue
    _exception -> Keyword.replace!(opts, :cursor, fallback)
  catch
    _kind, _reason -> Keyword.replace!(opts, :cursor, fallback)
  end

  defp log_result({:ok, report}, opts) do
    Logger.info(
      "CJ product import succeeded " <>
        query_bounds(opts) <>
        " fetched=#{Map.get(report, :fetched, 0)} " <>
        "normalized=#{Map.get(report, :normalized, 0)} " <>
        "persisted=#{Map.get(report, :persisted, 0)} " <>
        "failed=#{Map.get(report, :failed, 0)} " <>
        "pages_fetched=#{Map.get(report, :pages_fetched, 0)}"
    )
  end

  defp log_result({:error, _reason}, opts) do
    Logger.warning("CJ product import failed " <> query_bounds(opts) <> " failure=runner_error")
  end

  defp log_result(_unexpected, opts) do
    Logger.warning("CJ product import failed " <> query_bounds(opts) <> " failure=runner_error")
  end

  defp query_bounds(opts) do
    "keywords=#{length(opts[:keywords])} " <>
      "currency=#{opts[:currency]} " <>
      "serviceable_areas=#{format_serviceable_areas(opts[:serviceable_areas])} " <>
      "limit=#{opts[:limit]} " <>
      "pages=#{opts[:pages]} " <>
      "cursor=#{format_cursor(opts[:cursor])}"
  end

  defp format_serviceable_areas(values) when is_list(values), do: Enum.join(values, ",")
  defp format_serviceable_areas(value), do: value

  defp format_cursor(nil), do: "nil"
  defp format_cursor(value), do: Integer.to_string(value)

  defp keywords_option(opts) do
    opts
    |> Keyword.get(:keywords, @default_keywords)
    |> case do
      value when is_binary(value) ->
        value
        |> String.split(",", trim: true)
        |> normalize_string_list()
        |> default_empty_list(@default_keywords)

      value when is_list(value) ->
        value
        |> normalize_string_list()
        |> default_empty_list(@default_keywords)

      _invalid ->
        @default_keywords
    end
  end

  defp serviceable_areas_option(opts) do
    opts
    |> Keyword.get(:serviceable_areas, @default_serviceable_areas)
    |> case do
      value when is_binary(value) ->
        value
        |> String.split(",", trim: true)
        |> normalize_string_list()
        |> Enum.map(&String.upcase/1)
        |> default_empty_list(@default_serviceable_areas)

      value when is_list(value) ->
        value
        |> normalize_string_list()
        |> Enum.map(&String.upcase/1)
        |> default_empty_list(@default_serviceable_areas)

      _invalid ->
        @default_serviceable_areas
    end
  end

  defp uppercase_string_option(opts, key, default) do
    opts
    |> Keyword.get(key, default)
    |> uppercase_string(default)
  end

  defp uppercase_string(value, default) when is_binary(value) do
    case String.trim(value) do
      "" -> default
      trimmed -> String.upcase(trimmed)
    end
  end

  defp uppercase_string(_invalid, default), do: default

  defp normalize_string_list(values) do
    values
    |> Enum.filter(&is_binary/1)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == ""))
  end

  defp default_empty_list([], default), do: default
  defp default_empty_list(values, _default), do: values
end
