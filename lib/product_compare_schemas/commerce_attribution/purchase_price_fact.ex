defmodule ProductCompareSchemas.CommerceAttribution.PurchasePriceFact do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "purchase_price_facts" do
    field :entropy_id, Ecto.UUID
    field :listed_price_at_click, :decimal
    field :reported_paid_price, :decimal
    field :shipping_amount, :decimal
    field :tax_amount, :decimal
    field :discount_amount, :decimal
    field :currency, :string
    field :observed_at, :utc_datetime_usec
    field :observed_price, :decimal
    field :price_delta, :decimal

    belongs_to :conversion, ProductCompareSchemas.CommerceAttribution.CommerceConversion
    belongs_to :price_observation, ProductCompareSchemas.Pricing.PricePoint

    timestamps()
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(price_fact, attrs) do
    price_fact
    |> cast(attrs, [
      :conversion_id,
      :listed_price_at_click,
      :reported_paid_price,
      :shipping_amount,
      :tax_amount,
      :discount_amount,
      :currency,
      :price_observation_id,
      :observed_at,
      :observed_price,
      :price_delta
    ])
    |> update_change(:currency, &upcase_currency/1)
    |> validate_required([:conversion_id, :reported_paid_price, :currency])
    |> validate_format(:currency, ~r/^[A-Z]{3}$/, message: "must be a valid ISO 4217 code")
    |> validate_number(:listed_price_at_click, greater_than_or_equal_to: 0)
    |> validate_number(:reported_paid_price, greater_than_or_equal_to: 0)
    |> validate_number(:shipping_amount, greater_than_or_equal_to: 0)
    |> validate_number(:tax_amount, greater_than_or_equal_to: 0)
    |> validate_number(:discount_amount, greater_than_or_equal_to: 0)
    |> validate_number(:observed_price, greater_than_or_equal_to: 0)
    |> unique_constraint(:conversion_id)
    |> foreign_key_constraint(:conversion_id)
    |> foreign_key_constraint(:price_observation_id)
    |> check_constraint(:currency, name: :purchase_price_facts_currency_check)
    |> check_constraint(:reported_paid_price, name: :purchase_price_facts_amounts_non_negative)
  end

  defp upcase_currency(nil), do: nil
  defp upcase_currency(currency), do: String.upcase(currency)
end
