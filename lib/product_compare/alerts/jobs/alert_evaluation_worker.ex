# These domain workers share Oban's callback surface, but they aren't interchangeable implementations.
# reach:disable-next-line behaviour_candidate
defmodule ProductCompare.Alerts.Jobs.AlertEvaluationWorker do
  @moduledoc """
  Durably evaluates price watches after one persisted price observation.
  """

  use Oban.Worker,
    queue: :alerts,
    max_attempts: 5,
    unique: [period: :infinity, fields: [:worker, :queue, :args]]

  alias ProductCompare.Alerts

  @max_run_duration :timer.minutes(60)

  @spec enqueue(pos_integer()) :: {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()}
  def enqueue(price_point_id) when is_integer(price_point_id) and price_point_id > 0 do
    %{"price_point_id" => price_point_id}
    |> new()
    |> Oban.insert()
  end

  @impl Oban.Worker
  def timeout(_job), do: @max_run_duration

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"price_point_id" => price_point_id}})
      when is_integer(price_point_id) and price_point_id > 0 do
    case Alerts.evaluate_price_point(price_point_id) do
      {:ok, _summary} ->
        :ok

      {:error, :price_point_not_found} ->
        {:cancel, "price_point_not_found"}

      {:error, {:watch_evaluations_failed, _watch_ids, _summary}} ->
        {:error, "watch_evaluations_failed"}
    end
  end

  def perform(_job), do: {:cancel, "invalid_price_point_id"}
end
