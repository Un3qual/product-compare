defmodule Mix.Tasks.WorkQueue.Validate do
  use Mix.Task

  alias ProductCompare.WorkQueue.Validator

  @shortdoc "Validate the live ready-work queue contract"
  @default_path "docs/work/index.md"

  @impl Mix.Task
  def run(args) do
    path = queue_path!(args)

    case Validator.validate_file(path) do
      {:ok, %{ready_count: ready_count}} ->
        Mix.shell().info("work queue valid: #{ready_count} ready rows")

      {:error, errors} ->
        Mix.raise(Enum.join(errors, "\n"))
    end
  end

  defp queue_path!([]), do: @default_path
  defp queue_path!([path]), do: path
  defp queue_path!(_args), do: Mix.raise("usage: mix work_queue.validate [path]")
end
