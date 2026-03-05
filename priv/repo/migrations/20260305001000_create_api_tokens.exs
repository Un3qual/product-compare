defmodule ProductCompare.Repo.Migrations.CreateApiTokens do
  use Ecto.Migration

  def change do
    create table(:api_tokens) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      add :user_id, references(:users, type: :bigint, on_delete: :delete_all), null: false
      add :token_prefix, :text, null: false
      add :token_hash, :binary, null: false
      add :label, :text
      add :last_used_at, :utc_datetime_usec
      add :expires_at, :utc_datetime_usec
      add :revoked_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:api_tokens, [:entropy_id])
    create unique_index(:api_tokens, [:token_hash])
    create index(:api_tokens, [:user_id, :inserted_at], name: :api_tokens_user_time_idx)
    create index(:api_tokens, [:user_id, :revoked_at], name: :api_tokens_user_revoked_idx)

    create constraint(:api_tokens, :api_tokens_prefix_not_empty,
             check: "char_length(token_prefix) > 0"
           )
  end
end
