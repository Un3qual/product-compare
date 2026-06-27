defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateExport do
  @moduledoc """
  Rejected CJ candidate export entry point.

  CJ candidate CSV export is intentionally not supported.
  """

  use Mix.Task

  @shortdoc "Rejects CJ candidate CSV export"

  @impl Mix.Task
  def run(_argv) do
    Mix.raise("CJ candidate CSV export is not supported")
  end
end
