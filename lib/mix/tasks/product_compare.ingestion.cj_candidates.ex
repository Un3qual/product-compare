defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidates do
  @moduledoc "Reports CJ feed candidates from one operator task."

  use Mix.Task

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.ApplicationCohortReport
  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.FitGapReport
  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.Options
  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates.StaleReport
  alias ProductCompare.MixTasks.RepoOnlyStartup

  @shortdoc "Reports CJ feed candidates"

  @impl Mix.Task
  def run(argv) do
    RepoOnlyStartup.start!()

    argv
    |> Options.parse_argv()
    |> run_report()

    :ok
  end

  @spec run_report(keyword()) :: :ok
  def run_report(opts) do
    opts = Options.normalize(opts)

    case Keyword.fetch!(opts, :report) do
      "stale" -> StaleReport.print(opts)
      "fit-gaps" -> FitGapReport.print(opts)
      "application-cohort" -> ApplicationCohortReport.print(opts)
      "export" -> Mix.raise("CJ candidate CSV export is not supported")
    end
  end
end
