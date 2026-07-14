defmodule ProductCompare.Repo.Migrations.AddPriceWatchesAndAlerts do
  use Ecto.Migration

  def change do
    create table(:price_watch_rules) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false

      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :delete_all)

      add :rule_type, :string, null: false
      add :currency, :string, null: false
      add :target_amount, :decimal
      add :percentage_drop, :decimal

      add :baseline_price_point_id,
          references(:price_points, type: :bigint, on_delete: :nilify_all)

      add :baseline_landed_price, :decimal
      add :enabled, :boolean, null: false, default: true

      add :last_evaluated_price_point_id,
          references(:price_points, type: :bigint, on_delete: :nilify_all)

      add :last_condition_met, :boolean, null: false, default: false
      add :last_evaluated_at, :utc_datetime_usec
      add :last_event_at, :utc_datetime_usec
      add :cooldown_seconds, :bigint, null: false, default: 86_400

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:price_watch_rules, [:entropy_id])
    create index(:price_watch_rules, [:user_id, :inserted_at])
    create index(:price_watch_rules, [:product_id, :currency, :enabled])
    create index(:price_watch_rules, [:merchant_product_id, :currency, :enabled])

    create constraint(:price_watch_rules, :price_watch_rules_type_check,
             check:
               "rule_type IN ('target_price', 'percentage_drop', 'back_in_stock', 'newly_available')"
           )

    create constraint(:price_watch_rules, :price_watch_rules_currency_check,
             check: "currency ~ '^[A-Z]{3}$'"
           )

    create constraint(:price_watch_rules, :price_watch_rules_target_check,
             check:
               "(rule_type = 'target_price' AND target_amount IS NOT NULL AND target_amount >= 0 AND percentage_drop IS NULL) OR (rule_type = 'percentage_drop' AND percentage_drop IS NOT NULL AND percentage_drop > 0 AND percentage_drop <= 100 AND target_amount IS NULL AND baseline_landed_price IS NOT NULL) OR (rule_type IN ('back_in_stock', 'newly_available') AND target_amount IS NULL AND percentage_drop IS NULL)"
           )

    create constraint(:price_watch_rules, :price_watch_rules_cooldown_check,
             check: "cooldown_seconds >= 60 AND cooldown_seconds <= 31536000"
           )

    create table(:alert_events) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :watch_rule_id, references(:price_watch_rules, type: :bigint, on_delete: :nilify_all)
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false

      add :triggering_price_point_id,
          references(:price_points, type: :bigint, on_delete: :restrict),
          null: false

      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :restrict),
          null: false

      add :rule_type, :string, null: false
      add :currency, :string, null: false
      add :item_price, :decimal, null: false
      add :shipping, :decimal, null: false
      add :landed_price, :decimal, null: false
      add :observed_at, :utc_datetime_usec, null: false
      add :fact_snapshot, :map, null: false
      add :read_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:alert_events, [:entropy_id])

    create unique_index(:alert_events, [:watch_rule_id, :triggering_price_point_id],
             name: :alert_events_watch_observation_uq
           )

    create index(:alert_events, [:user_id, :read_at, :inserted_at])

    create table(:alert_delivery_attempts) do
      add :alert_event_id, references(:alert_events, type: :bigint, on_delete: :delete_all),
        null: false

      add :transport, :string, null: false
      add :state, :string, null: false
      add :attempted_at, :utc_datetime_usec, null: false
      add :delivered_at, :utc_datetime_usec
      add :failure_category, :string

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:alert_delivery_attempts, [:alert_event_id, :transport],
             name: :alert_delivery_attempts_event_transport_uq
           )

    create constraint(:alert_delivery_attempts, :alert_delivery_transport_check,
             check: "transport IN ('in_app', 'email', 'webhook')"
           )

    create constraint(:alert_delivery_attempts, :alert_delivery_state_check,
             check: "state IN ('pending', 'delivered', 'failed')"
           )
  end
end
