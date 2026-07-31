defmodule ProductCompareSchemas.Catalog.ProductIdentifier do
  use ProductCompareSchemas.Schema, :relational

  @schemes [:gtin, :mpn]
  @verification_statuses [:unverified, :validated, :rejected]

  @type t :: %__MODULE__{}

  schema "product_identifiers" do
    field :entropy_id, Ecto.UUID
    field :scheme, Ecto.Enum, values: @schemes
    field :normalized_value, :string
    field :display_value, :string
    field :verification_status, Ecto.Enum, values: @verification_statuses
    field :verified_at, :utc_datetime_usec

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :source_artifact, ProductCompareSchemas.Specs.SourceArtifact

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(identifier, attrs) do
    identifier
    |> cast(attrs, [
      :product_id,
      :scheme,
      :normalized_value,
      :display_value,
      :verification_status,
      :source_artifact_id,
      :verified_at
    ])
    |> validate_required([
      :product_id,
      :scheme,
      :normalized_value,
      :display_value,
      :verification_status
    ])
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:source_artifact_id)
    |> unique_constraint([:scheme, :normalized_value],
      name: :product_identifiers_validated_scheme_value_uq
    )
  end
end
