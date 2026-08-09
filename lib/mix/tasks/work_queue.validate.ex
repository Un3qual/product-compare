defmodule Mix.Tasks.WorkQueue.Validate do
  use Mix.Task

  alias ProductCompare.WorkQueue.Validator

  @shortdoc "Validate the live ready-work queue contract"
  @default_path "docs/work/index.md"

  @impl Mix.Task
  def run(args) do
    path = queue_path!(args)

    case Validator.validate_file(path, project_root()) do
      {:ok, %{ready_count: ready_count}} ->
        row_label = if ready_count == 1, do: "row", else: "rows"
        Mix.shell().info("work queue valid: #{ready_count} ready #{row_label}")

      {:error, errors} ->
        Mix.raise(Enum.join(errors, "\n"))
    end
  end

  defp queue_path!([]), do: @default_path
  defp queue_path!([path]), do: path
  defp queue_path!(_args), do: Mix.raise("usage: mix work_queue.validate [path]")

  defp project_root do
    Mix.Project.project_file()
    |> Path.dirname()
  end
end
