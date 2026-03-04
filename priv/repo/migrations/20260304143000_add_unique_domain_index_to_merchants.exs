defmodule ProductCompare.Repo.Migrations.AddUniqueDomainIndexToMerchants do
  use Ecto.Migration

  def change do
    create unique_index(:merchants, [:domain], where: "domain IS NOT NULL")
  end
end
