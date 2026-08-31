defmodule ProductCompare.Ingestion.SourceHealth do
  @moduledoc """
  Provider-neutral read model for source-level ingestion health.

  The summary intentionally exposes only source identifiers and aggregate run
  state. It does not load raw source artifacts, run queries, or provider payloads.
  """

  import Ecto.Query

  alias ProductCompare.Ingestion.OptionNormalization
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.{Source, SourceArtifact}

  @default_recent_failure_hours 168
  @min_recent_failure_hours 1
  @max_recent_failure_hours 720

  @type summary_row :: %{
          source_id: pos_integer(),
          source_kind: String.t(),
          source_name: String.t(),
          source_domain: String.t() | nil,
          artifact_count: non_neg_integer(),
          latest_artifact_fetched_at: DateTime.t() | nil,
          latest_import_run_status: String.t() | nil,
          latest_import_run_finished_at: DateTime.t() | nil,
          recent_failed_run_count: non_neg_integer()
        }

  @spec summary(keyword()) :: [summary_row()]
  def summary(opts) when is_list(opts) do
    summary(opts, DateTime.utc_now())
  end

  @spec summary(keyword(), DateTime.t()) :: [summary_row()]
  def summary(opts, %DateTime{} = now) when is_list(opts) do
    recent_failure_hours = recent_failure_hours(opts)
    recent_failure_since = DateTime.add(now, -recent_failure_hours * 60 * 60, :second)

    artifact_summaries = index_by_source_id(artifact_summaries())
    latest_runs = index_by_source_id(latest_runs())
    recent_failure_counts = index_by_source_id(recent_failure_counts(recent_failure_since))

    sources()
    |> Enum.map(fn source ->
      artifact_summary = Map.get(artifact_summaries, source.source_id, %{})
      latest_run = Map.get(latest_runs, source.source_id, %{})
      recent_failures = Map.get(recent_failure_counts, source.source_id, %{})

      %{
        source_id: source.source_id,
        source_kind: source.source_kind,
        source_name: source.source_name,
        source_domain: source.source_domain,
        artifact_count: Map.get(artifact_summary, :artifact_count, 0),
        latest_artifact_fetched_at:
          artifact_summary |> Map.get(:latest_artifact_fetched_at) |> utc_datetime(),
        latest_import_run_status: latest_run |> Map.get(:latest_import_run_status) |> status(),
        latest_import_run_finished_at:
          latest_run |> Map.get(:latest_import_run_finished_at) |> utc_datetime(),
        recent_failed_run_count: Map.get(recent_failures, :recent_failed_run_count, 0)
      }
    end)
  end

  defp sources do
    Source
    |> from(as: :source)
    |> order_by([source: source], asc: source.id)
    |> select([source: source], %{
      source_id: source.id,
      source_kind: source.kind,
      source_name: source.name,
      source_domain: source.domain
    })
    |> Repo.all()
  end

  defp artifact_summaries do
    SourceArtifact
    |> group_by([artifact], artifact.source_id)
    |> select([artifact], %{
      source_id: artifact.source_id,
      artifact_count: count(artifact.id),
      latest_artifact_fetched_at: max(artifact.fetched_at)
    })
    |> Repo.all()
  end

  defp latest_runs do
    ImportRun
    |> distinct([run], run.source_id)
    |> order_by([run],
      asc: run.source_id,
      desc: run.started_at,
      desc: run.id
    )
    |> select([run], %{
      source_id: run.source_id,
      latest_import_run_status: run.status,
      latest_import_run_finished_at: run.finished_at
    })
    |> Repo.all()
  end

  defp recent_failure_counts(recent_failure_since) do
    ImportRun
    |> where(
      [run],
      run.status == :failed and not is_nil(run.finished_at) and
        run.finished_at >= ^recent_failure_since
    )
    |> group_by([run], run.source_id)
    |> select([run], %{
      source_id: run.source_id,
      recent_failed_run_count: count(run.id)
    })
    |> Repo.all()
  end

  defp index_by_source_id(rows) do
    Map.new(rows, &{&1.source_id, &1})
  end

  defp recent_failure_hours(opts) do
    opts
    |> Keyword.get(:recent_failure_hours, @default_recent_failure_hours)
    |> OptionNormalization.bounded_integer(
      default: @default_recent_failure_hours,
      min: @min_recent_failure_hours,
      max: @max_recent_failure_hours
    )
  end

  defp utc_datetime(nil), do: nil
  defp utc_datetime(%DateTime{} = datetime), do: datetime
  defp utc_datetime(%NaiveDateTime{} = datetime), do: DateTime.from_naive!(datetime, "Etc/UTC")

  defp status(nil), do: nil
  defp status(status) when is_atom(status), do: Atom.to_string(status)
  defp status(status) when is_binary(status), do: status
end
