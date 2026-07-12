defmodule ProductCompare.Repo.Migrations.AddOperatorAccessToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :is_operator, :boolean, null: false, default: false
    end
  end
end
