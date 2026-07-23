defmodule ProductCompare.Repo.Migrations.AddCommerceRevenueFilterIndexes do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:commerce_conversions, [:status, :product_id],
             name: :commerce_conversions_revenue_product_idx,
             concurrently: true
           )

    create index(:commerce_conversions, [:status, :currency],
             name: :commerce_conversions_revenue_currency_idx,
             concurrently: true
           )

    create index(:commerce_conversions, [:status, :purchased_at, :reported_at],
             name: :commerce_conversions_revenue_time_idx,
             concurrently: true
           )

    create index(:commerce_click_sessions, [:inserted_at],
             name: :commerce_click_sessions_inserted_at_idx,
             concurrently: true
           )

    create index(:commerce_links, [:network],
             name: :commerce_links_network_idx,
             concurrently: true
           )
  end
end
