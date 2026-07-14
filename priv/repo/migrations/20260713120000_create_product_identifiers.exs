defmodule ProductCompare.Repo.Migrations.CreateProductIdentifiers do
  use Ecto.Migration

  def change do
    create table(:product_identifiers) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false
      add :scheme, :text, null: false
      add :normalized_value, :text, null: false
      add :display_value, :text, null: false
      add :verification_status, :text, null: false, default: "validated"

      add :source_artifact_id,
          references(:source_artifacts, type: :bigint, on_delete: :nilify_all)

      add :verified_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:product_identifiers, [:entropy_id])
    create index(:product_identifiers, [:product_id, :scheme])
    create index(:product_identifiers, [:source_artifact_id])

    create unique_index(:product_identifiers, [:scheme, :normalized_value],
             name: :product_identifiers_validated_scheme_value_uq,
             where: "verification_status = 'validated'"
           )

    create constraint(:product_identifiers, :product_identifiers_scheme_check,
             check: "scheme IN ('gtin', 'mpn')"
           )

    create constraint(:product_identifiers, :product_identifiers_verification_status_check,
             check: "verification_status IN ('unverified', 'validated', 'rejected')"
           )
  end
end
