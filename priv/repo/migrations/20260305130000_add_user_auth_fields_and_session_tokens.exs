defmodule ProductCompare.Repo.Migrations.AddUserAuthFieldsAndSessionTokens do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :confirmed_at, :utc_datetime_usec
    end

    create table(:users_tokens, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false, default: fragment("uuidv7()")
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :token_hash, :binary, null: false
      add :context, :string, null: false
      add :sent_to, :citext
      add :expires_at, :utc_datetime_usec, null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create index(:users_tokens, [:user_id])
    create index(:users_tokens, [:context])
    create index(:users_tokens, [:expires_at])

    create unique_index(:users_tokens, [:token_hash, :context],
             name: :users_tokens_hash_context_uq
           )
  end
end
