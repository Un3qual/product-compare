defmodule ProductCompare.Repo.Migrations.IndexCjConversionSyncReconciliation do
  use Ecto.Migration

  def change do
    create index(
             :commerce_conversion_sync_runs,
             [:oban_job_id, :oban_attempt],
             name: :commerce_conversion_sync_runs_running_oban_attempt_index,
             where: "status = 'running' AND oban_job_id IS NOT NULL"
           )

    create index(
             :commerce_conversion_sync_runs,
             [:affiliate_network_id, :id],
             name: :commerce_conversion_sync_runs_running_network_index,
             where: "status = 'running' AND oban_job_id IS NOT NULL"
           )
  end
end
