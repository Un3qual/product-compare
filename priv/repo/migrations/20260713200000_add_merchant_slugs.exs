defmodule ProductCompare.Repo.Migrations.AddMerchantSlugs do
  use Ecto.Migration

  def up do
    alter table(:merchants) do
      add :slug, :string
    end

    execute("""
    UPDATE merchants
    SET slug = coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'merchant')
      || '-' || substr(md5(domain), 1, 8)
    """)

    alter table(:merchants) do
      modify :slug, :string, null: false
    end

    create unique_index(:merchants, [:slug])
  end

  def down do
    drop_if_exists unique_index(:merchants, [:slug])

    alter table(:merchants) do
      remove :slug
    end
  end
end
