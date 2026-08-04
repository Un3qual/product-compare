defmodule ProductCompare.Repo.Migrations.AddProductEnrichment do
  use Ecto.Migration

  def change do
    create table(:product_media) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false

      add :source_artifact_id,
          references(:source_artifacts, type: :bigint, on_delete: :nilify_all)

      add :url, :text, null: false
      add :role, :product_media_role, null: false
      add :position, :integer, null: false, default: 0
      add :alt_text, :text
      add :observed_at, :timestamptz, precision: 6, size: 6, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:product_media, [:product_id, :url], name: :product_media_product_url_uq)

    create index(:product_media, [:product_id, :position], name: :product_media_product_order_idx)
    create unique_index(:product_media, [:entropy_id])

    create constraint(:product_media, :product_media_position_non_negative,
             check: "position >= 0"
           )

    alter table(:product_attribute_claims) do
      add :fingerprint, :binary
    end

    create unique_index(:product_attribute_claims, [:fingerprint],
             name: :product_attribute_claims_fingerprint_uq,
             where: "fingerprint IS NOT NULL"
           )

    create constraint(
             :product_attribute_claims,
             :product_attribute_claims_fingerprint_sha256_length,
             check: "fingerprint IS NULL OR octet_length(fingerprint) = 32"
           )

    create table(:category_mapping_candidates) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :source_id, references(:sources, type: :bigint, on_delete: :delete_all), null: false
      add :taxon_id, references(:taxons, type: :bigint, on_delete: :nilify_all)
      add :display_path, :text, null: false
      add :normalized_path, :text, null: false
      add :status, :category_mapping_status, null: false, default: "pending"
      add :observation_count, :integer, null: false, default: 1
      add :last_seen_at, :timestamptz, precision: 6, size: 6, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:category_mapping_candidates, [:source_id, :normalized_path],
             name: :category_mapping_candidates_source_path_uq
           )

    create index(:category_mapping_candidates, [:status, :last_seen_at],
             name: :category_mapping_candidates_status_seen_idx
           )

    create unique_index(:category_mapping_candidates, [:entropy_id])

    create constraint(
             :category_mapping_candidates,
             :category_mapping_candidates_observation_count_positive,
             check: "observation_count > 0"
           )
  end
end
