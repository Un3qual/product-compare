defmodule ProductCompareSchemas.CommerceAttribution.CommerceConversion do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.CurrencyCode
  alias ProductCompareSchemas.Schema

  @statuses [:pending, :approved, :reversed, :paid]
  @attribution_confidences [:high, :low, :unmatched]

  @type t :: %__MODULE__{}

  schema "commerce_conversions" do
    field :entropy_id, Ecto.UUID
    field :source_network, :string, virtual: true
    field :network_conversion_ref, :string
    field :public_click_id, Ecto.UUID
    field :network_click_ref, :string
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :currency, CurrencyCode, source: :currency_id
    field :order_amount, :decimal
    field :commission_amount, :decimal
    field :commission_rate, :decimal

    field :attribution_confidence, Ecto.Enum,
      values: @attribution_confidences,
      default: :unmatched

    field :data_freshness_at, :utc_datetime_usec
    field :purchased_at, :utc_datetime_usec
    field :reported_at, :utc_datetime_usec
    field :raw_payload, :map, default: %{}

    belongs_to :click_session, ProductCompareSchemas.CommerceAttribution.CommerceClickSession
    belongs_to :affiliate_network, ProductCompareSchemas.Affiliate.AffiliateNetwork
    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant
    belongs_to :affiliate_program, ProductCompareSchemas.Affiliate.AffiliateProgram
    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(conversion, attrs) do
    attrs =
      Schema.normalize_non_finite_decimals(attrs, [
        :order_amount,
        :commission_amount,
        :commission_rate
      ])

    conversion
    |> cast(attrs, [
      :source_network,
      :affiliate_network_id,
      :network_conversion_ref,
      :click_session_id,
      :public_click_id,
      :network_click_ref,
      :merchant_id,
      :affiliate_program_id,
      :product_id,
      :merchant_product_id,
      :status,
      :currency,
      :order_amount,
      :commission_amount,
      :commission_rate,
      :attribution_confidence,
      :data_freshness_at,
      :purchased_at,
      :reported_at,
      :raw_payload
    ])
    |> validate_required([
      :source_network,
      :affiliate_network_id,
      :network_conversion_ref,
      :status,
      :currency,
      :attribution_confidence,
      :reported_at
    ])
    |> validate_number(:order_amount, greater_than_or_equal_to: 0)
    |> validate_number(:commission_amount, greater_than_or_equal_to: 0)
    |> validate_number(:commission_rate, greater_than_or_equal_to: 0)
    |> validate_raw_payload()
    |> unique_constraint([:affiliate_network_id, :network_conversion_ref],
      name: :commerce_conversions_source_ref_uq
    )
    |> foreign_key_constraint(:click_session_id)
    |> foreign_key_constraint(:affiliate_network_id)
    |> foreign_key_constraint(:merchant_id)
    |> foreign_key_constraint(:affiliate_program_id)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:merchant_product_id)
    |> foreign_key_constraint(:currency, name: :commerce_conversions_currency_id_fkey)
    |> check_constraint(:order_amount, name: :commerce_conversions_amounts_non_negative)
  end

  defp validate_raw_payload(changeset) do
    case get_field(changeset, :raw_payload) do
      nil -> put_change(changeset, :raw_payload, %{})
      value when is_map(value) -> changeset
      _value -> add_error(changeset, :raw_payload, "must be a map")
    end
  end
end
