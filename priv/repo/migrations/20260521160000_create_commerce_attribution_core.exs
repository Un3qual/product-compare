defmodule ProductCompare.Repo.Migrations.CreateCommerceAttributionCore do
  use Ecto.Migration

  def change do
    create table(:commerce_links) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :merchant_id, references(:merchants, type: :bigint, on_delete: :delete_all), null: false

      add :affiliate_program_id,
          references(:affiliate_programs, type: :bigint, on_delete: :restrict)

      add :destination_url, :text, null: false
      add :link_type, :commerce_link_type, null: false, default: "affiliate"
      add :campaign_params, :map, null: false, default: %{}
      add :backfilled_from_affiliate_links, :boolean, null: false, default: false
      add :is_active, :boolean, null: false, default: true

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:commerce_links, [:entropy_id])
    create index(:commerce_links, [:merchant_id], name: :commerce_links_merchant_idx)
    create index(:commerce_links, [:affiliate_program_id], name: :commerce_links_program_idx)

    execute(
      """
      CREATE UNIQUE INDEX commerce_links_business_key_uq
      ON commerce_links (destination_url, COALESCE(affiliate_program_id, 0), merchant_id, link_type)
      """,
      "DROP INDEX commerce_links_business_key_uq"
    )

    create constraint(:commerce_links, :commerce_links_affiliate_program_check,
             check: "link_type != 'affiliate' OR affiliate_program_id IS NOT NULL"
           )

    create table(:commerce_click_sessions) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :click_id, :uuid, null: false

      add :commerce_link_id, references(:commerce_links, type: :bigint, on_delete: :delete_all),
        null: false

      add :user_id, references(:users, type: :bigint, on_delete: :nilify_all)
      add :anonymous_id, :text
      add :source_surface, :commerce_source_surface, null: false, default: "web"
      add :referrer, :text
      add :user_agent, :text
      add :ip_address, :inet

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:commerce_click_sessions, [:entropy_id])
    create unique_index(:commerce_click_sessions, [:click_id])

    create index(:commerce_click_sessions, [:commerce_link_id],
             name: :commerce_click_sessions_link_idx
           )

    create index(:commerce_click_sessions, [:user_id], name: :commerce_click_sessions_user_idx)

    create table(:commerce_conversions) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :affiliate_network_id,
          references(:affiliate_networks, type: :bigint, on_delete: :restrict),
          null: false

      add :network_conversion_ref, :text, null: false

      add :click_session_id,
          references(:commerce_click_sessions, type: :bigint, on_delete: :nilify_all)

      add :public_click_id, :uuid
      add :network_click_ref, :text
      add :merchant_id, references(:merchants, type: :bigint, on_delete: :nilify_all)

      add :affiliate_program_id,
          references(:affiliate_programs, type: :bigint, on_delete: :nilify_all)

      add :product_id, references(:products, type: :bigint, on_delete: :nilify_all)

      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :nilify_all)

      add :status, :commerce_conversion_status, null: false, default: "pending"
      add :currency_id, references(:currencies, type: :integer, on_delete: :restrict), null: false
      add :order_amount, :decimal
      add :commission_amount, :decimal
      add :commission_rate, :decimal

      add :attribution_confidence, :commerce_attribution_confidence,
        null: false,
        default: "unmatched"

      add :data_freshness_at, :utc_datetime_usec
      add :purchased_at, :utc_datetime_usec
      add :reported_at, :utc_datetime_usec, null: false
      add :raw_payload, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:commerce_conversions, [:entropy_id])

    create unique_index(:commerce_conversions, [:affiliate_network_id, :network_conversion_ref],
             name: :commerce_conversions_source_ref_uq
           )

    create index(:commerce_conversions, [:click_session_id],
             name: :commerce_conversions_click_idx
           )

    create index(:commerce_conversions, [:public_click_id],
             name: :commerce_conversions_public_click_idx
           )

    create index(:commerce_conversions, [:merchant_id], name: :commerce_conversions_merchant_idx)

    create index(:commerce_conversions, [:merchant_product_id],
             name: :commerce_conversions_mp_idx
           )

    create constraint(:commerce_conversions, :commerce_conversions_amounts_non_negative,
             check: """
             (order_amount IS NULL OR order_amount >= 0) AND
             (commission_amount IS NULL OR commission_amount >= 0) AND
             (commission_rate IS NULL OR commission_rate >= 0)
             """
           )

    create table(:purchase_price_facts) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :conversion_id,
          references(:commerce_conversions, type: :bigint, on_delete: :delete_all), null: false

      add :listed_price_at_click, :decimal
      add :reported_paid_price, :decimal, null: false
      add :shipping_amount, :decimal
      add :tax_amount, :decimal
      add :discount_amount, :decimal
      add :currency_id, references(:currencies, type: :integer, on_delete: :restrict), null: false
      add :price_observation_id, references(:price_points, type: :bigint, on_delete: :nilify_all)
      add :observed_at, :utc_datetime_usec
      add :observed_price, :decimal
      add :price_delta, :decimal

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:purchase_price_facts, [:entropy_id])
    create unique_index(:purchase_price_facts, [:conversion_id])

    create index(:purchase_price_facts, [:price_observation_id],
             name: :purchase_price_facts_observation_idx
           )

    create constraint(:purchase_price_facts, :purchase_price_facts_amounts_non_negative,
             check: """
             reported_paid_price >= 0 AND
             (listed_price_at_click IS NULL OR listed_price_at_click >= 0) AND
             (shipping_amount IS NULL OR shipping_amount >= 0) AND
             (tax_amount IS NULL OR tax_amount >= 0) AND
             (discount_amount IS NULL OR discount_amount >= 0) AND
             (observed_price IS NULL OR observed_price >= 0)
             """
           )
  end
end
