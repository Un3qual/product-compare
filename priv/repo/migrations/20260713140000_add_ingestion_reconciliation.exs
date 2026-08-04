defmodule ProductCompare.Repo.Migrations.AddIngestionReconciliation do
  use Ecto.Migration

  def change do
    alter table(:ingestion_runs) do
      add :scope_fingerprint, :binary

      add :reconciliation_status, :ingestion_reconciliation_status,
        null: false,
        default: "not_requested"

      add :reconciled_at, :timestamptz, precision: 6, size: 6
      add :offers_deactivated, :integer, null: false, default: 0
    end

    create index(:ingestion_runs, [:source_id, :integration_surface_id, :scope_fingerprint],
             name: :ingestion_runs_reconciliation_scope_idx
           )

    create constraint(:ingestion_runs, :ingestion_runs_offers_deactivated_non_negative,
             check: "offers_deactivated >= 0"
           )

    create constraint(:ingestion_runs, :ingestion_runs_scope_fingerprint_sha256_length,
             check: "scope_fingerprint IS NULL OR octet_length(scope_fingerprint) = 32"
           )

    create table(:ingestion_run_observations) do
      add :import_run_id,
          references(:ingestion_runs, type: :bigint, on_delete: :delete_all),
          null: false

      add :external_product_id,
          references(:external_products, type: :bigint, on_delete: :delete_all),
          null: false

      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :delete_all),
          null: false

      timestamps(type: :timestamptz, precision: 6, size: 6, updated_at: false)
    end

    create unique_index(:ingestion_run_observations, [:import_run_id, :external_product_id],
             name: :ingestion_run_observations_run_external_uq
           )

    create index(:ingestion_run_observations, [:merchant_product_id],
             name: :ingestion_run_observations_merchant_product_idx
           )
  end
end
