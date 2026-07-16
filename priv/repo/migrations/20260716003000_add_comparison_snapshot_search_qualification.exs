defmodule ProductCompare.Repo.Migrations.AddComparisonSnapshotSearchQualification do
  use Ecto.Migration

  @index_name :comparison_snapshots_search_indexable_idx

  def up do
    alter table(:comparison_snapshots) do
      add :search_qualified, :boolean, null: false, default: false
    end

    flush()

    execute("""
    UPDATE comparison_snapshots
    SET search_qualified = TRUE
    WHERE CASE
      WHEN jsonb_typeof(payload->'products') = 'array'
        AND jsonb_array_length(payload->'products') BETWEEN 2 AND 3
      THEN NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(payload->'products') AS product
        WHERE jsonb_array_length(
                CASE
                  WHEN jsonb_typeof(product->'attributes') = 'array'
                  THEN product->'attributes'
                  ELSE '[]'::jsonb
                END
              ) = 0
           OR jsonb_array_length(
                CASE
                  WHEN jsonb_typeof(product->'offers') = 'array'
                  THEN product->'offers'
                  ELSE '[]'::jsonb
                END
              ) = 0
      )
      ELSE FALSE
    END
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
