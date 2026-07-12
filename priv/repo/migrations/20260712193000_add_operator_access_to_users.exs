defmodule ProductCompare.Repo.Migrations.AddOperatorAccessToUsers do
  use Ecto.Migration

  def up do
    alter table(:users) do
      add :is_operator, :boolean, null: false, default: false
    end

    flush()
    execute(&backfill_legacy_seed_operators/0)
  end

  def down do
    alter table(:users) do
      remove :is_operator
    end
  end

  defp backfill_legacy_seed_operators do
    users = qualified_table("users")
    reputations = qualified_table("user_reputation")

    repo().query!("""
    UPDATE #{users} AS users
    SET is_operator = TRUE
    FROM #{reputations} AS reputation
    WHERE reputation.user_id = users.id
      AND (
        (users.email = 'admin@example.com' AND reputation.points = 1000)
        OR
        (users.email = 'moderator@example.com' AND reputation.points = 500)
      )
    """)
  end

  defp qualified_table(table) do
    case prefix() do
      nil -> quote_identifier(table)
      prefix -> "#{quote_identifier(prefix)}.#{quote_identifier(table)}"
    end
  end

  defp quote_identifier(identifier) do
    escaped = String.replace(identifier, "\"", "\"\"")
    "\"#{escaped}\""
  end
end
