defmodule ProductCompare.Ingestion.SchedulerSupport do
  @moduledoc false

  @spec start_link(module(), keyword()) :: GenServer.on_start()
  def start_link(module, opts) do
    genserver_opts =
      case Keyword.get(opts, :name) do
        nil -> []
        name -> [name: name]
      end

    GenServer.start_link(module, opts, genserver_opts)
  end

  @spec schedule(atom(), non_neg_integer()) :: reference()
  def schedule(message, delay_ms), do: Process.send_after(self(), message, delay_ms)

  @spec schedule_window(DateTime.t()) :: String.t()
  def schedule_window(%DateTime{} = datetime) do
    datetime
    |> DateTime.to_unix(:second)
    |> div(3600)
    |> Kernel.*(3600)
    |> DateTime.from_unix!(:second)
    |> DateTime.to_iso8601()
  end

  @spec run((keyword() -> term()), keyword()) :: term() | {:error, :runner_exception}
  def run(callback, opts) do
    callback.(opts)
  rescue
    _exception -> {:error, :runner_exception}
  catch
    _kind, _reason -> {:error, :runner_exception}
  end

  @spec resolve_cursor(keyword(), (keyword() -> term()), non_neg_integer() | nil) :: keyword()
  def resolve_cursor(opts, resolver, fallback) do
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

  @spec clock(keyword()) :: (-> DateTime.t())
  def clock(opts) do
    case Keyword.get(opts, :clock) do
      clock when is_function(clock, 0) -> clock
      _invalid -> &DateTime.utc_now/0
    end
  end
end
