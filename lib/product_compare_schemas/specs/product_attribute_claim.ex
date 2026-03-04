defmodule ProductCompareSchemas.Specs.ProductAttributeClaim do
  use ProductCompareSchemas.Schema, :relational

  @source_types [:scrape, :user, :import, :derived]
  @statuses [:proposed, :accepted, :rejected, :superseded]

  @type t :: %__MODULE__{}

  schema "product_attribute_claims" do
    field :entropy_id, Ecto.UUID
    field :source_type, Ecto.Enum, values: @source_types
    field :status, Ecto.Enum, values: @statuses
    field :confidence, :decimal

    field :value_bool, :boolean
    field :value_int, :integer
    field :value_num, :decimal
    field :value_num_base, :decimal
    field :value_num_base_min, :decimal
    field :value_num_base_max, :decimal
    field :value_text, :string
    field :value_date, :date
    field :value_ts, :utc_datetime_usec
    field :value_json, :map

    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :attribute, ProductCompareSchemas.Specs.Attribute
    belongs_to :creator, ProductCompareSchemas.Accounts.User, foreign_key: :created_by
    belongs_to :unit, ProductCompareSchemas.Specs.Unit
    belongs_to :enum_option, ProductCompareSchemas.Specs.EnumOption

    belongs_to :supersedes_claim, __MODULE__
    belongs_to :derived_formula, ProductCompareSchemas.Specs.DerivedFormula

    has_many :evidence_links, ProductCompareSchemas.Specs.ClaimEvidence, foreign_key: :claim_id

    timestamps(updated_at: false)
  end

  @spec source_types() :: [atom()]
  def source_types, do: @source_types

  @spec statuses() :: [atom()]
  def statuses, do: @statuses

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(claim, attrs) do
    claim
    |> cast(attrs, [
      :product_id,
      :attribute_id,
      :source_type,
      :status,
      :created_by,
      :confidence,
      :value_bool,
      :value_int,
      :value_num,
      :unit_id,
      :value_num_base,
      :value_num_base_min,
      :value_num_base_max,
      :value_text,
      :value_date,
      :value_ts,
      :enum_option_id,
      :value_json,
      :supersedes_claim_id,
      :derived_formula_id
    ])
    |> validate_required([:product_id, :attribute_id, :source_type, :status])
    |> validate_number(:confidence, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
  end
end
