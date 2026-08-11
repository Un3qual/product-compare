defmodule ProductCompare.Repo.Migrations.OptimizeHomepagePriceReads do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  @new_index :price_points_home_latest_idx
  @old_index :price_points_mp_time_idx

  def up do
    create index(
             :price_points,
             [:merchant_product_id, {:desc, :observed_at}, {:desc, :id}],
             name: @new_index,
             include: [:price, :shipping, :in_stock],
             concurrently: true
           )

    drop index(:price_points, [:merchant_product_id, :observed_at],
           name: @old_index,
           concurrently: true
         )
  end

  def down do
    create index(:price_points, [:merchant_product_id, :observed_at],
             name: @old_index,
             concurrently: true
           )

    drop index(
           :price_points,
           [:merchant_product_id, {:desc, :observed_at}, {:desc, :id}],
           name: @new_index,
           concurrently: true
         )
  end
end
