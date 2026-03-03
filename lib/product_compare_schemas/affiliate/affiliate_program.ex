defmodule ProductCompareSchemas.Affiliate.AffiliateProgram do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "affiliate_programs" do
    field :entropy_id, Ecto.UUID
    field :program_code, :string
    field :status, :string

    belongs_to :affiliate_network, ProductCompareSchemas.Affiliate.AffiliateNetwork
    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(program, attrs) do
    program
    |> cast(attrs, [:affiliate_network_id, :merchant_id, :program_code, :status])
    |> validate_required([:affiliate_network_id, :merchant_id])
    |> unique_constraint([:affiliate_network_id, :merchant_id],
      name: :affiliate_programs_net_merchant_uq
    )
  end
end
