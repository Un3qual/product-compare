defmodule Mix.Tasks.WorkQueue.ValidateTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureIO

  @plan_path "docs/superpowers/plans/2026-07-24-coverage-contract-hardening-implementation-plan.md"

  @tag :tmp_dir
  test "reports the ready-row count for a complete temporary queue", %{tmp_dir: tmp_dir} do
    queue_path = Path.join(tmp_dir, "queue.md")
    File.write!(queue_path, queue_fixture())

    assert capture_io(fn -> run_task([queue_path]) end) == "work queue valid: 3 ready rows\n"
  end

  test "rejects more than one queue path" do
    assert_raise Mix.Error, "usage: mix work_queue.validate [path]", fn ->
      run_task(["first.md", "second.md"])
    end
  end

  defp queue_fixture do
    rows =
      1..3
      |> Enum.map_join("\n", &ready_row/1)

    """
    # Work Dispatch Index

    ## Ready Work

    #{rows}
    """
  end

  defp ready_row(index) do
    """
    ### #{index}. Coverage contract #{index}

    Status: ready
    Lane: Coverage contract hardening
    Plan: `#{@plan_path}`
    Batch outcome: Entry-point behavior remains directly covered.
    Next action: Run the focused task suite.
    Owned paths:
    - `test/mix/tasks/work_queue_validate_test.exs`
    Internal slices:
    - Validate the task output.
    Prerequisites:
    - The implementation plan exists.
    Verification:
    - `mix test test/mix/tasks/work_queue_validate_test.exs`
    Exit condition: The task reports three ready rows.
    """
  end

  defp run_task(args) do
    Mix.Task.reenable("work_queue.validate")
    Mix.Task.run("work_queue.validate", args)
  end
end
