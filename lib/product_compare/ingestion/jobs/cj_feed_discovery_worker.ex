defmodule ProductCompare.Ingestion.Jobs.CJFeedDiscoveryWorker do
  @moduledoc """
  Runs one bounded CJ feed-discovery pass as a durable, retryable job.
  """

  @unique_args [:advertiser_country, :cursor, :limit, :pages, :schedule_window]

  use Oban.Worker,
    queue: :ingestion,
    max_attempts: 5,
    unique: [
      period: :infinity,
      fields: [:worker, :queue, :args],
      keys: @unique_args
    ]

  alias Mix.Tasks.ProductCompare.Ingestion.CjFeeds
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
  defdelegate args(opts), to: Arguments, as: :feed

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    opts = Arguments.feed_runner_opts(args)

    Result.run(fn -> runner().(opts) end)
  end

  defp runner do
    Application.get_env(:product_compare, :cj_feed_discovery_job_runner, &CjFeeds.run_discovery/1)
  end
end
