defmodule ProductCompare.Repo.Migrations.AllowReplacementReviewsAfterRemoval do
  use Ecto.Migration

  @index_name :product_reviews_product_user_uq

  def up do
    drop unique_index(:product_reviews, [:product_id, :user_id], name: @index_name)

    create unique_index(:product_reviews, [:product_id, :user_id],
             name: @index_name,
             where: "moderation_status <> 'removed'"
           )
  end

  def down do
    drop unique_index(:product_reviews, [:product_id, :user_id], name: @index_name)
    create unique_index(:product_reviews, [:product_id, :user_id], name: @index_name)
  end
end
