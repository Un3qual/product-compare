defmodule ProductCompare.Repo.Migrations.EnforceUserEmailShapeIntegrity do
  use Ecto.Migration

  def up do
    create constraint(:users, :users_email_shape_check,
             check: "email::text ~ '^[^[:space:]]+@[^[:space:]]+$'"
           )
  end

  def down do
    drop constraint(:users, :users_email_shape_check)
  end
end
