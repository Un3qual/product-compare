defmodule ProductCompare.Repo.Migrations.AddUserAuthFieldsAndSessionTokens do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :confirmed_at, :timestamptz, precision: 6, size: 6
    end

    create table(:users_tokens, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false, default: fragment("uuidv7()")
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :token_hash, :binary, null: false
      add :context, :user_token_context, null: false
      add :sent_to, :citext
      add :expires_at, :timestamptz, precision: 6, size: 6, null: false

      timestamps(type: :timestamptz, precision: 6, size: 6, updated_at: false)
    end

    create index(:users_tokens, [:user_id])
    create index(:users_tokens, [:context])
    create index(:users_tokens, [:expires_at])

    create unique_index(:users_tokens, [:token_hash, :context],
             name: :users_tokens_hash_context_uq
           )
  end
end
