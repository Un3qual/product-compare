defmodule ProductCompare.Ingestion.Runs do
  @moduledoc false

  alias ProductCompare.Ingestion.Reconciliation
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun

  @spec start_import_run(map()) :: {:ok, ImportRun.t()} | {:error, Ecto.Changeset.t()}
  def start_import_run(attrs) do
    attrs =
      attrs
      |> Map.new()
      |> prepare_reconciliation()
      |> Map.put_new(:status, "running")
      |> Map.put_new(:started_at, DateTime.utc_now())

    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Repo.insert()
  end

  @spec complete_import_run(ImportRun.t(), map()) ::
          {:ok, ImportRun.t()} | {:error, Ecto.Changeset.t()}
  def complete_import_run(%ImportRun{} = import_run, attrs) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put_new(:finished_at, DateTime.utc_now())

    Repo.transaction(fn ->
      with {:ok, completed_run} <-
             import_run
             |> ImportRun.changeset(attrs)
             |> Repo.update(),
           {:ok, reconciled_run} <- Reconciliation.finalize(completed_run) do
        reconciled_run
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp prepare_reconciliation(attrs) do
    {complete_scope, attrs} = Map.pop(attrs, :complete_scope, false)

    attrs
    |> normalize_complete_scope_cursor(complete_scope)
    |> Map.put_new(:scope_fingerprint, Reconciliation.scope_fingerprint(attrs))
    |> Map.put_new(
      :reconciliation_status,
      if(complete_scope == true, do: "pending", else: "not_requested")
    )
  end

  defp normalize_complete_scope_cursor(attrs, true) do
    Map.update(attrs, :cursor_start, 0, fn
      nil -> 0
      cursor -> cursor
    end)
  end

  defp normalize_complete_scope_cursor(attrs, _complete_scope), do: attrs
end
