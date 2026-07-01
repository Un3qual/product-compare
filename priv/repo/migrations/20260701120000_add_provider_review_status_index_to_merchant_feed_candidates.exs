defmodule ProductCompare.Repo.Migrations.AddProviderReviewStatusIndexToMerchantFeedCandidates do
  use Ecto.Migration

  def change do
    create index(:merchant_feed_candidates, [:provider, :review_status],
             name: :merchant_feed_candidates_provider_review_status_idx
           )
  end
end
