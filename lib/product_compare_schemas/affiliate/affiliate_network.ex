defmodule ProductCompareSchemas.Affiliate.AffiliateNetwork do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "affiliate_networks" do
    field :entropy_id, Ecto.UUID
    field :name, :string

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(network, attrs) do
    network
    |> cast(attrs, [:name])
    |> validate_required([:name])
    |> unique_constraint(:name)
  end
end
