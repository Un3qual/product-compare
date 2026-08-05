defmodule ProductCompare.Repo.Migrations.CreateComparisonSnapshots do
  use Ecto.Migration

  def change do
    create table(:comparison_snapshots) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :public_token, :string, null: false, size: 43
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :title, :string, size: 120
      add :version, :smallint, null: false
      add :captured_at, :timestamptz, precision: 6, size: 6, null: false
      add :revoked_at, :timestamptz, precision: 6, size: 6

      timestamps(type: :timestamptz, precision: 6, size: 6, updated_at: false)
    end

    create unique_index(:comparison_snapshots, [:entropy_id])
    create unique_index(:comparison_snapshots, [:public_token])
    create index(:comparison_snapshots, [:user_id, :inserted_at])

    create constraint(:comparison_snapshots, :comparison_snapshots_public_token_format,
             check: "public_token ~ '^[A-Za-z0-9_-]{43}$'"
           )

    create constraint(:comparison_snapshots, :comparison_snapshots_version_positive,
             check: "version > 0"
           )

    create table(:comparison_snapshot_products) do
      add :comparison_snapshot_id,
          references(:comparison_snapshots, type: :bigint, on_delete: :delete_all),
          null: false

      add :position, :smallint, null: false
      add :product_id, :bigint, null: false
      add :name, :text, null: false
      add :slug, :text, null: false
      add :description, :text
      add :model_number, :text
      add :brand_name, :text
    end

    create unique_index(:comparison_snapshot_products, [:comparison_snapshot_id, :position],
             name: :snapshot_products_snapshot_position_uq
           )

    create unique_index(:comparison_snapshot_products, [:comparison_snapshot_id, :product_id],
             name: :snapshot_products_snapshot_product_uq
           )

    create constraint(:comparison_snapshot_products, :comparison_snapshot_products_position,
             check: "position > 0"
           )

    create table(:comparison_snapshot_attributes) do
      add :snapshot_product_id,
          references(:comparison_snapshot_products, type: :bigint, on_delete: :delete_all),
          null: false

      add :position, :integer, null: false
      add :attribute_id, :bigint, null: false
      add :claim_id, :bigint, null: false
      add :code, :text, null: false
      add :display_name, :text, null: false
      add :value_text, :text, null: false
      add :source_type, :product_attribute_claim_source_type, null: false
      add :confidence, :decimal
    end

    create unique_index(:comparison_snapshot_attributes, [:snapshot_product_id, :position],
             name: :snapshot_attributes_product_position_uq
           )

    create constraint(:comparison_snapshot_attributes, :comparison_snapshot_attributes_position,
             check: "position > 0"
           )

    create constraint(
             :comparison_snapshot_attributes,
             :comparison_snapshot_attributes_confidence_range,
             check: "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)"
           )

    create table(:comparison_snapshot_evidence) do
      add :snapshot_attribute_id,
          references(:comparison_snapshot_attributes, type: :bigint, on_delete: :delete_all),
          null: false

      add :position, :integer, null: false
      add :artifact_id, :bigint, null: false
      add :excerpt, :text

      add :source_kind_id, references(:source_kinds, type: :integer, on_delete: :restrict),
        null: false

      add :source_name, :text, null: false
      add :source_domain, :text
      add :url, :text
      add :fetched_at, :timestamptz, precision: 6, size: 6, null: false
    end

    create unique_index(:comparison_snapshot_evidence, [:snapshot_attribute_id, :position],
             name: :snapshot_evidence_attribute_position_uq
           )

    create constraint(:comparison_snapshot_evidence, :comparison_snapshot_evidence_position,
             check: "position > 0"
           )

    create table(:comparison_snapshot_offers) do
      add :snapshot_product_id,
          references(:comparison_snapshot_products, type: :bigint, on_delete: :delete_all),
          null: false

      add :position, :integer, null: false
      add :merchant_product_id, :bigint, null: false
      add :price_point_id, :bigint, null: false
      add :merchant_name, :text, null: false
      add :merchant_domain, :text
      add :currency_id, references(:currencies, type: :integer, on_delete: :restrict), null: false
      add :item_price, :decimal, null: false
      add :shipping, :decimal, null: false
      add :landed_price, :decimal, null: false
      add :observed_at, :timestamptz, precision: 6, size: 6, null: false
      add :freshness, :offer_freshness, null: false
    end

    create unique_index(:comparison_snapshot_offers, [:snapshot_product_id, :position],
             name: :snapshot_offers_product_position_uq
           )

    create constraint(:comparison_snapshot_offers, :comparison_snapshot_offers_position,
             check: "position > 0"
           )

    create constraint(
             :comparison_snapshot_offers,
             :comparison_snapshot_offers_amounts_non_negative,
             check: "item_price >= 0 AND shipping >= 0 AND landed_price >= 0"
           )

    create table(:comparison_snapshot_recommendations) do
      add :comparison_snapshot_id,
          references(:comparison_snapshots, type: :bigint, on_delete: :delete_all),
          null: false

      add :profile, :recommendation_profile, null: false

      add :recommendation_algorithm_id,
          references(:recommendation_algorithms,
            type: :integer,
            on_delete: :restrict,
            name: :snapshot_recommendations_algorithm_fkey
          ),
          null: false

      add :evaluated_at, :timestamptz, precision: 6, size: 6, null: false
      add :status, :recommendation_status, null: false
      add :winner_product_id, :bigint
      add :currency_id, references(:currencies, type: :integer, on_delete: :restrict)
      add :missing_inputs, {:array, :text}, null: false, default: []
    end

    create unique_index(:comparison_snapshot_recommendations, [:comparison_snapshot_id],
             name: :snapshot_recommendations_snapshot_uq
           )

    create table(:comparison_snapshot_rankings) do
      add :snapshot_recommendation_id,
          references(:comparison_snapshot_recommendations, type: :bigint, on_delete: :delete_all),
          null: false

      add :rank, :integer, null: false
      add :product_id, :bigint, null: false
      add :product_name, :text, null: false
      add :landed_price, :decimal, null: false
      add :currency_id, references(:currencies, type: :integer, on_delete: :restrict), null: false
      add :price_point_id, :bigint, null: false
      add :merchant_product_id, :bigint, null: false
      add :claim_ids, {:array, :bigint}, null: false, default: []
      add :reasons, {:array, :text}, null: false, default: []
    end

    create unique_index(:comparison_snapshot_rankings, [:snapshot_recommendation_id, :rank],
             name: :snapshot_rankings_recommendation_rank_uq
           )

    create constraint(:comparison_snapshot_rankings, :comparison_snapshot_rankings_rank,
             check: "rank > 0"
           )

    create constraint(
             :comparison_snapshot_rankings,
             :comparison_snapshot_rankings_landed_price_non_negative,
             check: "landed_price >= 0"
           )
  end
end
