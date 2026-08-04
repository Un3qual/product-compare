defmodule ProductCompare.Repo.Migrations.CreateProductIdentifiers do
  use Ecto.Migration

  def change do
    create table(:product_identifiers) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :scheme, :product_identifier_scheme, null: false
      add :normalized_value, :text, null: false
      add :display_value, :text, null: false

      add :verification_status, :product_identifier_verification_status,
        null: false,
        default: "validated"

      add :source_artifact_id,
          references(:source_artifacts, type: :bigint, on_delete: :nilify_all)

      add :verified_at, :timestamptz, precision: 6, size: 6

      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:product_identifiers, [:entropy_id])
    create index(:product_identifiers, [:product_id, :scheme])
    create index(:product_identifiers, [:source_artifact_id])

    create unique_index(:product_identifiers, [:scheme, :normalized_value],
             name: :product_identifiers_validated_scheme_value_uq,
             where: "verification_status = 'validated'"
           )
  end
end
