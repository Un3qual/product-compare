defmodule ProductCompare.Ingestion.SourceHealth do
  @moduledoc """
  Provider-neutral read model for source-level ingestion health.

  The summary intentionally exposes only source identifiers and aggregate run
  state. It does not load raw source artifacts, run queries, or provider payloads.
  """

  import Ecto.Query

  alias ProductCompare.Repo

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
        latest_import_run_status: Map.get(latest_run, :latest_import_run_status),
        latest_import_run_finished_at:
          latest_run |> Map.get(:latest_import_run_finished_at) |> utc_datetime(),
        recent_failed_run_count: Map.get(recent_failures, :recent_failed_run_count, 0)
      }
    end)
  end

  defp sources do
    "sources"
    |> from(as: :source)
    |> order_by([source: source], asc: field(source, :id))
    |> select([source: source], %{
      source_id: field(source, :id),
      source_kind: field(source, :kind),
      source_name: field(source, :name),
      source_domain: field(source, :domain)
    })
    |> Repo.all()
  end

  defp artifact_summaries do
    "source_artifacts"
    |> from(as: :artifact)
    |> group_by([artifact: artifact], field(artifact, :source_id))
    |> select([artifact: artifact], %{
      source_id: field(artifact, :source_id),
      artifact_count: count(field(artifact, :id)),
      latest_artifact_fetched_at: max(field(artifact, :fetched_at))
    })
    |> Repo.all()
  end

  defp latest_runs do
    "ingestion_runs"
    |> from(as: :run)
    |> where([run: run], not is_nil(field(run, :finished_at)))
    |> distinct([run: run], field(run, :source_id))
    |> order_by([run: run],
      asc: field(run, :source_id),
      desc: field(run, :finished_at),
      desc: field(run, :id)
    )
    |> select([run: run], %{
      source_id: field(run, :source_id),
      latest_import_run_status: field(run, :status),
      latest_import_run_finished_at: field(run, :finished_at)
    })
    |> Repo.all()
  end

  defp recent_failure_counts(recent_failure_since) do
    "ingestion_runs"
    |> from(as: :run)
    |> where(
      [run: run],
      field(run, :status) == "failed" and
        not is_nil(field(run, :finished_at)) and
        field(run, :finished_at) >= ^recent_failure_since
    )
    |> group_by([run: run], field(run, :source_id))
    |> select([run: run], %{
      source_id: field(run, :source_id),
      recent_failed_run_count: count(field(run, :id))
    })
    |> Repo.all()
  end

  defp index_by_source_id(rows) do
    Map.new(rows, &{&1.source_id, &1})
  end

  defp recent_failure_hours(opts) do
    opts
    |> Keyword.get(:recent_failure_hours, @default_recent_failure_hours)
    |> normalize_recent_failure_hours()
    |> max(@min_recent_failure_hours)
    |> min(@max_recent_failure_hours)
  end

  defp normalize_recent_failure_hours(value) when is_integer(value), do: value

  defp normalize_recent_failure_hours(value) when is_binary(value) do
    case Integer.parse(value) do
      {hours, ""} -> hours
      _invalid -> @default_recent_failure_hours
    end
  end

  defp normalize_recent_failure_hours(_value), do: @default_recent_failure_hours

  defp utc_datetime(nil), do: nil
  defp utc_datetime(%DateTime{} = datetime), do: datetime
  defp utc_datetime(%NaiveDateTime{} = datetime), do: DateTime.from_naive!(datetime, "Etc/UTC")
end
