defmodule ProductCompare.Repo.Migrations.ReconcileAffiliateLinksUniqueIndex do
  use Ecto.Migration

  def change do
    # Some local/test databases were created with a non-unique legacy index
    # (`affiliate_links_mp_idx`) on `merchant_product_id`, which breaks
    # `ON CONFLICT (merchant_product_id)` upserts.
    drop_if_exists index(:affiliate_links, [:merchant_product_id], name: :affiliate_links_mp_idx)

    drop_if_exists index(:affiliate_links, [:merchant_product_id],
                     name: :affiliate_links_merchant_product_uq
                   )

    create unique_index(:affiliate_links, [:merchant_product_id],
             name: :affiliate_links_merchant_product_uq
           )
  end
end
