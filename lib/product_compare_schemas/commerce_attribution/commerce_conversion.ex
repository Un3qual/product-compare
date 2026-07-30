defmodule ProductCompareSchemas.CommerceAttribution.CommerceConversion do
  use ProductCompareSchemas.Schema, :relational

  @networks [:impact, :awin, :rakuten, :cj, :amazon_associates]
  @statuses [:pending, :approved, :reversed, :paid]
  @attribution_confidences [:high, :low, :unmatched]

  @type t :: %__MODULE__{}

  schema "commerce_conversions" do
    field :entropy_id, Ecto.UUID
    field :source_network, Ecto.Enum, values: @networks
    field :network_conversion_ref, :string
    field :public_click_id, Ecto.UUID
    field :network_click_ref, :string
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :currency, :string
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
    belongs_to :merchant, ProductCompareSchemas.Pricing.Merchant
    belongs_to :affiliate_program, ProductCompareSchemas.Affiliate.AffiliateProgram
    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(conversion, attrs) do
    conversion
    |> cast(attrs, [
      :source_network,
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
    |> update_change(:currency, &upcase_currency/1)
    |> validate_required([
      :source_network,
      :network_conversion_ref,
      :status,
      :currency,
      :attribution_confidence,
      :reported_at
    ])
    |> validate_format(:currency, ~r/^[A-Z]{3}$/, message: "must be a valid ISO 4217 code")
    |> validate_number(:order_amount, greater_than_or_equal_to: 0)
    |> validate_number(:commission_amount, greater_than_or_equal_to: 0)
    |> validate_number(:commission_rate, greater_than_or_equal_to: 0)
    |> validate_raw_payload()
    |> unique_constraint([:source_network, :network_conversion_ref],
      name: :commerce_conversions_source_ref_uq
    )
    |> foreign_key_constraint(:click_session_id)
    |> foreign_key_constraint(:merchant_id)
    |> foreign_key_constraint(:affiliate_program_id)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:merchant_product_id)
    |> check_constraint(:source_network, name: :commerce_conversions_source_network_check)
    |> check_constraint(:currency, name: :commerce_conversions_currency_check)
    |> check_constraint(:order_amount, name: :commerce_conversions_amounts_non_negative)
  end

  defp upcase_currency(nil), do: nil
  defp upcase_currency(currency), do: String.upcase(currency)

  defp validate_raw_payload(changeset) do
    case get_field(changeset, :raw_payload) do
      nil -> put_change(changeset, :raw_payload, %{})
      value when is_map(value) -> changeset
      _value -> add_error(changeset, :raw_payload, "must be a map")
    end
  end
end
