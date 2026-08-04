defmodule ProductCompare.Repo.Migrations.InitExtensions do
  use Ecto.Migration

  @domain_enum_types [
    user_token_context: ~w(session confirm reset_password),
    product_taxon_source_type: ~w(scrape user derived editorial),
    attribute_data_type: ~w(bool int numeric text enum date timestamp json),
    product_attribute_claim_source_type: ~w(scrape user import derived),
    product_attribute_claim_status: ~w(proposed accepted rejected superseded),
    coupon_discount_type: ~w(percent amount free_shipping other),
    commerce_link_type: ~w(affiliate non_affiliate),
    commerce_source_surface: ~w(web api extension),
    commerce_conversion_status: ~w(pending approved reversed paid),
    commerce_attribution_confidence: ~w(high low unmatched),
    ingestion_run_status: ~w(running succeeded failed),
    ingestion_reconciliation_status:
      ~w(not_requested pending succeeded skipped_partial skipped_failed skipped_superseded),
    product_identifier_scheme: ~w(gtin mpn),
    product_identifier_verification_status: ~w(unverified validated rejected),
    product_media_role: ~w(primary gallery),
    category_mapping_status: ~w(pending mapped dismissed),
    specification_correction_status: ~w(pending accepted rejected),
    price_watch_rule_type: ~w(target_price percentage_drop back_in_stock newly_available),
    alert_delivery_transport: ~w(in_app email webhook),
    alert_delivery_state: ~w(pending delivered failed),
    community_moderation_status: ~w(pending published hidden rejected removed),
    community_report_status: ~w(pending resolved dismissed),
    community_content_type: ~w(review question answer),
    community_action_kind: ~w(review question answer report),
    cj_program_stage: ~w(new considering selected applied accepted not_pursuing declined),
    offer_freshness: ~w(fresh aging stale unobserved),
    recommendation_profile: ~w(lowest_current_cost best_value),
    recommendation_status: ~w(winner tie insufficient_evidence)
  ]

  def change do
    execute(
      """
      DO $$
      BEGIN
        IF current_setting('server_version_num')::int < 180000 THEN
          RAISE EXCEPTION 'PostgreSQL 18+ is required for uuidv7() support';
        END IF;
      END
      $$;
      """,
      "SELECT 1"
    )

    execute("CREATE EXTENSION IF NOT EXISTS citext", "DROP EXTENSION IF EXISTS citext")

    Enum.each(@domain_enum_types, fn {name, values} ->
      labels = Enum.map_join(values, ", ", &"'#{&1}'")
      execute("CREATE TYPE #{name} AS ENUM (#{labels})", "DROP TYPE #{name}")
    end)

    create table(:currencies, primary_key: false) do
      add :id, :integer, primary_key: true
      add :code, :string, size: 3, null: false
      add :numeric_code, :string, size: 3, null: false
      add :minor_unit, :smallint, null: false
      add :name, :text, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:currencies, [:code])
    create unique_index(:currencies, [:numeric_code])

    execute(
      """
      INSERT INTO currencies
        (id, code, numeric_code, minor_unit, name, inserted_at, updated_at)
      VALUES
        (124, 'CAD', '124', 2, 'Canadian dollar', now(), now()),
        (826, 'GBP', '826', 2, 'Pound sterling', now(), now()),
        (840, 'USD', '840', 2, 'United States dollar', now(), now()),
        (978, 'EUR', '978', 2, 'Euro', now(), now())
      """,
      "DELETE FROM currencies"
    )

    create table(:recommendation_algorithms, primary_key: false) do
      add :id, :integer, primary_key: true
      add :code, :text, null: false
      add :name, :text, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:recommendation_algorithms, [:code])

    execute(
      """
      INSERT INTO recommendation_algorithms
        (id, code, name, inserted_at, updated_at)
      VALUES
        (1, 'lowest-current-cost-v1', 'Lowest current cost v1', now(), now()),
        (2, 'best-supported-current-cost-v1', 'Best supported current cost v1', now(), now())
      """,
      "DELETE FROM recommendation_algorithms"
    )

    create table(:affiliate_program_statuses, primary_key: false) do
      add :id, :integer, primary_key: true
      add :code, :string, null: false
      add :name, :text, null: false
      add :enabled, :boolean, null: false, default: true

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:affiliate_program_statuses, [:code])

    execute(
      """
      INSERT INTO affiliate_program_statuses
        (id, code, name, enabled, inserted_at, updated_at)
      VALUES
        (1, 'active', 'Active', true, now(), now()),
        (2, 'paused', 'Paused', true, now(), now())
      """,
      "DELETE FROM affiliate_program_statuses"
    )

    create table(:source_kinds, primary_key: false) do
      add :id, :integer, primary_key: true
      add :code, :text, null: false
      add :name, :text, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:source_kinds, [:code])

    execute(
      """
      INSERT INTO source_kinds (id, code, name, inserted_at, updated_at)
      VALUES
        (1, 'affiliate_feed', 'Affiliate feed', now(), now()),
        (2, 'merchant_feed', 'Merchant feed', now(), now()),
        (3, 'manufacturer', 'Manufacturer', now(), now()),
        (4, 'web', 'Web', now(), now()),
        (5, 'feed', 'Feed', now(), now()),
        (6, 'affiliate', 'Affiliate', now(), now())
      """,
      "DELETE FROM source_kinds"
    )

    create table(:integration_providers, primary_key: false) do
      add :id, :integer, primary_key: true
      add :code, :text, null: false
      add :name, :text, null: false
      add :enabled, :boolean, null: false, default: true

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:integration_providers, [:code])

    execute(
      """
      INSERT INTO integration_providers (id, code, name, enabled, inserted_at, updated_at)
      VALUES
        (1, 'cj', 'CJ', true, now(), now()),
        (2, 'awin', 'Awin', true, now(), now()),
        (3, 'impact', 'Impact', true, now(), now()),
        (4, 'shopify', 'Shopify', true, now(), now())
      """,
      "DELETE FROM integration_providers"
    )

    create table(:integration_surfaces, primary_key: false) do
      add :id, :integer, primary_key: true

      add :provider_id,
          references(:integration_providers, type: :integer, on_delete: :restrict),
          null: false

      add :code, :text, null: false
      add :name, :text, null: false
      add :enabled, :boolean, null: false, default: true

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:integration_surfaces, [:provider_id, :code])

    execute(
      """
      INSERT INTO integration_surfaces
        (id, provider_id, code, name, enabled, inserted_at, updated_at)
      VALUES
        (1, 1, 'shoppingProducts', 'Shopping products', true, now(), now()),
        (2, 1, 'shoppingProductFeeds', 'Shopping product feeds', true, now(), now())
      """,
      "DELETE FROM integration_surfaces"
    )

    create table(:provider_feed_types, primary_key: false) do
      add :id, :integer, primary_key: true

      add :provider_id,
          references(:integration_providers, type: :integer, on_delete: :restrict),
          null: false

      add :code, :text, null: false
      add :name, :text, null: false
      add :enabled, :boolean, null: false, default: true

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:provider_feed_types, [:provider_id, :code])

    execute(
      """
      INSERT INTO provider_feed_types
        (id, provider_id, code, name, enabled, inserted_at, updated_at)
      VALUES
        (1, 1, 'SHOPPING', 'Shopping', true, now(), now()),
        (2, 1, 'PRODUCT', 'Product', true, now(), now())
      """,
      "DELETE FROM provider_feed_types"
    )

    create table(:countries, primary_key: false) do
      add :id, :integer, primary_key: true
      add :code, :string, size: 2, null: false
      add :numeric_code, :string, size: 3, null: false
      add :name, :text, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:countries, [:code])
    create unique_index(:countries, [:numeric_code])

    execute(
      """
      INSERT INTO countries (id, code, numeric_code, name, inserted_at, updated_at)
      VALUES
        (124, 'CA', '124', 'Canada', now(), now()),
        (840, 'US', '840', 'United States of America', now(), now())
      """,
      "DELETE FROM countries"
    )

    create table(:languages, primary_key: false) do
      add :id, :integer, primary_key: true
      add :code, :string, size: 2, null: false
      add :name, :text, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:languages, [:code])

    execute(
      """
      INSERT INTO languages (id, code, name, inserted_at, updated_at)
      VALUES
        (1, 'EN', 'English', now(), now()),
        (2, 'FR', 'French', now(), now())
      """,
      "DELETE FROM languages"
    )
  end
end
