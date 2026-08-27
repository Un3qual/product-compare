defmodule ProductCompare.CommerceAttribution.ConversionSyncRuns do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.ConversionSyncRun

  @spec start(map(), DateTime.t()) ::
          {:ok, ConversionSyncRun.t()} | {:error, Ecto.Changeset.t()}
  def start(attrs, now) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :running)
      |> Map.put(:finished_at, nil)
      |> Map.put(:started_at, now)

    %ConversionSyncRun{}
    |> ConversionSyncRun.changeset(attrs)
    |> Repo.insert(returning: true)
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
            |> Map.new()
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
end
