defmodule ProductCompareSchemas.Ingestion.MerchantSourceIdentity do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "merchant_source_identities" do
    field :entropy_id, Ecto.UUID
    field :merchant_identifier, :string
    field :merchant_name, :string
    field :merchant_domain, :string
    field :last_seen_at, :utc_datetime_usec

    belongs_to :source, ProductCompareSchemas.Specs.Source
    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(identity, attrs) do
    identity
    |> cast(attrs, [
      :source_id,
      :merchant_id,
      :merchant_identifier,
      :merchant_name,
      :merchant_domain,
      :last_seen_at
    ])
    |> validate_required([:source_id, :merchant_id, :merchant_identifier, :last_seen_at])
    |> unique_constraint([:source_id, :merchant_identifier],
      name: :merchant_source_identities_source_identifier_uq
    )
    |> foreign_key_constraint(:source_id)
    |> foreign_key_constraint(:merchant_id)
  end
end
