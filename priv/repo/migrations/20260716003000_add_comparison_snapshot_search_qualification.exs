defmodule ProductCompare.Repo.Migrations.AddComparisonSnapshotSearchQualification do
  use Ecto.Migration

  @index_name :comparison_snapshots_search_indexable_idx

  def up do
    alter table(:comparison_snapshots) do
      add :search_qualified, :boolean, null: false, default: false
    end

    flush()

    execute("""
    UPDATE comparison_snapshots AS snapshot
    SET search_qualified = TRUE
    WHERE (
      SELECT count(*)
      FROM comparison_snapshot_products AS product
      WHERE product.comparison_snapshot_id = snapshot.id
    ) BETWEEN 2 AND 3
      AND NOT EXISTS (
        SELECT 1
        FROM comparison_snapshot_products AS product
        WHERE product.comparison_snapshot_id = snapshot.id
          AND (
            NOT EXISTS (
              SELECT 1
              FROM comparison_snapshot_attributes AS attribute
              WHERE attribute.snapshot_product_id = product.id
            )
            OR NOT EXISTS (
              SELECT 1
              FROM comparison_snapshot_offers AS offer
              WHERE offer.snapshot_product_id = product.id
            )
          )
      )
    """)

    drop_if_exists index(:comparison_snapshots, [:inserted_at, :id], name: @index_name)

    create index(:comparison_snapshots, [:inserted_at, :id],
             where: "search_indexable = true AND search_qualified = true AND revoked_at IS NULL",
             name: @index_name
           )
  end

  def down do
    drop_if_exists index(:comparison_snapshots, [:inserted_at, :id], name: @index_name)

    alter table(:comparison_snapshots) do
      remove :search_qualified
    end

    create index(:comparison_snapshots, [:inserted_at, :id],
             where: "search_indexable = true AND revoked_at IS NULL",
             name: @index_name
           )
  end
end
