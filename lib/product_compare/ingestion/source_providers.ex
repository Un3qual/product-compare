defmodule ProductCompare.Ingestion.SourceProviders do
  @moduledoc false

  import Ecto.Query

  alias Ecto.Changeset
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.IntegrationProvider
  alias ProductCompareSchemas.Specs.Source

  @spec ensure_in_transaction(pos_integer(), term()) ::
          {:ok, String.t() | nil} | {:error, Changeset.t()}
  def ensure_in_transaction(source_id, requested_provider) do
    source =
      Source
      |> where([source], source.id == ^source_id)
      |> lock("FOR UPDATE")
      |> Repo.one()

    case source do
      nil ->
        {:error, missing_source_changeset(source_id)}

      %Source{} = source ->
        reconcile(source, IntegrationProvider.normalize_code(requested_provider))
    end
  end

  defp reconcile(%Source{provider: nil}, nil), do: {:ok, nil}
  defp reconcile(%Source{provider: provider}, nil), do: {:ok, provider}
  defp reconcile(%Source{provider: provider}, provider), do: {:ok, provider}

  defp reconcile(%Source{provider: nil} = source, provider) do
    source
    |> Source.changeset(%{provider: provider})
    |> Repo.update()
    |> case do
      {:ok, source} -> {:ok, source.provider}
      {:error, changeset} -> {:error, changeset}
    end
  end

  defp reconcile(%Source{} = source, requested_provider) do
    {:error,
     source
     |> Changeset.change()
     |> Changeset.add_error(
       :provider,
       "does not match the source provider",
       source_provider: source.provider,
       requested_provider: requested_provider
     )}
  end

  defp missing_source_changeset(source_id) do
    %Source{}
    |> Changeset.change()
    |> Changeset.add_error(:id, "does not exist", source_id: source_id)
  end
end
