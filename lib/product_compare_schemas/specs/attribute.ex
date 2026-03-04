defmodule ProductCompareSchemas.Specs.Attribute do
  use ProductCompareSchemas.Schema, :relational

  @data_types [:bool, :int, :numeric, :text, :enum, :date, :timestamp, :json]

  @type t :: %__MODULE__{}

  schema "attributes" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :display_name, :string
    field :data_type, Ecto.Enum, values: @data_types
    field :is_multivalued, :boolean
    field :is_filterable, :boolean
    field :is_derived, :boolean
    field :description, :string

    belongs_to :dimension, ProductCompareSchemas.Specs.Dimension
    belongs_to :enum_set, ProductCompareSchemas.Specs.EnumSet

    timestamps(updated_at: false)
  end

  @spec data_types() :: [atom()]
  def data_types, do: @data_types

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(attribute, attrs) do
    attribute
    |> cast(attrs, [
      :code,
      :display_name,
      :data_type,
      :dimension_id,
      :enum_set_id,
      :is_multivalued,
      :is_filterable,
      :is_derived,
      :description
    ])
    |> validate_required([:code, :display_name, :data_type])
    |> unique_constraint(:code)
    |> validate_enum_set_consistency()
    |> foreign_key_constraint(:dimension_id)
    |> foreign_key_constraint(:enum_set_id)
  end

  defp validate_enum_set_consistency(changeset) do
    data_type = get_field(changeset, :data_type)
    enum_set_id = get_field(changeset, :enum_set_id)

    cond do
      data_type == :enum and is_nil(enum_set_id) ->
        add_error(changeset, :enum_set_id, "must be present when data_type is enum")

      data_type != :enum and not is_nil(data_type) and not is_nil(enum_set_id) ->
        add_error(changeset, :enum_set_id, "must be nil when data_type is not enum")

      true ->
        changeset
    end
  end
end
