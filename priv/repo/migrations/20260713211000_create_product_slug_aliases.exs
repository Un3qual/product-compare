defmodule ProductCompare.Repo.Migrations.CreateProductSlugAliases do
  use Ecto.Migration

  def change do
    create table(:product_slug_aliases) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :slug, :string, null: false
      add :product_id, references(:products, type: :bigint, on_delete: :delete_all), null: false

      timestamps(type: :timestamptz, precision: 6, size: 6, updated_at: false)
    end

    create unique_index(:product_slug_aliases, [:slug])
    create index(:product_slug_aliases, [:product_id])
    create unique_index(:product_slug_aliases, [:entropy_id])
  end
end
