defmodule ProductCompare.Repo.Migrations.AllowSupersededIngestionReconciliation do
  use Ecto.Migration

  def change do
    drop constraint(:ingestion_runs, :ingestion_runs_reconciliation_status_check)

    create constraint(:ingestion_runs, :ingestion_runs_reconciliation_status_check,
             check: """
             reconciliation_status IN (
               'not_requested', 'pending', 'succeeded', 'skipped_partial', 'skipped_failed',
               'skipped_superseded'
             )
             """
           )
  end
end
