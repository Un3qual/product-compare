defmodule ProductCompare.CommerceAttribution.CJCommissionSyncJobs do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Accounts
  alias ProductCompare.CommerceAttribution.CJ.Client
  alias ProductCompare.CommerceAttribution.ConversionSyncSettings
  alias ProductCompare.CommerceAttribution.Jobs.CJCommissionSyncWorker
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncSetting

  @active_states ["suspended", "available", "scheduled", "executing", "retryable"]

  @spec active() :: map() | nil
  def active do
    case active_job() do
      %Oban.Job{} = job ->
        %{
          state: job.state,
          scheduled_at: job.scheduled_at,
          attempted_at: job.attempted_at,
          from: parse_datetime(job.args["from"]),
          before: parse_datetime(job.args["before"])
        }

      nil ->
        nil
    end
  end

  @spec run_now(pos_integer(), DateTime.t()) ::
          {:ok, %{job: Oban.Job.t(), existing: boolean()}} | {:error, term()}
  def run_now(operator_id, %DateTime{} = now) do
    Repo.transaction(fn ->
      with {:ok, _operator} <- Accounts.lock_operator(operator_id),
           %ConversionSyncSetting{} = settings <- ConversionSyncSettings.lock_cj(),
           {:ok, result} <- run_now_locked(settings, operator_id, now) do
        result
      else
        {:error, reason} -> Repo.rollback(reason)
        nil -> Repo.rollback(:not_found)
      end
    end)
  end

  @spec run_now_locked(ConversionSyncSetting.t(), pos_integer(), DateTime.t()) ::
          {:ok, %{job: Oban.Job.t(), existing: boolean()}} | {:error, term()}
  def run_now_locked(%ConversionSyncSetting{} = settings, operator_id, %DateTime{} = now) do
    require_transaction!()

    with %{ready: true} <- Client.credential_status(),
         nil <- active_job(),
         {:ok, publisher_ids} <- Client.publisher_ids(),
         {:ok, job} <-
           CJCommissionSyncWorker.enqueue(
             publisher_ids: publisher_ids,
             from: DateTime.add(now, -settings.lookback_days * 86_400, :second),
             before: now,
             max_pages: settings.max_pages,
             trigger: :operator,
             requested_by_user_id: operator_id,
             schedule_window: now
           ) do
      {:ok, %{job: job, existing: false}}
    else
      %{ready: false} -> {:error, :credentials_missing}
      %Oban.Job{} = job -> {:ok, %{job: job, existing: true}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp active_job do
    Repo.one(
      from job in Oban.Job,
        where:
          job.worker == ^inspect(CJCommissionSyncWorker) and
            job.state in ^@active_states,
        order_by: [
          asc: fragment("CASE WHEN ? = 'executing' THEN 0 ELSE 1 END", job.state),
          desc: job.id
        ],
        limit: 1
    )
  end

  defp parse_datetime(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, 0} -> DateTime.truncate(datetime, :second)
      _invalid -> nil
    end
  end

  defp require_transaction! do
    unless Repo.in_transaction?() do
      raise ArgumentError, "run_now_locked/3 requires a database transaction"
    end
  end
end
