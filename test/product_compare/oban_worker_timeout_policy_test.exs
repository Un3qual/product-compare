defmodule ProductCompare.ObanWorkerTimeoutPolicyTest do
  use ExUnit.Case, async: true

  @minimum_safety_margin :timer.minutes(120)
  @minimum_worker_timeouts %{
    ProductCompare.Alerts.Jobs.AlertEvaluationWorker => :timer.minutes(60),
    ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker => :timer.minutes(45),
    ProductCompare.Ingestion.Jobs.CJFeedDiscoveryWorker => :timer.minutes(120),
    ProductCompare.Ingestion.Jobs.CJProductImportWorker => :timer.minutes(360)
  }

  test "every application Oban worker has a generous finite timeout below Lifeline rescue" do
    workers = application_workers()

    assert MapSet.new(workers) == MapSet.new(Map.keys(@minimum_worker_timeouts))

    rescue_after = lifeline_rescue_after()
    assert is_integer(rescue_after)

    for worker <- workers do
      timeout = worker.timeout(%Oban.Job{})

      assert is_integer(timeout), "#{inspect(worker)} must enforce a finite whole-job timeout"
      assert timeout >= Map.fetch!(@minimum_worker_timeouts, worker)
      assert timeout + @minimum_safety_margin <= rescue_after
    end

    assert ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker.timeout(%Oban.Job{}) ==
             :timer.minutes(45)
  end

  defp application_workers do
    :product_compare
    |> Application.spec(:modules)
    |> Enum.filter(fn module ->
      Oban.Worker in List.wrap(module.module_info(:attributes)[:behaviour])
    end)
  end

  defp lifeline_rescue_after do
    :product_compare
    |> Application.fetch_env!(Oban)
    |> Keyword.fetch!(:plugins)
    |> Enum.find_value(fn
      {Oban.Plugins.Lifeline, opts} -> Keyword.fetch!(opts, :rescue_after)
      _plugin -> nil
    end)
  end
end
