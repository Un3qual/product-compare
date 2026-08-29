defmodule ProductCompare.CommerceAttribution.ConversionSyncRuns do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  @execution_recovery_margin :timer.minutes(10)

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

  @spec page_for_affiliate(pos_integer(), non_neg_integer(), String.t() | nil) ::
          {:ok, map()} | {:error, :invalid_cursor}
  def page_for_affiliate(affiliate_network_id, first, after_cursor)
      when is_integer(affiliate_network_id) and affiliate_network_id > 0 and
             is_integer(first) and first >= 0 and first <= 100 do
    with {:ok, after_key} <- decode_page_cursor(after_cursor) do
      rows =
        query()
        |> where([run], run.affiliate_network_id == ^affiliate_network_id)
        |> after_cursor(after_key)
        |> preload([:requested_by_user])
        |> limit(^(first + 1))
        |> Repo.all()

      {page, overflow} = Enum.split(rows, first)

      edges = Enum.map(page, &%{cursor: encode_page_cursor(&1), node: &1})
      start_cursor = edges |> List.first() |> edge_cursor()
      end_cursor = edges |> List.last() |> edge_cursor()

      {:ok,
       %{
         edges: edges,
         page_info: %{
           start_cursor: start_cursor,
           end_cursor: end_cursor,
           has_next_page: overflow != [],
           has_previous_page: not is_nil(after_key)
         }
       }}
    end
  end

  @spec reconcile_interrupted_cj(DateTime.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def reconcile_interrupted_cj(%DateTime{} = now) do
    Repo.transaction(fn ->
      interrupted_cj_runs()
      |> Enum.reduce_while(0, fn run, count ->
        case lock_oban_job(run.oban_job_id) do
          %Oban.Job{state: "executing"} = job ->
            if stale_execution?(job, now) do
              finalize_and_replace_stale_execution(run, job, now, count)
            else
              {:cont, count}
            end

          _missing_or_not_executing ->
            finalize_interrupted_run(run, now, count)
        end
      end)
    end)
  end

  defp stale_execution?(%Oban.Job{attempted_at: %DateTime{} = attempted_at} = job, now) do
    stale_before =
      DateTime.add(
        now,
        -(CJCommissionSyncWorker.timeout(job) + @execution_recovery_margin),
        :millisecond
      )

    DateTime.compare(attempted_at, stale_before) in [:lt, :eq]
  end

  defp stale_execution?(_job, _now), do: false

  defp finalize_and_replace_stale_execution(run, job, now, count) do
    with {:ok, _run} <- finalize_interrupted(run, now),
         :ok <- replace_stale_job(job) do
      {:cont, count + 1}
    else
      {:error, reason} -> {:halt, Repo.rollback(reason)}
    end
  end

  defp finalize_interrupted_run(run, now, count) do
    case finalize_interrupted(run, now) do
      {:ok, _run} -> {:cont, count + 1}
      {:error, changeset} -> {:halt, Repo.rollback(changeset)}
    end
  end

  defp replace_stale_job(%Oban.Job{} = job) do
    with :ok <- Oban.cancel_job(job),
         {:ok, _replacement} <- enqueue_remaining_attempts(job) do
      :ok
    end
  end

  defp enqueue_remaining_attempts(%Oban.Job{attempt: attempt, max_attempts: max_attempts} = job)
       when attempt < max_attempts do
    job.args
    |> CJCommissionSyncWorker.new(max_attempts: max_attempts - attempt)
    |> Oban.insert()
  end

  defp enqueue_remaining_attempts(%Oban.Job{}), do: {:ok, nil}

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

  defp after_cursor(query, nil), do: query

  defp after_cursor(query, {started_at, id}) do
    where(
      query,
      [run],
      run.started_at < ^started_at or (run.started_at == ^started_at and run.id < ^id)
    )
  end

  defp encode_page_cursor(%ConversionSyncRun{started_at: started_at, id: id}) do
    started_at
    |> DateTime.to_unix(:microsecond)
    |> then(&"#{&1}:#{id}")
    |> Base.url_encode64(padding: false)
  end

  defp decode_page_cursor(nil), do: {:ok, nil}

  defp decode_page_cursor(cursor) when is_binary(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         [started_at_value, id_value] <- String.split(decoded, ":", parts: 2),
         {started_at_microseconds, ""} <- Integer.parse(started_at_value),
         {id, ""} when id > 0 <- Integer.parse(id_value),
         {:ok, started_at} <- DateTime.from_unix(started_at_microseconds, :microsecond),
         ^cursor <- encode_page_cursor(%ConversionSyncRun{started_at: started_at, id: id}) do
      {:ok, {started_at, id}}
    else
      _invalid -> {:error, :invalid_cursor}
    end
  end

  defp decode_page_cursor(_cursor), do: {:error, :invalid_cursor}

  defp edge_cursor(nil), do: nil
  defp edge_cursor(edge), do: edge.cursor
end
