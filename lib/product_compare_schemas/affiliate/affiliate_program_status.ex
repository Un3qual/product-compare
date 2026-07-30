defmodule ProductCompareSchemas.Affiliate.AffiliateProgramStatus do
  use ProductCompareSchemas.Schema, :relational

  @primary_key {:id, :integer, autogenerate: false}
  @foreign_key_type :integer

  @type t :: %__MODULE__{}

  schema "affiliate_program_statuses" do
    field :code, :string
    field :name, :string
    field :enabled, :boolean

    timestamps()
  end
end
