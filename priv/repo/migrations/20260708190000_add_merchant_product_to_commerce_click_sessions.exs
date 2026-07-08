defmodule ProductCompare.Repo.Migrations.AddMerchantProductToCommerceClickSessions do
  use Ecto.Migration

  def change do
    alter table(:commerce_click_sessions) do
      add :merchant_product_id,
          references(:merchant_products, type: :bigint, on_delete: :nilify_all)
    end

    create index(:commerce_click_sessions, [:merchant_product_id],
             name: :commerce_click_sessions_merchant_product_idx
           )
  end
end
