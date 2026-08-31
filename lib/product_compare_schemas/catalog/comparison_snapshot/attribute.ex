defmodule ProductCompareSchemas.Catalog.ComparisonSnapshot.Attribute do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.FiniteDecimal

  @source_types [:scrape, :user, :import, :derived]
  @type t :: %__MODULE__{}

  schema "comparison_snapshot_attributes" do
    field :position, :integer
    field :attribute_id, :integer
    field :claim_id, :integer
    field :code, :string
    field :display_name, :string
    field :value_text, :string
    field :source_type, Ecto.Enum, values: @source_types
    field :confidence, FiniteDecimal

    belongs_to :snapshot_product, ProductCompareSchemas.Catalog.ComparisonSnapshot.Product

    has_many :evidence, ProductCompareSchemas.Catalog.ComparisonSnapshot.Evidence,
      foreign_key: :snapshot_attribute_id
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(attribute, attrs) do
    attribute
    |> cast(attrs, [
      :snapshot_product_id,
      :position,
      :attribute_id,
      :claim_id,
      :code,
      :display_name,
      :value_text,
      :source_type,
      :confidence
    ])
    |> validate_required([
      :snapshot_product_id,
      :position,
      :attribute_id,
      :claim_id,
      :code,
      :display_name,
      :value_text,
      :source_type
    ])
    |> validate_number(:position, greater_than: 0)
    |> validate_number(:confidence, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> unique_constraint([:snapshot_product_id, :position],
      name: :snapshot_attributes_product_position_uq
    )
    |> foreign_key_constraint(:snapshot_product_id)
    |> check_constraint(:position, name: :comparison_snapshot_attributes_position)
    |> check_constraint(:confidence,
      name: :comparison_snapshot_attributes_confidence_range
    )
  end
end
