defmodule Mix.Tasks.ProductCompare.Ingestion.CjRuns do
  @moduledoc "Reports and resumes CJ ingestion runs from one operator task."

  use Mix.Task

  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.Reports
  alias Mix.Tasks.ProductCompare.Ingestion.CjRuns.Resume
  alias ProductCompare.MixTasks.RepoOnlyStartup

  @shortdoc "Reports or resumes CJ ingestion runs"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    opts = parse_argv(argv)

    if Keyword.fetch!(opts, :resume) do
      run_resume(opts)
    else
      run_report(opts)
    end

    :ok
  end

  @spec run_report(keyword()) :: :ok
  def run_report(opts), do: Reports.run_report(opts)

  @spec run_resume(keyword()) :: {:ok, map()} | {:error, :no_resume_cursor} | :ok
  def run_resume(opts), do: Resume.run_resume(opts)

  defp parse_argv(argv), do: Options.parse_argv(argv)
end
