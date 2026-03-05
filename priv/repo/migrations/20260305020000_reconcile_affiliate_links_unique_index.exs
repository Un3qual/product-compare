defmodule ProductCompare.Repo.Migrations.ReconcileAffiliateLinksUniqueIndex do
  use Ecto.Migration

  def change do
    # Deduplicate legacy rows before creating the unique index so migration
    # succeeds even when prior non-unique index allowed duplicates.
    execute("""
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY merchant_product_id ORDER BY id) AS row_num
      FROM affiliate_links
    )
    DELETE FROM affiliate_links AS duplicate
    USING ranked
    WHERE duplicate.id = ranked.id
      AND ranked.row_num > 1
    """)

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
