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
    |> validate_discount_invariants()
    |> check_constraint(:discount_value, name: :coupons_discount_shape_check)
    |> check_constraint(:valid_to, name: :coupons_validity_window_check)
    |> foreign_key_constraint(:merchant_id)
    |> foreign_key_constraint(:affiliate_network_id)
    |> foreign_key_constraint(:artifact_id)
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

  defp validate_discount_invariants(changeset) do
    discount_type = get_field(changeset, :discount_type)
    discount_value = get_field(changeset, :discount_value)
    currency = get_field(changeset, :currency)

    changeset
    |> validate_discount_value_presence(discount_type, discount_value)
    |> validate_discount_value_absence(discount_type, discount_value)
    |> validate_amount_currency(discount_type, currency)
    |> validate_discount_value_bounds(discount_type, discount_value)
  end

  defp validate_discount_value_presence(changeset, discount_type, discount_value)
       when discount_type in [:percent, :amount] and is_nil(discount_value) do
    add_error(changeset, :discount_value, "is required for #{discount_type} discounts")
  end

  defp validate_discount_value_presence(changeset, _discount_type, _discount_value), do: changeset

  defp validate_discount_value_absence(changeset, discount_type, discount_value)
       when discount_type in [:free_shipping, :other] and not is_nil(discount_value) do
    add_error(changeset, :discount_value, "must be empty for #{discount_type} discounts")
  end

  defp validate_discount_value_absence(changeset, _discount_type, _discount_value), do: changeset

  defp validate_amount_currency(changeset, :amount, currency) when is_nil(currency) do
    add_error(changeset, :currency, "is required for amount discounts")
  end

  defp validate_amount_currency(changeset, _discount_type, _currency), do: changeset

  defp validate_discount_value_bounds(changeset, _discount_type, nil), do: changeset

  defp validate_discount_value_bounds(changeset, :percent, discount_value) do
    if decimal_gt?(discount_value, 0) and decimal_lte?(discount_value, 100) do
      changeset
    else
      add_error(
        changeset,
        :discount_value,
        "must be greater than 0 and less than or equal to 100 for percent discounts"
      )
    end
  end

  defp validate_discount_value_bounds(changeset, :amount, discount_value) do
    if decimal_gt?(discount_value, 0) do
      changeset
    else
      add_error(changeset, :discount_value, "must be greater than 0 for amount discounts")
    end
  end

  defp validate_discount_value_bounds(changeset, _discount_type, _discount_value), do: changeset

  defp decimal_gt?(value, threshold),
    do: Decimal.compare(to_decimal(value), Decimal.new(threshold)) == :gt

  defp decimal_lte?(value, threshold),
    do: Decimal.compare(to_decimal(value), Decimal.new(threshold)) in [:lt, :eq]

  defp to_decimal(%Decimal{} = value), do: value
  defp to_decimal(value) when is_integer(value), do: Decimal.new(value)
  defp to_decimal(value) when is_float(value), do: Decimal.from_float(value)
  defp to_decimal(value) when is_binary(value), do: Decimal.new(value)
end
