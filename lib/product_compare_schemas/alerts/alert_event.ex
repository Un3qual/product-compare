defmodule ProductCompareSchemas.Alerts.AlertEvent do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.CurrencyCode

  @type t :: %__MODULE__{}

  schema "alert_events" do
    field :entropy_id, Ecto.UUID
    field :rule_type, Ecto.Enum, values: ProductCompareSchemas.Alerts.PriceWatchRule.rule_types()
    field :currency, CurrencyCode, source: :currency_id
    field :item_price, :decimal
    field :shipping, :decimal
    field :landed_price, :decimal
    field :observed_at, :utc_datetime_usec
    field :baseline_landed_price, :decimal
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :read_at, :utc_datetime_usec

    belongs_to :watch_rule, ProductCompareSchemas.Alerts.PriceWatchRule
    belongs_to :user, ProductCompareSchemas.Accounts.User
    belongs_to :triggering_price_point, ProductCompareSchemas.Pricing.PricePoint
    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct
    has_many :delivery_attempts, ProductCompareSchemas.Alerts.AlertDeliveryAttempt

    timestamps(updated_at: false)
  end

  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(event, attrs) do
    event
    |> cast(attrs, [
      :watch_rule_id,
      :user_id,
      :triggering_price_point_id,
      :merchant_product_id,
      :rule_type,
      :currency,
      :item_price,
      :shipping,
      :landed_price,
      :observed_at,
      :baseline_landed_price,
      :target_amount,
      :percentage_drop,
      :read_at
    ])
    |> validate_required([
      :watch_rule_id,
      :user_id,
      :triggering_price_point_id,
      :merchant_product_id,
      :rule_type,
      :currency,
      :item_price,
      :shipping,
      :landed_price,
      :observed_at
    ])
    |> unique_constraint([:watch_rule_id, :triggering_price_point_id],
      name: :alert_events_watch_observation_uq
    )
    |> foreign_key_constraint(:currency, name: :alert_events_currency_id_fkey)
  end

  @spec read_changeset(t(), DateTime.t()) :: Ecto.Changeset.t()
  def read_changeset(event, read_at), do: change(event, read_at: read_at)
end
