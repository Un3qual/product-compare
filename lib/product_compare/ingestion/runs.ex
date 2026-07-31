defmodule ProductCompare.Ingestion.Runs do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Ingestion.Reconciliation
  alias ProductCompare.Ingestion.SourceProviders
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Specs.Source

  @spec start_import_run(map()) :: {:ok, ImportRun.t()} | {:error, Ecto.Changeset.t()}
  def start_import_run(attrs) do
    attrs =
      attrs
      |> Map.new()
      |> prepare_reconciliation()
      |> Map.put_new(:status, :running)
      |> Map.put_new(:started_at, DateTime.utc_now())

    with {:ok, provider} <- run_provider(attrs),
         {:ok, source_id} <- validate_import_run(attrs, provider) do
      Repo.transaction(fn ->
        with {:ok, provider} <-
               SourceProviders.ensure_in_transaction(source_id, provider),
             {:ok, import_run} <-
               %ImportRun{}
               |> ImportRun.changeset(Map.put(attrs, :provider, provider))
               |> Repo.insert() do
          import_run
        else
          {:error, reason} -> Repo.rollback(reason)
        end
      end)
    end
  end

  @spec complete_import_run(ImportRun.t(), map()) ::
          {:ok, ImportRun.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def complete_import_run(%ImportRun{id: import_run_id}, attrs) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put_new(:finished_at, DateTime.utc_now())

    Repo.transaction(fn ->
      current_run =
        Repo.one(
          from run in ImportRun,
            where: run.id == ^import_run_id,
            lock: "FOR UPDATE"
        )

      case current_run do
        nil ->
          Repo.rollback(:not_found)

        %ImportRun{status: status} = completed_run when status in [:succeeded, :failed] ->
          completed_run

        %ImportRun{status: :running} = running_run ->
          with {:ok, completed_run} <-
                 running_run
                 |> ImportRun.completion_changeset(attrs)
                 |> Repo.update(),
               {:ok, reconciled_run} <- Reconciliation.finalize(completed_run) do
            reconciled_run
          else
            {:error, reason} -> Repo.rollback(reason)
          end
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
      if(complete_scope == true, do: :pending, else: :not_requested)
    )
  end

  defp normalize_complete_scope_cursor(attrs, true) do
    Map.update(attrs, :cursor_start, 0, fn
      nil -> 0
      cursor -> cursor
    end)
  end

  defp normalize_complete_scope_cursor(attrs, _complete_scope), do: attrs

  defp run_provider(attrs) do
    requested = Source.normalize_provider(attr(attrs, :provider))
    surface_provider = ImportRun.provider_for_surface(attr(attrs, :surface))

    cond do
      present?(attr(attrs, :provider)) and is_nil(requested) ->
        {:error, provider_error(attrs, "is not a supported integration provider")}

      requested && surface_provider && requested != surface_provider ->
        {:error, provider_error(attrs, "does not own the requested integration surface")}

      true ->
        {:ok, requested || surface_provider}
    end
  end

  defp validate_import_run(attrs, provider) do
    changeset =
      %ImportRun{}
      |> ImportRun.changeset(Map.put(attrs, :provider, provider))

    if changeset.valid? do
      {:ok, Ecto.Changeset.fetch_field!(changeset, :source_id)}
    else
      {:error, changeset}
    end
  end

  defp provider_error(attrs, message) do
    %ImportRun{}
    |> ImportRun.changeset(attrs)
    |> Ecto.Changeset.add_error(:provider, message)
  end

  defp present?(value), do: not is_nil(value) and value != ""

  defp attr(attrs, key) do
    Map.get(attrs, key, Map.get(attrs, Atom.to_string(key)))
  end
end
