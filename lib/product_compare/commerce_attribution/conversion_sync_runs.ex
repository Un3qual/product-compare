defmodule ProductCompare.CommerceAttribution.ConversionSyncRuns do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  @start_fields [
    :entropy_id,
    :affiliate_network_id,
    :status,
    :trigger,
    :requested_by_user_id,
    :oban_job_id,
    :oban_attempt,
    :window_start,
    :window_end,
    :cursor,
    :pages_fetched,
    :records_fetched,
    :records_persisted,
    :records_failed,
    :started_at,
    :finished_at,
    :error_summary
  ]
  @start_field_map Map.new(@start_fields, &{Atom.to_string(&1), &1})
  @completion_fields [
    :status,
    :cursor,
    :pages_fetched,
    :records_fetched,
    :records_persisted,
    :records_failed,
    :finished_at,
    :error_summary
  ]
  @completion_field_map Map.new(@completion_fields, &{Atom.to_string(&1), &1})

  @spec start(map(), DateTime.t()) ::
          {:ok, ConversionSyncRun.t()} | {:error, Ecto.Changeset.t()}
  def start(attrs, now) do
    attrs =
      attrs
      |> normalize_attrs(@start_field_map)
      |> Map.put(:status, :running)
      |> Map.put(:finished_at, nil)
      |> Map.put(:started_at, now)

    changeset = ConversionSyncRun.changeset(%ConversionSyncRun{}, attrs)

    if changeset.valid? do
      Repo.transaction(fn ->
        with :ok <- interrupt_older_attempts(attrs, now),
             {:ok, run} <- Repo.insert(changeset, returning: true) do
          run
        else
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
    else
      {:error, changeset}
    end
  end

  @spec complete(ConversionSyncRun.t(), map(), DateTime.t()) ::
          {:ok, ConversionSyncRun.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def complete(%ConversionSyncRun{id: run_id}, attrs, now) do
    Repo.transaction(fn ->
      current_run =
        Repo.one(
          from run in ConversionSyncRun,
            where: run.id == ^run_id,
            lock: "FOR UPDATE"
        )

      case current_run do
        nil ->
          Repo.rollback(:not_found)

        %ConversionSyncRun{status: status} = terminal_run when status in [:succeeded, :failed] ->
          terminal_run

        %ConversionSyncRun{} = running_run ->
          attrs =
            attrs
            |> normalize_attrs(@completion_field_map)
            |> Map.put(:finished_at, now)

          case running_run
               |> ConversionSyncRun.completion_changeset(attrs)
               |> Repo.update() do
            {:ok, completed_run} -> completed_run
            {:error, changeset} -> Repo.rollback(changeset)
          end
      end
    end)
  end

  @spec query() :: Ecto.Query.t()
  def query do
    from run in ConversionSyncRun,
      order_by: [desc: run.started_at, desc: run.id]
  end

  @spec reconcile_interrupted_cj(DateTime.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def reconcile_interrupted_cj(%DateTime{} = now) do
    Repo.transaction(fn ->
      interrupted_cj_runs()
      |> Enum.reduce_while(0, fn run, count ->
        case lock_oban_job(run.oban_job_id) do
          %Oban.Job{state: "executing"} ->
            {:cont, count}

          _missing_or_not_executing ->
            case finalize_interrupted(run, now) do
              {:ok, _run} -> {:cont, count + 1}
              {:error, changeset} -> {:halt, Repo.rollback(changeset)}
            end
        end
      end)
    end)
  end

  defp interrupt_older_attempts(
         %{oban_job_id: oban_job_id, oban_attempt: oban_attempt},
         now
       )
       when is_integer(oban_job_id) and is_integer(oban_attempt) do
    ConversionSyncRun
    |> where(
      [run],
      run.oban_job_id == ^oban_job_id and run.status == :running and
        run.oban_attempt < ^oban_attempt
    )
    |> order_by([run], asc: run.id)
    |> lock("FOR UPDATE")
    |> Repo.all()
    |> Enum.reduce_while(:ok, fn run, :ok ->
      case finalize_interrupted(run, now) do
        {:ok, _run} -> {:cont, :ok}
        {:error, changeset} -> {:halt, {:error, changeset}}
      end
    end)
  end

  defp interrupt_older_attempts(_attrs, _now), do: :ok

  defp interrupted_cj_runs do
    case Repo.one(
           from network in ProductCompareSchemas.Affiliate.AffiliateNetwork,
             where: network.code == "cj",
             select: network.id
         ) do
      nil ->
        []

      affiliate_network_id ->
        Repo.all(
          from run in ConversionSyncRun,
            where:
              run.affiliate_network_id == ^affiliate_network_id and run.status == :running and
                not is_nil(run.oban_job_id),
            order_by: [asc: run.id],
            lock: "FOR UPDATE SKIP LOCKED",
            select: run
        )
    end
  end

  defp lock_oban_job(oban_job_id) do
    Repo.one(
      from job in Oban.Job,
        where: job.id == ^oban_job_id,
        lock: "FOR UPDATE"
    )
  end

  defp finalize_interrupted(run, now) do
    run
    |> ConversionSyncRun.completion_changeset(%{
      status: :failed,
      finished_at: now,
      error_summary: "worker_interrupted"
    })
    |> Repo.update()
  end

  defp normalize_attrs(attrs, field_map) do
    attrs
    |> Map.new()
    |> Enum.reduce(%{}, fn {key, value}, normalized ->
      normalized_key =
        cond do
          is_atom(key) and Map.has_key?(field_map, Atom.to_string(key)) -> key
          is_binary(key) -> Map.get(field_map, key)
          true -> nil
        end

      if normalized_key, do: Map.put(normalized, normalized_key, value), else: normalized
    end)
  end
end
