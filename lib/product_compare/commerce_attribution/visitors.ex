defmodule ProductCompare.CommerceAttribution.Visitors do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.AnonymousVisitor

  @spec get_or_create(Ecto.UUID.t()) ::
          {:ok, AnonymousVisitor.t()} | {:error, Ecto.Changeset.t()}
  def get_or_create(entropy_id) do
    changeset = AnonymousVisitor.changeset(%AnonymousVisitor{}, %{entropy_id: entropy_id})

    if changeset.valid? do
      entropy_id = Ecto.Changeset.get_field(changeset, :entropy_id)

      case Repo.get_by(AnonymousVisitor, entropy_id: entropy_id) do
        %AnonymousVisitor{} = visitor -> {:ok, visitor}
        nil -> insert_or_get(changeset)
      end
    else
      {:error, changeset}
    end
  end

  defp insert_or_get(changeset) do
    entropy_id = Ecto.Changeset.get_field(changeset, :entropy_id)

    with {:ok, _visitor} <-
           Repo.insert(changeset,
             on_conflict: :nothing,
             conflict_target: :entropy_id
           ) do
      {:ok, Repo.get_by!(AnonymousVisitor, entropy_id: entropy_id)}
    end
  end
end
