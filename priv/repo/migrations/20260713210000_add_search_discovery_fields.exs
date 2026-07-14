defmodule ProductCompare.Repo.Migrations.AddSearchDiscoveryFields do
  use Ecto.Migration

  def change do
    alter table(:taxons) do
      add :seo_slug, :string
      add :seo_description, :text
      add :seo_indexable, :boolean, null: false, default: false
    end

    create unique_index(:taxons, [:seo_slug], where: "seo_slug IS NOT NULL")
    create index(:taxons, [:seo_indexable, :id], where: "seo_indexable = true")

    alter table(:comparison_snapshots) do
      add :search_indexable, :boolean, null: false, default: false
    end

    create index(:comparison_snapshots, [:inserted_at, :id],
             where: "search_indexable = true AND revoked_at IS NULL",
             name: :comparison_snapshots_search_indexable_idx
           )
  end
end
