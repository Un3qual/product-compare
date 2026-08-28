defmodule ProductCompare.CommerceAttribution.CJCommissionSyncDispatcher do
  @moduledoc false

  use GenServer

  require Logger

  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker

  @tick_ms 60_000

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    case Keyword.get(opts, :name) do
      nil -> GenServer.start_link(__MODULE__, opts)
      name -> GenServer.start_link(__MODULE__, opts, name: name)
    end
  end

  @spec dispatch_due(DateTime.t(), (keyword() -> {:ok, Oban.Job.t()} | {:error, term()})) ::
          {:ok, term()} | {:error, term()}
  def dispatch_due(%DateTime{} = now, enqueuer \\ &CJCommissionSyncWorker.enqueue/1) do
    ConversionSyncSettings.claim_due_cj(now, enqueuer)
  end

  @impl GenServer
  def init(opts) do
    defaults =
      Keyword.get_lazy(opts, :defaults, fn ->
        Application.get_env(:product_compare, :cj_commission_sync_defaults, %{})
      end)

    log_bootstrap(ConversionSyncSettings.ensure_cj(defaults))

    state = %{
      clock: Keyword.get(opts, :clock, &DateTime.utc_now/0),
      enqueuer: Keyword.get(opts, :enqueuer, &CJCommissionSyncWorker.enqueue/1),
      scheduler: Keyword.get(opts, :scheduler, &Process.send_after/3)
    }

    {:ok, schedule_tick(state)}
  end

  @impl GenServer
  def handle_info(:dispatch_due, state) do
    state.clock.()
    |> safe_dispatch(state.enqueuer)
    |> log_dispatch()

    {:noreply, schedule_tick(state)}
  end

  defp safe_dispatch(now, enqueuer) do
    dispatch_due(now, enqueuer)
  rescue
    _exception -> {:error, :dispatcher_exception}
  catch
    _kind, _reason -> {:error, :dispatcher_exception}
  end

  defp schedule_tick(state) do
    _timer = state.scheduler.(self(), :dispatch_due, @tick_ms)
    state
  end

  defp log_bootstrap({:ok, _settings}),
    do: Logger.info("CJ commission sync bootstrap result=success")

  defp log_bootstrap({:error, reason}) do
    Logger.warning("CJ commission sync bootstrap result=failure category=#{category(reason)}")
  end

  defp log_dispatch({:ok, :idle}),
    do: Logger.debug("CJ commission sync dispatch result=idle")

  defp log_dispatch({:ok, %{job: %Oban.Job{}}}),
    do: Logger.info("CJ commission sync dispatch result=success")

  defp log_dispatch({:error, reason}),
    do: Logger.warning("CJ commission sync dispatch result=failure category=#{category(reason)}")

  defp log_dispatch(_unexpected),
    do: Logger.warning("CJ commission sync dispatch result=failure category=unexpected_result")

  defp category(%Ecto.Changeset{}), do: "validation_error"
  defp category({:missing_env, _name}), do: "configuration_error"
  defp category(:cj_network_not_found), do: "configuration_error"
  defp category(:dispatcher_exception), do: "dispatcher_exception"
  defp category(_reason), do: "dispatch_error"
end
