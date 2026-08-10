defmodule ProductCompareSchemas.Catalog.ProductSlugAlias do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "product_slug_aliases" do
    field :entropy_id, Ecto.UUID
    field :slug, :string

    belongs_to :product, ProductCompareSchemas.Catalog.Product

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(alias_record, attrs) do
    alias_record
    |> cast(attrs, [:slug, :product_id])
    |> reject_persisted_identity_changes()
    |> validate_required([:slug, :product_id])
    |> validate_format(:slug, ~r/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
    |> check_constraint(:slug, name: :product_slug_aliases_slug_format_check)
    |> unique_constraint(:slug)
    |> unique_constraint(:slug, name: :product_slug_namespace_uq)
    |> foreign_key_constraint(:product_id)
  end

  defp reject_persisted_identity_changes(%Ecto.Changeset{data: %__MODULE__{id: id}} = changeset)
       when not is_nil(id) do
    Enum.reduce([:slug, :product_id], changeset, fn field, changeset ->
      if Map.has_key?(changeset.changes, field) do
        Ecto.Changeset.add_error(changeset, field, "cannot be changed after creation")
      else
        changeset
      end
    end)
  end

  defp reject_persisted_identity_changes(changeset), do: changeset
end
