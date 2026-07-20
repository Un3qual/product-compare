defmodule ProductCompare.Ingestion.CJFeedDiscoveryScheduler do
  @moduledoc """
  Periodically runs bounded CJ shopping product feed discovery.
  """

  use GenServer

  require Logger

  alias ProductCompare.Ingestion.Jobs.CJFeedDiscoveryWorker
  alias ProductCompare.Ingestion.OptionNormalization
  alias ProductCompare.Ingestion.ScheduledCursor
  alias ProductCompare.Ingestion.SchedulerSupport

  @default_advertiser_country "US"
  @default_initial_delay_ms 60_000
  @default_interval_ms 86_400_000
  @default_limit 25
  @default_pages 1

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts), do: SchedulerSupport.start_link(__MODULE__, opts)

  @impl GenServer
  def init(opts) do
    state = %{
      advertiser_country: string_option(opts, :advertiser_country, @default_advertiser_country),
      clock: SchedulerSupport.clock(opts),
      cursor: OptionNormalization.non_negative_integer_option(opts, :cursor, nil),
      cursor_resolver: Keyword.get(opts, :cursor_resolver, &ScheduledCursor.feed/1),
      initial_delay_ms:
        OptionNormalization.non_negative_integer_option(
          opts,
          :initial_delay_ms,
          @default_initial_delay_ms
        ),
      interval_ms:
        OptionNormalization.positive_integer_option(opts, :interval_ms, @default_interval_ms),
      limit: OptionNormalization.positive_integer_option(opts, :limit, @default_limit),
      pages: OptionNormalization.positive_integer_option(opts, :pages, @default_pages),
      enqueuer:
        Keyword.get(opts, :enqueuer, Keyword.get(opts, :runner, &CJFeedDiscoveryWorker.enqueue/1))
    }

    SchedulerSupport.schedule(:run_discovery, state.initial_delay_ms)

    {:ok, state}
  end

  @impl GenServer
  def handle_info(:run_discovery, state) do
    opts =
      state
      |> discovery_opts()
      |> SchedulerSupport.resolve_cursor(state.cursor_resolver, state.cursor)

    opts = opts ++ [schedule_window: SchedulerSupport.schedule_window(state.clock.())]

    result = SchedulerSupport.run(state.enqueuer, opts)

    log_result(result, opts)

    state = %{state | cursor: opts[:cursor]}

    SchedulerSupport.schedule(:run_discovery, state.interval_ms)

    {:noreply, state}
  end

  defp discovery_opts(state) do
    [
      advertiser_country: state.advertiser_country,
      limit: state.limit,
      pages: state.pages,
      cursor: state.cursor
    ]
  end

  defp log_result({:ok, report}, opts) do
    Logger.info(
      "CJ feed discovery succeeded " <>
        "advertiser_country=#{opts[:advertiser_country]} limit=#{opts[:limit]} " <>
        "pages=#{opts[:pages]} cursor=#{inspect(opts[:cursor])} " <>
        "feeds_fetched=#{Map.get(report, :feeds_fetched, 0)} " <>
        "candidates_persisted=#{Map.get(report, :candidates_persisted, 0)} " <>
        "pages_fetched=#{Map.get(report, :pages_fetched, 0)} " <>
        "failed=#{Map.get(report, :failed, 0)}"
    )
  end

  defp log_result({:error, _reason}, opts) do
    log_warning_result("CJ feed discovery failed", opts)
  end

  defp log_result(_unexpected, opts) do
    log_warning_result("CJ feed discovery returned unexpected result", opts)
  end

  defp log_warning_result(prefix, opts) do
    Logger.warning(
      prefix <>
        " " <>
        "advertiser_country=#{opts[:advertiser_country]} limit=#{opts[:limit]} " <>
        "pages=#{opts[:pages]} cursor=#{inspect(opts[:cursor])}"
    )
  end

  defp string_option(opts, key, default) do
    opts
    |> Keyword.get(key, default)
    |> case do
      value when is_binary(value) ->
        case String.trim(value) do
          "" -> default
          trimmed -> trimmed
        end

      _other ->
        default
    end
  end
end
