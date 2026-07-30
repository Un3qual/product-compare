defmodule ProductCompare.Repo.Migrations.AddSpecificationCorrections do
  use Ecto.Migration

  def change do
    create table(:specification_corrections) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")

      add :claim_id,
          references(:product_attribute_claims, type: :bigint, on_delete: :delete_all),
          null: false

      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false

      add :attribute_id, references(:attributes, type: :bigint, on_delete: :delete_all),
        null: false

      add :submitted_by, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :reason, :text, null: false
      add :source_url, :text
      add :explanation, :text
      add :status, :specification_correction_status, null: false, default: "pending"
      add :reviewed_by, references(:users, type: :bigint, on_delete: :nilify_all)
      add :reviewed_at, :utc_datetime_usec
      add :moderation_note, :text

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:specification_corrections, [:entropy_id])
    create unique_index(:specification_corrections, [:claim_id])

    create unique_index(
             :specification_corrections,
             [:submitted_by, :product_id, :attribute_id],
             where: "status = 'pending'",
             name: :specification_corrections_one_pending_uq
           )

    create index(:specification_corrections, [:submitted_by, :inserted_at])
    create index(:specification_corrections, [:status, :inserted_at])
    create index(:specification_corrections, [:product_id, :attribute_id, :status])

    create constraint(:specification_corrections, :specification_corrections_evidence_check,
             check:
               "(source_url IS NOT NULL AND length(btrim(source_url)) > 0) OR (explanation IS NOT NULL AND length(btrim(explanation)) > 0)"
           )
  end
end
