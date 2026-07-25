defmodule ProductCompare.Ingestion.CJPrograms do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.CJProgram

  @spec ensure_in_transaction(pos_integer(), String.t() | nil) ::
          {:ok, CJProgram.t()} | {:error, :blank_advertiser_id | Ecto.Changeset.t()}
  def ensure_in_transaction(source_id, raw_advertiser_id) when is_integer(source_id) do
    case normalize_advertiser_id(raw_advertiser_id) do
      nil ->
        {:error, :blank_advertiser_id}

      advertiser_id ->
        %CJProgram{}
        |> CJProgram.changeset(%{
          source_id: source_id,
          advertiser_id: advertiser_id,
          stage: "new",
          changed_at: DateTime.utc_now()
        })
        |> Repo.insert(
          on_conflict: :nothing,
          conflict_target: [:source_id, :advertiser_id],
          returning: true
        )
        |> fetch_conflicted_program(source_id, advertiser_id)
    end
  end

  @spec get_by_entropy_id(Ecto.UUID.t()) :: CJProgram.t() | nil
  def get_by_entropy_id(entropy_id) when is_binary(entropy_id) do
    Repo.get_by(CJProgram, entropy_id: entropy_id)
  end

  @spec update_lifecycle(Ecto.UUID.t(), map()) ::
          {:ok, CJProgram.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_lifecycle(entropy_id, attrs) do
    update_lifecycle(entropy_id, attrs, DateTime.utc_now())
  end

  @spec update_lifecycle(Ecto.UUID.t(), map(), DateTime.t()) ::
          {:ok, CJProgram.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_lifecycle(entropy_id, attrs, now) when is_binary(entropy_id) and is_map(attrs) do
    case get_by_entropy_id(entropy_id) do
      nil ->
        {:error, :not_found}

      %CJProgram{} = program ->
        changeset = CJProgram.lifecycle_changeset(program, normalize_lifecycle_attrs(attrs))

        if changeset.changes == %{} do
          {:ok, program}
        else
          changeset
          |> Ecto.Changeset.put_change(:changed_at, now)
          |> Repo.update()
        end
    end
  end

  defp fetch_conflicted_program({:ok, %CJProgram{id: nil}}, source_id, advertiser_id) do
    {:ok, Repo.get_by!(CJProgram, source_id: source_id, advertiser_id: advertiser_id)}
  end

  defp fetch_conflicted_program(result, _source_id, _advertiser_id), do: result

  defp normalize_lifecycle_attrs(attrs) do
    %{}
    |> put_attr(attrs, :stage)
    |> put_attr(attrs, :note)
    |> normalize_note()
  end

  defp put_attr(normalized_attrs, attrs, key) do
    string_key = Atom.to_string(key)

    cond do
      Map.has_key?(attrs, key) ->
        Map.put(normalized_attrs, key, Map.fetch!(attrs, key))

      Map.has_key?(attrs, string_key) ->
        Map.put(normalized_attrs, key, Map.fetch!(attrs, string_key))

      true ->
        normalized_attrs
    end
  end

  defp normalize_note(attrs) do
    if Map.has_key?(attrs, :note) do
      Map.update!(attrs, :note, &blank_to_nil/1)
    else
      attrs
    end
  end

  defp normalize_advertiser_id(value) when is_binary(value), do: blank_to_nil(value)
  defp normalize_advertiser_id(_value), do: nil

  defp blank_to_nil(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp blank_to_nil(value), do: value
end
