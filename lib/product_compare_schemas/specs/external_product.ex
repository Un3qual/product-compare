defmodule ProductCompareSchemas.Specs.ExternalProduct do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "external_products" do
    field :entropy_id, Ecto.UUID
    field :external_id, :string
    field :canonical_url, :string
    field :last_seen_at, :utc_datetime_usec

    belongs_to :source, ProductCompareSchemas.Specs.Source
    belongs_to :product, ProductCompareSchemas.Catalog.Product

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(external_product, attrs) do
    external_product
    |> cast(attrs, [:source_id, :external_id, :product_id, :canonical_url, :last_seen_at])
    |> validate_required([:source_id, :external_id, :last_seen_at])
    |> unique_constraint([:source_id, :external_id], name: :external_products_source_extid_uq)
  end
end
