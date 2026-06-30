defmodule ProductCompare.Repo.Migrations.AddCompareGroupToTaxonAttributes do
  use Ecto.Migration

  def change do
    alter table(:taxon_attributes) do
      add :compare_group_label, :text
    end
  end
end
