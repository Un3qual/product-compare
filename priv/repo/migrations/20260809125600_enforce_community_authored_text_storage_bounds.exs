defmodule ProductCompare.Repo.Migrations.EnforceCommunityAuthoredTextStorageBounds do
  use Ecto.Migration

  def up do
    create constraint(:product_threads, :product_threads_title_length_check,
             check: "char_length(title) BETWEEN 1 AND 200"
           )

    create constraint(:product_threads, :product_threads_body_length_check,
             check: "body_md IS NULL OR char_length(body_md) <= 5000"
           )

    create constraint(:thread_posts, :thread_posts_body_length_check,
             check: "char_length(body_md) <= 5000"
           )

    create constraint(:product_reviews, :product_reviews_title_length_check,
             check: "title IS NULL OR char_length(title) <= 120"
           )

    create constraint(:product_reviews, :product_reviews_body_length_check,
             check: "body_md IS NULL OR char_length(body_md) <= 5000"
           )

    create constraint(:community_reports, :community_reports_reason_length_check,
             check: "char_length(reason) >= 3"
           )
  end

  def down do
    drop constraint(:community_reports, :community_reports_reason_length_check)
    drop constraint(:product_reviews, :product_reviews_body_length_check)
    drop constraint(:product_reviews, :product_reviews_title_length_check)
    drop constraint(:thread_posts, :thread_posts_body_length_check)
    drop constraint(:product_threads, :product_threads_body_length_check)
    drop constraint(:product_threads, :product_threads_title_length_check)
  end
end
