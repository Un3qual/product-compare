defmodule ProductCompare.CommerceAttribution.Visitors do
  @moduledoc false

  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.AnonymousVisitor

  @spec get_or_create(Ecto.UUID.t()) ::
          {:ok, AnonymousVisitor.t()} | {:error, Ecto.Changeset.t()}
  def get_or_create(entropy_id) do
    changeset = AnonymousVisitor.changeset(%AnonymousVisitor{}, %{entropy_id: entropy_id})

    if changeset.valid? do
      with {:ok, _visitor} <-
             Repo.insert(changeset,
               on_conflict: :nothing,
               conflict_target: :entropy_id
             ) do
        {:ok,
         Repo.get_by!(AnonymousVisitor,
           entropy_id: Ecto.Changeset.get_field(changeset, :entropy_id)
         )}
      end
    else
      {:error, changeset}
    end
  end
end
