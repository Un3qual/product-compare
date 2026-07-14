defmodule ProductCompare.Ingestion.Jobs.HealthTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Ingestion.Jobs.CJProductImportWorker
  alias ProductCompare.Ingestion.Jobs.Health
  alias ProductCompare.Repo

  test "reports safe job state counts and timestamps without args or errors" do
    now = ~U[2026-07-13 18:00:00.000000Z]

    assert {:ok, available} =
             CJProductImportWorker.enqueue(schedule_window: "available-window")

    retryable =
      "retryable-window"
      |> CJProductImportWorker.args()
      |> CJProductImportWorker.new()
      |> Ecto.Changeset.change(%{
        state: "retryable",
        scheduled_at: DateTime.add(now, -1, :hour)
      })
      |> Repo.insert!()

    completed =
      "completed-window"
      |> CJProductImportWorker.args()
      |> CJProductImportWorker.new()
      |> Ecto.Changeset.change(%{
        state: "completed",
        completed_at: DateTime.add(now, -30, :minute)
      })
      |> Repo.insert!()

    discarded =
      "discarded-window"
      |> CJProductImportWorker.args()
      |> CJProductImportWorker.new()
      |> Ecto.Changeset.change(%{
        state: "discarded",
        discarded_at: DateTime.add(now, -10, :minute),
        errors: [%{"at" => DateTime.to_iso8601(now), "error" => "secret provider body"}]
      })
      |> Repo.insert!()

    assert %{
             states: %{
               available: 1,
               retryable: 1,
               completed: 1,
               discarded: 1
             },
             oldest_pending_at: oldest_pending_at,
             last_success_at: last_success_at,
             last_failure_at: last_failure_at,
             last_failure_category: "discarded"
           } = Health.summary(now: now)

    assert DateTime.compare(oldest_pending_at, retryable.scheduled_at) == :eq
    assert DateTime.compare(last_success_at, completed.completed_at) == :eq
    assert DateTime.compare(last_failure_at, discarded.discarded_at) == :eq
    refute inspect(Health.summary(now: now)) =~ "secret provider body"
    refute inspect(Health.summary(now: now)) =~ available.args["schedule_window"]
  end
end
