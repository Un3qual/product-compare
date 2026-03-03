defmodule ProductCompare.Repo.Migrations.CreateSpecsAndSources do
  use Ecto.Migration

  def change do
    create table(:dimensions) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :code, :text, null: false
      add :description, :text

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:dimensions, [:code])
    create unique_index(:dimensions, [:entropy_id])

    create table(:units) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :dimension_id, references(:dimensions, type: :bigint, on_delete: :delete_all),
        null: false

      add :code, :text, null: false
      add :symbol, :text
      add :multiplier_to_base, :decimal, null: false, default: 1
      add :offset_to_base, :decimal, null: false, default: 0

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:units, [:dimension_id, :code], name: :units_dimension_code_uq)
    create unique_index(:units, [:entropy_id])

    create table(:enum_sets) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :code, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:enum_sets, [:code])
    create unique_index(:enum_sets, [:entropy_id])

    create table(:enum_options) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :enum_set_id, references(:enum_sets, type: :bigint, on_delete: :delete_all), null: false
      add :code, :text, null: false
      add :label, :text, null: false
      add :sort_order, :integer, null: false, default: 0

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:enum_options, [:enum_set_id, :code], name: :enum_options_set_code_uq)
    create index(:enum_options, [:enum_set_id, :sort_order], name: :enum_options_set_sort_idx)
    create unique_index(:enum_options, [:entropy_id])

    create table(:attributes) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :code, :text, null: false
      add :display_name, :text, null: false
      add :data_type, :string, null: false
      add :dimension_id, references(:dimensions, type: :bigint, on_delete: :nilify_all)
      add :enum_set_id, references(:enum_sets, type: :bigint, on_delete: :nilify_all)
      add :is_multivalued, :boolean, null: false, default: false
      add :is_filterable, :boolean, null: false, default: true
      add :is_derived, :boolean, null: false, default: false
      add :description, :text

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:attributes, [:code])
    create unique_index(:attributes, [:entropy_id])

    create constraint(
             :attributes,
             :attributes_data_type_check,
             check:
               "data_type IN ('bool', 'int', 'numeric', 'text', 'enum', 'date', 'timestamp', 'json')"
           )

    create table(:taxon_attributes) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :taxon_id, references(:taxons, type: :bigint, on_delete: :delete_all), null: false

      add :attribute_id, references(:attributes, type: :bigint, on_delete: :delete_all),
        null: false

      add :is_required, :boolean, null: false, default: false
      add :sort_order, :integer, null: false, default: 0
      add :min_rep_to_edit, :bigint, null: false, default: 0

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:taxon_attributes, [:taxon_id, :attribute_id],
             name: :taxon_attributes_taxon_attr_uq
           )

    create unique_index(:taxon_attributes, [:entropy_id])

    create table(:sources) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :kind, :text, null: false
      add :name, :text, null: false
      add :domain, :text

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:sources, [:kind, :name], name: :sources_kind_name_uq)
    create unique_index(:sources, [:entropy_id])

    create table(:source_artifacts) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :source_id, references(:sources, type: :bigint, on_delete: :nilify_all)
      add :url, :text
      add :fetched_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :content_hash, :text
      add :raw_json, :map
      add :raw_text, :text

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:source_artifacts, [:source_id, :fetched_at],
             name: :artifacts_source_fetched_idx
           )

    create unique_index(:source_artifacts, [:entropy_id])

    create table(:external_products) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :source_id, references(:sources, type: :bigint, on_delete: :delete_all), null: false
      add :external_id, :text, null: false
      add :product_id, references(:products, type: :bigint, on_delete: :nilify_all)
      add :canonical_url, :text
      add :last_seen_at, :utc_datetime_usec, null: false, default: fragment("now()")

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:external_products, [:source_id, :external_id],
             name: :external_products_source_extid_uq
           )

    create index(:external_products, [:product_id], name: :external_products_product_idx)
    create unique_index(:external_products, [:entropy_id])

    create table(:derived_formulas) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :attribute_id, references(:attributes, type: :bigint, on_delete: :delete_all),
        null: false

      add :lang, :text, null: false
      add :expression, :text, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:derived_formulas, [:attribute_id], name: :derived_formulas_attribute_uq)
    create unique_index(:derived_formulas, [:entropy_id])

    create table(:product_attribute_claims) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false

      add :attribute_id, references(:attributes, type: :bigint, on_delete: :delete_all),
        null: false

      add :source_type, :string, null: false
      add :status, :string, null: false, default: "proposed"
      add :created_by, references(:users, type: :bigint, on_delete: :nilify_all)
      add :confidence, :decimal

      add :value_bool, :boolean
      add :value_int, :bigint
      add :value_num, :decimal
      add :unit_id, references(:units, type: :bigint, on_delete: :nilify_all)
      add :value_num_base, :decimal
      add :value_num_base_min, :decimal
      add :value_num_base_max, :decimal
      add :value_text, :text
      add :value_date, :date
      add :value_ts, :utc_datetime_usec
      add :enum_option_id, references(:enum_options, type: :bigint, on_delete: :nilify_all)
      add :value_json, :map

      add :supersedes_claim_id,
          references(:product_attribute_claims, type: :bigint, on_delete: :nilify_all)

      add :derived_formula_id,
          references(:derived_formulas, type: :bigint, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:product_attribute_claims, [:product_id, :attribute_id, :inserted_at],
             name: :pac_product_attr_time_idx
           )

    create index(:product_attribute_claims, [:attribute_id, :status], name: :pac_attr_status_idx)

    create index(:product_attribute_claims, [:attribute_id, :value_num_base],
             name: :pac_numeric_filter_idx,
             where: "value_num_base IS NOT NULL"
           )

    create index(:product_attribute_claims, [:attribute_id, :enum_option_id],
             name: :pac_enum_filter_idx,
             where: "enum_option_id IS NOT NULL"
           )

    create index(:product_attribute_claims, [:attribute_id, :value_bool],
             name: :pac_bool_filter_idx,
             where: "value_bool IS NOT NULL"
           )

    create unique_index(:product_attribute_claims, [:entropy_id])

    create constraint(
             :product_attribute_claims,
             :product_attribute_claim_source_type_check,
             check: "source_type IN ('scrape', 'user', 'import', 'derived')"
           )

    create constraint(
             :product_attribute_claims,
             :product_attribute_claim_status_check,
             check: "status IN ('proposed', 'accepted', 'rejected', 'superseded')"
           )

    create constraint(
             :product_attribute_claims,
             :product_attribute_claims_confidence_range,
             check: "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)"
           )

    create constraint(
             :product_attribute_claims,
             :product_attribute_claim_single_typed_value,
             check:
               "((CASE WHEN value_bool IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN value_int IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN value_num IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN value_text IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN value_date IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN value_ts IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN enum_option_id IS NOT NULL THEN 1 ELSE 0 END) + (CASE WHEN value_json IS NOT NULL THEN 1 ELSE 0 END)) = 1"
           )

    create table(:claim_evidence) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :claim_id, references(:product_attribute_claims, type: :bigint, on_delete: :delete_all),
        null: false

      add :artifact_id, references(:source_artifacts, type: :bigint, on_delete: :delete_all),
        null: false

      add :excerpt, :text

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:claim_evidence, [:claim_id, :artifact_id],
             name: :claim_evidence_claim_artifact_uq
           )

    create unique_index(:claim_evidence, [:entropy_id])

    create table(:product_attribute_current) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false

      add :attribute_id, references(:attributes, type: :bigint, on_delete: :delete_all),
        null: false

      add :claim_id, references(:product_attribute_claims, type: :bigint, on_delete: :delete_all),
        null: false

      add :selected_by, references(:users, type: :bigint, on_delete: :nilify_all)
      add :selected_at, :utc_datetime_usec, null: false, default: fragment("now()")

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:product_attribute_current, [:product_id, :attribute_id],
             name: :pacur_product_attr_uq
           )

    create unique_index(:product_attribute_current, [:claim_id], name: :pacur_claim_uq)
    create unique_index(:product_attribute_current, [:entropy_id])

    create table(:derived_formula_deps) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :formula_id, references(:derived_formulas, type: :bigint, on_delete: :delete_all),
        null: false

      add :depends_on_attribute_id,
          references(:attributes, type: :bigint, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:derived_formula_deps, [:formula_id, :depends_on_attribute_id],
             name: :derived_formula_deps_uq
           )

    create unique_index(:derived_formula_deps, [:entropy_id])

    create table(:claim_dependencies) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :claim_id, references(:product_attribute_claims, type: :bigint, on_delete: :delete_all),
        null: false

      add :depends_on_claim_id,
          references(:product_attribute_claims, type: :bigint, on_delete: :delete_all),
          null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:claim_dependencies, [:claim_id, :depends_on_claim_id],
             name: :claim_dependencies_uq
           )

    create unique_index(:claim_dependencies, [:entropy_id])
  end
end
