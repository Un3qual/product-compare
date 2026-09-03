defmodule ProductCompare.Repo.Migrations.AddObanIdentityToConversionSyncRuns do
  use Ecto.Migration

  def change do
    alter table(:commerce_conversion_sync_runs) do
      add :oban_job_id, :bigint
      add :oban_attempt, :integer
    end

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_oban_identity_paired,
             check: "(oban_job_id IS NULL) = (oban_attempt IS NULL)"
           )

    create constraint(
             :commerce_conversion_sync_runs,
             :commerce_conversion_sync_runs_oban_attempt_positive,
             check: "oban_attempt IS NULL OR oban_attempt > 0"
           )
  end
end
