defmodule ProductCompare.Repo.Migrations.ReplacePartialMerchantDomainIndex do
  use Ecto.Migration

  def change do
    alter table(:merchants) do
      modify :domain, :text, null: false 
    end
    create unique_index(:merchants, [:domain])
  end
end
