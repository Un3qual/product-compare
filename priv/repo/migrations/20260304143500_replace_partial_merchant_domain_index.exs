defmodule ProductCompare.Repo.Migrations.ReplacePartialMerchantDomainIndex do
  use Ecto.Migration

  def change do
    # Fail fast with a clear message instead of partially applying constraints.
    execute("""
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM merchants
        WHERE domain IS NULL
      ) THEN
        RAISE EXCEPTION
          'Cannot enforce merchants.domain NOT NULL: NULL domain rows exist; backfill domains first.';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM merchants
        GROUP BY domain
        HAVING COUNT(*) > 1
      ) THEN
        RAISE EXCEPTION
          'Cannot add unique merchants.domain index: duplicate domains exist; deduplicate first.';
      END IF;
    END
    $$;
    """)

    alter table(:merchants) do
      modify :domain, :text, null: false, from: {:text, null: true}
    end

    create unique_index(:merchants, [:domain])
  end
end
