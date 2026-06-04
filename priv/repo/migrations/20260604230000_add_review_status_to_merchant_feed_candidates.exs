defmodule ProductCompare.Repo.Migrations.AddReviewStatusToMerchantFeedCandidates do
  use Ecto.Migration

  def change do
    alter table(:merchant_feed_candidates) do
      add :review_status, :text, null: false, default: "pending"
      add :review_note, :text
      add :reviewed_at, :utc_datetime_usec
    end

    create constraint(
             :merchant_feed_candidates,
             :merchant_feed_candidates_review_status_chk,
             check: "review_status IN ('pending', 'shortlisted', 'dismissed')"
           )
  end
end
