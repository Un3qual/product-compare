defmodule ProductCompareSchemas.Specs.ProductAttributeClaim do
  use ProductCompareSchemas.Schema, :relational

  @source_types [:scrape, :user, :import, :derived]
  @statuses [:proposed, :accepted, :rejected, :superseded]
  @typed_value_fields [
    :value_bool,
    :value_int,
    :value_num,
    :value_text,
    :value_date,
    :value_ts,
    :enum_option_id,
    :value_json
  ]

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
    |> validate_single_typed_value()
    |> validate_numeric_fields()
    |> validate_numeric_range_order()
  end

  defp validate_single_typed_value(changeset) do
    typed_value_count =
      Enum.count(@typed_value_fields, fn field ->
        not is_nil(get_field(changeset, field))
      end)

    if typed_value_count == 1 do
      changeset
    else
      add_error(changeset, :base, "must contain exactly one typed value")
    end
  end

  defp validate_numeric_fields(changeset) do
    value_num = get_field(changeset, :value_num)
    unit_id = get_field(changeset, :unit_id)
    value_num_base = get_field(changeset, :value_num_base)
    value_num_base_min = get_field(changeset, :value_num_base_min)
    value_num_base_max = get_field(changeset, :value_num_base_max)

    cond do
      is_nil(value_num) and
          Enum.any?(
            [unit_id, value_num_base, value_num_base_min, value_num_base_max],
            &(!is_nil(&1))
          ) ->
        add_error(
          changeset,
          :value_num,
          "must be present when numeric companion fields are provided"
        )

      is_nil(value_num) ->
        changeset

      true ->
        changeset
        |> require_present_when_numeric(:unit_id, unit_id)
        |> require_present_when_numeric(:value_num_base, value_num_base)
    end
  end

  defp validate_numeric_range_order(changeset) do
    min_value = get_field(changeset, :value_num_base_min)
    max_value = get_field(changeset, :value_num_base_max)

    cond do
      is_nil(min_value) or is_nil(max_value) ->
        changeset

      Decimal.compare(min_value, max_value) == :gt ->
        add_error(
          changeset,
          :value_num_base_min,
          "must be less than or equal to value_num_base_max"
        )

      true ->
        changeset
    end
  end

  defp require_present_when_numeric(changeset, _field, value) when not is_nil(value),
    do: changeset

  defp require_present_when_numeric(changeset, field, nil) do
    add_error(changeset, field, "must be present when value_num is set")
  end
end
