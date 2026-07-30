defmodule ProductCompare.Ingestion.Jobs.Health do
  @moduledoc """
  Provides a redacted operational summary for durable ingestion jobs.
  """

  import Ecto.Query

  alias Oban.Job
  alias Oban.Worker
  alias ProductCompare.Ingestion.Jobs.CJFeedDiscoveryWorker
  alias ProductCompare.Ingestion.Jobs.CJProductImportWorker
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @state_keys %{
    "available" => :available,
    "scheduled" => :scheduled,
    "executing" => :executing,
    "retryable" => :retryable,
    "completed" => :completed,
    "discarded" => :discarded,
    "cancelled" => :cancelled
  }
  @pending_states ~w(available scheduled executing retryable)
  @failure_states ~w(retryable discarded cancelled)

  @spec summary(keyword()) :: map()
  def summary(_opts \\ []) do
    jobs =
      from(job in Job,
        where: job.worker in ^worker_names(),
        select: %{
          attempted_at: job.attempted_at,
          cancelled_at: job.cancelled_at,
          completed_at: job.completed_at,
          discarded_at: job.discarded_at,
          scheduled_at: job.scheduled_at,
          state: job.state
        }
      )
      |> Repo.all()

    latest_failure =
      jobs
      |> Enum.filter(&(&1.state in @failure_states))
      |> Enum.map(&{failure_at(&1), &1.state})
      |> Enum.reject(fn {at, _state} -> is_nil(at) end)
      |> Enum.max_by(fn {at, _state} -> DateTime.to_unix(at, :microsecond) end, fn -> nil end)

    %{
      states: state_counts(jobs),
      oldest_pending_at: oldest_pending_at(jobs),
      last_success_at: latest_timestamp(jobs, "completed", :completed_at),
      last_failure_at: failure_timestamp(latest_failure),
      last_failure_category: failure_category(latest_failure),
      last_reconciliation: latest_reconciliation()
    }
  end

  defp worker_names do
    [
      Worker.to_string(CJFeedDiscoveryWorker),
      Worker.to_string(CJProductImportWorker)
    ]
  end

  defp state_counts(jobs) do
    initial = Map.new(@state_keys, fn {_state, key} -> {key, 0} end)

    Enum.reduce(jobs, initial, fn job, counts ->
      case Map.fetch(@state_keys, job.state) do
        {:ok, key} -> Map.update!(counts, key, &(&1 + 1))
        :error -> counts
      end
    end)
  end

  defp oldest_pending_at(jobs) do
    jobs
    |> Enum.filter(&(&1.state in @pending_states))
    |> Enum.map(&pending_at/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.min_by(&DateTime.to_unix(&1, :microsecond), fn -> nil end)
  end

  defp pending_at(%{state: "executing"} = job), do: job.attempted_at || job.scheduled_at
  defp pending_at(job), do: job.scheduled_at

  defp latest_timestamp(jobs, state, field) do
    jobs
    |> Enum.filter(&(&1.state == state))
    |> Enum.map(&Map.get(&1, field))
    |> Enum.reject(&is_nil/1)
    |> Enum.max_by(&DateTime.to_unix(&1, :microsecond), fn -> nil end)
  end

  defp failure_at(%{state: "discarded"} = job), do: job.discarded_at || job.attempted_at
  defp failure_at(%{state: "cancelled"} = job), do: job.cancelled_at || job.attempted_at
  defp failure_at(job), do: job.attempted_at || job.scheduled_at

  defp failure_timestamp(nil), do: nil
  defp failure_timestamp({timestamp, _state}), do: timestamp

  defp failure_category(nil), do: nil
  defp failure_category({_timestamp, state}), do: state

  defp latest_reconciliation do
    ImportRun
    |> join(:inner, [run], source in assoc(run, :source))
    |> where(
      [run, source],
      source.provider == "cj" and run.surface == "shoppingProducts" and
        run.reconciliation_status != :not_requested
    )
    |> order_by([run], desc: run.started_at, desc: run.id)
    |> select([run], %{
      status: run.reconciliation_status,
      reconciled_at: run.reconciled_at,
      offers_deactivated: run.offers_deactivated
    })
    |> limit(1)
    |> Repo.one()
  end
end
