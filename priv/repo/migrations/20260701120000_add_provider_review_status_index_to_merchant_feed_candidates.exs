defmodule ProductCompare.Repo.Migrations.AddProviderReviewStatusIndexToMerchantFeedCandidates do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:merchant_feed_candidates, [:provider, :review_status],
             name: :merchant_feed_candidates_provider_review_status_idx,
             concurrently: true
           )
  end
end
