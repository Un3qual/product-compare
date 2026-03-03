defmodule ProductCompare.Repo.Migrations.CreateAccountsTaxonomyCatalog do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :email, :citext, null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:users, [:email])
    create unique_index(:users, [:entropy_id])

    create table(:user_reputation) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :points, :bigint, null: false, default: 0

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:user_reputation, [:user_id])
    create unique_index(:user_reputation, [:entropy_id])

    create table(:reputation_events) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :delta, :bigint, null: false
      add :reason, :text, null: false
      add :ref_table, :text
      add :ref_id, :bigint

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:reputation_events, [:user_id, :inserted_at], name: :rep_events_user_time_idx)
    create unique_index(:reputation_events, [:entropy_id])

    create table(:taxonomies) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :code, :text, null: false
      add :name, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:taxonomies, [:code])
    create unique_index(:taxonomies, [:entropy_id])

    create table(:taxons) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :taxonomy_id, references(:taxonomies, type: :bigint, on_delete: :delete_all),
        null: false

      add :parent_id, references(:taxons, type: :bigint, on_delete: :nilify_all)
      add :code, :text, null: false
      add :name, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:taxons, [:taxonomy_id, :code], name: :taxons_taxonomy_code_uq)
    create index(:taxons, [:taxonomy_id, :parent_id], name: :taxons_taxonomy_parent_idx)
    create unique_index(:taxons, [:entropy_id])

    create table(:taxon_closure) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :ancestor_id, references(:taxons, type: :bigint, on_delete: :delete_all), null: false
      add :descendant_id, references(:taxons, type: :bigint, on_delete: :delete_all), null: false
      add :depth, :integer, null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:taxon_closure, [:ancestor_id, :descendant_id],
             name: :taxon_closure_anc_desc_uq
           )

    create index(:taxon_closure, [:descendant_id], name: :taxon_closure_desc_idx)
    create index(:taxon_closure, [:ancestor_id, :depth], name: :taxon_closure_anc_depth_idx)
    create unique_index(:taxon_closure, [:entropy_id])

    create constraint(:taxon_closure, :taxon_closure_depth_nonnegative, check: "depth >= 0")

    create table(:taxon_aliases) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :taxon_id, references(:taxons, type: :bigint, on_delete: :delete_all), null: false
      add :alias, :text, null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:taxon_aliases, [:alias], name: :taxon_aliases_alias_uq)
    create index(:taxon_aliases, [:taxon_id], name: :taxon_aliases_taxon_idx)
    create unique_index(:taxon_aliases, [:entropy_id])

    create table(:brands) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :name, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:brands, [:name])
    create unique_index(:brands, [:entropy_id])

    create table(:products) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :brand_id, references(:brands, type: :bigint, on_delete: :nilify_all)
      add :primary_type_taxon_id, references(:taxons, type: :bigint, on_delete: :nilify_all)
      add :name, :text, null: false
      add :model_number, :text
      add :slug, :text, null: false
      add :description, :text

      timestamps(type: :utc_datetime_usec)
    end

    create index(:products, [:primary_type_taxon_id], name: :products_primary_type_idx)
    create index(:products, [:brand_id], name: :products_brand_idx)
    create unique_index(:products, [:slug])
    create unique_index(:products, [:entropy_id])

    create table(:product_taxons) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :taxon_id, references(:taxons, type: :bigint, on_delete: :delete_all), null: false
      add :source_type, :string, null: false
      add :confidence, :decimal
      add :created_by, references(:users, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:product_taxons, [:product_id, :taxon_id],
             name: :product_taxons_product_taxon_uq
           )

    create index(:product_taxons, [:taxon_id, :product_id],
             name: :product_taxons_taxon_product_idx
           )

    create unique_index(:product_taxons, [:entropy_id])

    create constraint(
             :product_taxons,
             :product_taxons_source_type_check,
             check: "source_type IN ('scrape', 'user', 'derived', 'editorial')"
           )

    create constraint(:product_taxons, :product_taxons_confidence_range,
             check: "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)"
           )
  end
end
