defmodule ProductCompare.Repo.Migrations.AddHashedPasswordToUsers do
  use Ecto.Migration

  def up do
    alter table(:users) do
      add :hashed_password, :text
    end

    execute("""
    UPDATE users
    SET hashed_password =
      md5(random()::text || clock_timestamp()::text || id::text) ||
      md5(clock_timestamp()::text || random()::text || id::text)
    WHERE hashed_password IS NULL
    """)

    alter table(:users) do
      modify :hashed_password, :text, null: false
    end
  end

  def down do
    alter table(:users) do
      remove :hashed_password
    end
  end
end
