defmodule ProductCompare.Ingestion.SourceProviders do
  @moduledoc false

  import Ecto.Query

  alias Ecto.Changeset
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  @spec ensure_in_transaction(pos_integer(), term()) ::
          {:ok, String.t() | nil} | {:error, Changeset.t()}
  def ensure_in_transaction(source_id, requested_provider) do
    if Repo.in_transaction?() do
      requested_provider = Source.normalize_provider(requested_provider)
      claim_unowned_source(source_id, requested_provider)

      case Repo.get(Source, source_id) do
        nil -> {:error, missing_source_changeset(source_id)}
        %Source{} = source -> reconcile(source, requested_provider)
      end
    else
      raise ArgumentError, "ensure_in_transaction/2 requires a database transaction"
    end
  end

  defp reconcile(%Source{provider: nil}, nil), do: {:ok, nil}
  defp reconcile(%Source{provider: provider}, nil), do: {:ok, provider}
  defp reconcile(%Source{provider: provider}, provider), do: {:ok, provider}

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

  defp claim_unowned_source(_source_id, nil), do: :ok

  defp claim_unowned_source(source_id, provider) do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    Source
    |> where([source], source.id == ^source_id and is_nil(source.provider))
    |> Repo.update_all(set: [provider: provider, updated_at: now])

    :ok
  end

  defp missing_source_changeset(source_id) do
    %Source{}
    |> Changeset.change()
    |> Changeset.add_error(:id, "does not exist", source_id: source_id)
  end
end
