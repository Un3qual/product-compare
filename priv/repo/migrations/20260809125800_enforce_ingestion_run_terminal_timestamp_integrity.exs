defmodule ProductCompare.Repo.Migrations.EnforceIngestionRunTerminalTimestampIntegrity do
  use Ecto.Migration

  def up do
    execute("""
    ALTER TABLE ingestion_runs
    ADD CONSTRAINT ingestion_runs_terminal_finished_at_required
    CHECK (status = 'running' OR finished_at IS NOT NULL)
    """)
  end

  def down do
    execute("""
    ALTER TABLE ingestion_runs
    DROP CONSTRAINT ingestion_runs_terminal_finished_at_required
    """)
  end
end
