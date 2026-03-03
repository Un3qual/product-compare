defmodule ProductCompareSchemas.Affiliate.Coupon do
  use ProductCompareSchemas.Schema, :relational

  @discount_types [:percent, :amount, :free_shipping, :other]

  @type t :: %__MODULE__{}

  schema "coupons" do
    field :entropy_id, Ecto.UUID
    field :code, :string
    field :description, :string
    field :discount_type, Ecto.Enum, values: @discount_types
    field :discount_value, :decimal
    field :currency, :string
    field :valid_from, :utc_datetime_usec
    field :valid_to, :utc_datetime_usec
    field :terms, :string

    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant
    belongs_to :affiliate_network, ProductCompareSchemas.Affiliate.AffiliateNetwork
    belongs_to :artifact, ProductCompareSchemas.Specs.SourceArtifact

    timestamps()
  end

  @spec discount_types() :: [atom()]
  def discount_types, do: @discount_types

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(coupon, attrs) do
    coupon
    |> cast(attrs, [
      :merchant_id,
      :affiliate_network_id,
      :code,
      :description,
      :discount_type,
      :discount_value,
      :currency,
      :valid_from,
      :valid_to,
      :terms,
      :artifact_id
    ])
    |> validate_required([:merchant_id, :code, :discount_type])
    |> validate_length(:currency, is: 3)
    |> validate_coupon_window()
  end

  defp validate_coupon_window(changeset) do
    valid_from = get_field(changeset, :valid_from)
    valid_to = get_field(changeset, :valid_to)

    if valid_from && valid_to && DateTime.compare(valid_to, valid_from) == :lt do
      add_error(changeset, :valid_to, "must be after or equal to valid_from")
    else
      changeset
    end
  end
end
