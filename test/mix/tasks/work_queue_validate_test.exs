defmodule Mix.Tasks.WorkQueue.ValidateTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.WorkQueue.Validate

  test "resolves plan references from the project root when invoked from a nested directory" do
    project_root =
      Mix.Project.project_file()
      |> Path.dirname()

    output =
      project_root
      |> Path.join("lib")
      |> File.cd!(fn ->
        capture_io(fn -> Validate.run(["../docs/work/index.md"]) end)
      end)

    assert output =~ ~r/\Awork queue valid: \d+ ready rows\n\z/
  end
end
