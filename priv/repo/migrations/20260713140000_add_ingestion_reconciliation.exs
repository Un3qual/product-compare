defmodule ProductCompare.Repo.Migrations.AddIngestionReconciliation do
  use Ecto.Migration

  def change do
    alter table(:ingestion_runs) do
      add :scope_fingerprint, :text
      add :reconciliation_status, :text, null: false, default: "not_requested"
      add :reconciled_at, :utc_datetime_usec
      add :offers_deactivated, :integer, null: false, default: 0
    end

    create index(:ingestion_runs, [:source_id, :surface, :scope_fingerprint],
             name: :ingestion_runs_reconciliation_scope_idx
           )

    create constraint(:ingestion_runs, :ingestion_runs_reconciliation_status_check,
             check: """
             reconciliation_status IN (
               'not_requested', 'pending', 'succeeded', 'skipped_partial', 'skipped_failed',
               'skipped_superseded'
             )
             """
           )

    create constraint(:ingestion_runs, :ingestion_runs_offers_deactivated_non_negative,
             check: "offers_deactivated >= 0"
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

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:ingestion_run_observations, [:import_run_id, :external_product_id],
             name: :ingestion_run_observations_run_external_uq
           )

    create index(:ingestion_run_observations, [:merchant_product_id],
             name: :ingestion_run_observations_merchant_product_idx
           )
  end
end
