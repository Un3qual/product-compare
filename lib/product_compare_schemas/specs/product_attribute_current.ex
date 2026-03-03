defmodule ProductCompareSchemas.Specs.ProductAttributeCurrent do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "product_attribute_current" do
    field :entropy_id, Ecto.UUID
    field :selected_at, :utc_datetime_usec

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :attribute, ProductCompareSchemas.Specs.Attribute
    belongs_to :claim, ProductCompareSchemas.Specs.ProductAttributeClaim
    belongs_to :selector, ProductCompareSchemas.Accounts.User, foreign_key: :selected_by

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(current, attrs) do
    current
    |> cast(attrs, [:product_id, :attribute_id, :claim_id, :selected_by, :selected_at])
    |> maybe_default_selected_at(current)
    |> validate_required([:product_id, :attribute_id, :claim_id])
    |> unique_constraint([:product_id, :attribute_id], name: :pacur_product_attr_uq)
    |> unique_constraint(:claim_id, name: :pacur_claim_uq)
  end

  defp maybe_default_selected_at(changeset, current) do
    if is_nil(current.id) and is_nil(get_field(changeset, :selected_at)) do
      put_change(changeset, :selected_at, DateTime.utc_now() |> DateTime.truncate(:microsecond))
    else
      changeset
    end
  end
end
