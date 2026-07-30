defmodule ProductCompare.Repo.Migrations.CreateIngestionRuns do
  use Ecto.Migration

  def change do
    create table(:ingestion_runs) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :source_id, references(:sources, type: :bigint, on_delete: :delete_all), null: false
      add :provider, :text, null: false
      add :surface, :text, null: false
      add :query, :map, null: false, default: %{}
      add :status, :ingestion_run_status, null: false
      add :started_at, :utc_datetime_usec, null: false
      add :finished_at, :utc_datetime_usec
      add :cursor_start, :integer
      add :cursor_end, :integer
      add :page_size, :integer
      add :pages_requested, :integer
      add :pages_fetched, :integer, null: false, default: 0
      add :records_fetched, :integer, null: false, default: 0
      add :records_normalized, :integer, null: false, default: 0
      add :records_persisted, :integer, null: false, default: 0
      add :records_failed, :integer, null: false, default: 0
      add :error_summary, :text

      timestamps(type: :utc_datetime_usec)
    end

    create index(:ingestion_runs, [:source_id, :started_at],
             name: :ingestion_runs_source_started_idx
           )

    create index(:ingestion_runs, [:status], name: :ingestion_runs_status_idx)

    create unique_index(:ingestion_runs, [:entropy_id])

    create constraint(:ingestion_runs, :ingestion_runs_counts_non_negative,
             check: """
             pages_fetched >= 0 AND records_fetched >= 0 AND
             records_normalized >= 0 AND records_persisted >= 0 AND records_failed >= 0
             """
           )
  end
end
