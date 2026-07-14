defmodule ProductCompare.Ingestion.Jobs.CJProductImportWorker do
  @moduledoc """
  Runs one bounded CJ product import as a durable, retryable job.
  """

  use Oban.Worker,
    queue: :ingestion,
    max_attempts: 5,
    unique: [period: :infinity, fields: [:worker, :queue, :args]]

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport
  alias ProductCompare.Ingestion.Jobs.Arguments
  alias ProductCompare.Ingestion.Jobs.Result

  @spec enqueue(keyword() | map()) :: {:ok, Oban.Job.t()} | {:error, Ecto.Changeset.t()}
  def enqueue(opts \\ []) do
    opts
    |> args()
    |> new()
    |> Oban.insert()
  end

  @spec args(keyword() | map() | String.t()) :: map()
  defdelegate args(opts), to: Arguments, as: :product

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    opts = Arguments.product_runner_opts(args)

    Result.run(fn -> runner().(opts) end)
  end

  defp runner do
    Application.get_env(:product_compare, :cj_product_import_job_runner, &run_import/1)
  end

  defp run_import(opts) do
    opts
    |> Keyword.put(:print_report, false)
    |> CjImport.run_import()
  end
end
