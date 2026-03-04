defmodule ProductCompare.Repo.Migrations.ReplacePartialMerchantDomainIndex do
  use Ecto.Migration

  def change do
    execute("DROP INDEX IF EXISTS merchants_domain_index")
    create unique_index(:merchants, [:domain])
  end
end
