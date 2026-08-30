defmodule ProductCompare.ObanWorkerTimeoutPolicyTest do
  use ExUnit.Case, async: true

  @minimum_safety_margin :timer.minutes(120)

  test "every application Oban worker has a finite timeout safely below Lifeline rescue" do
    workers = application_workers()
    rescue_after = lifeline_rescue_after()
    assert is_integer(rescue_after)

    for worker <- workers do
      timeout = worker.timeout(%Oban.Job{})

      assert is_integer(timeout), "#{inspect(worker)} must enforce a finite whole-job timeout"
      assert timeout > 0
      assert timeout + @minimum_safety_margin <= rescue_after
    end
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
