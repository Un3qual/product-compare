defmodule ProductCompareSchemas.Alerts.AlertEvent do
  use ProductCompareSchemas.Schema, :relational

  @type t :: %__MODULE__{}

  schema "alert_events" do
    field :entropy_id, Ecto.UUID
    field :rule_type, Ecto.Enum, values: ProductCompareSchemas.Alerts.PriceWatchRule.rule_types()
    field :currency, :string
    field :item_price, :decimal
    field :shipping, :decimal
    field :landed_price, :decimal
    field :observed_at, :utc_datetime_usec
    field :fact_snapshot, :map
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
      :fact_snapshot,
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
      :observed_at,
      :fact_snapshot
    ])
    |> unique_constraint([:watch_rule_id, :triggering_price_point_id],
      name: :alert_events_watch_observation_uq
    )
  end

  @spec read_changeset(t(), DateTime.t()) :: Ecto.Changeset.t()
  def read_changeset(event, read_at), do: change(event, read_at: read_at)
end
