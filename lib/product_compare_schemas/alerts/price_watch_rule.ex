defmodule ProductCompareSchemas.Alerts.PriceWatchRule do
  use ProductCompareSchemas.Schema, :relational

  alias ProductCompareSchemas.Reference.CurrencyCode

  @rule_types [:target_price, :percentage_drop, :back_in_stock, :newly_available]

  @type t :: %__MODULE__{}

  schema "price_watch_rules" do
    field :entropy_id, Ecto.UUID
    field :rule_type, Ecto.Enum, values: @rule_types
    field :currency, CurrencyCode, source: :currency_id
    field :target_amount, :decimal
    field :percentage_drop, :decimal
    field :baseline_landed_price, :decimal
    field :enabled, :boolean, default: true
    field :last_condition_met, :boolean, default: false
    field :last_evaluated_at, :utc_datetime_usec
    field :last_event_at, :utc_datetime_usec
    field :cooldown_seconds, :integer, default: 86_400

    belongs_to :user, ProductCompareSchemas.Accounts.User
    belongs_to :product, ProductCompareSchemas.Catalog.Product
    belongs_to :merchant_product, ProductCompareSchemas.Pricing.MerchantProduct
    belongs_to :baseline_price_point, ProductCompareSchemas.Pricing.PricePoint
    belongs_to :last_evaluated_price_point, ProductCompareSchemas.Pricing.PricePoint

    has_many :events, ProductCompareSchemas.Alerts.AlertEvent, foreign_key: :watch_rule_id

    timestamps()
  end

  @spec rule_types() :: [atom()]
  def rule_types, do: @rule_types

  @spec create_changeset(t(), map()) :: Ecto.Changeset.t()
  def create_changeset(watch, attrs) do
    watch
    |> cast(attrs, [
      :user_id,
      :product_id,
      :merchant_product_id,
      :rule_type,
      :currency,
      :target_amount,
      :percentage_drop,
      :baseline_price_point_id,
      :baseline_landed_price,
      :enabled,
      :last_condition_met,
      :cooldown_seconds
    ])
    |> validate_required([:user_id, :product_id, :rule_type, :currency, :enabled])
    |> validate_number(:target_amount, greater_than_or_equal_to: 0)
    |> validate_number(:percentage_drop, greater_than: 0, less_than_or_equal_to: 100)
    |> validate_number(:cooldown_seconds,
      greater_than_or_equal_to: 60,
      less_than_or_equal_to: 31_536_000
    )
    |> validate_rule_fields()
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:product_id)
    |> foreign_key_constraint(:merchant_product_id)
    |> foreign_key_constraint(:currency, name: :price_watch_rules_currency_id_fkey)
    |> check_constraint(:rule_type, name: :price_watch_rules_target_check)
    |> check_constraint(:cooldown_seconds, name: :price_watch_rules_cooldown_check)
  end

  @spec update_changeset(t(), map()) :: Ecto.Changeset.t()
  def update_changeset(watch, attrs) do
    watch
    |> cast(attrs, [:target_amount, :percentage_drop, :enabled, :cooldown_seconds])
    |> validate_number(:target_amount, greater_than_or_equal_to: 0)
    |> validate_number(:percentage_drop, greater_than: 0, less_than_or_equal_to: 100)
    |> validate_number(:cooldown_seconds,
      greater_than_or_equal_to: 60,
      less_than_or_equal_to: 31_536_000
    )
    |> validate_rule_fields()
    |> check_constraint(:rule_type, name: :price_watch_rules_target_check)
    |> check_constraint(:cooldown_seconds, name: :price_watch_rules_cooldown_check)
  end

  @spec evaluation_changeset(t(), map()) :: Ecto.Changeset.t()
  def evaluation_changeset(watch, attrs) do
    cast(watch, attrs, [
      :last_evaluated_price_point_id,
      :last_condition_met,
      :last_evaluated_at,
      :last_event_at
    ])
  end

  defp validate_rule_fields(changeset) do
    case get_field(changeset, :rule_type) do
      :target_price ->
        changeset
        |> validate_required([:target_amount])
        |> require_nil(:percentage_drop)

      :percentage_drop ->
        changeset
        |> validate_required([:percentage_drop, :baseline_landed_price])
        |> require_nil(:target_amount)

      rule when rule in [:back_in_stock, :newly_available] ->
        changeset
        |> require_nil(:target_amount)
        |> require_nil(:percentage_drop)

      _ ->
        changeset
    end
  end

  defp require_nil(changeset, field) do
    if is_nil(get_field(changeset, field)) do
      changeset
    else
      add_error(changeset, field, "must be empty for this rule type")
    end
  end
end
