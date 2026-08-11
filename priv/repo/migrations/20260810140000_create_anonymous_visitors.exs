defmodule ProductCompare.Repo.Migrations.CreateAnonymousVisitors do
  use Ecto.Migration

  def up do
    click_sessions = qualified_table("commerce_click_sessions")
    visitors = qualified_table("anonymous_visitors")

    create table(:anonymous_visitors) do
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:anonymous_visitors, [:entropy_id])

    alter table(:commerce_click_sessions) do
      add :anonymous_visitor_id,
          references(:anonymous_visitors, type: :bigint, on_delete: :nilify_all)
    end

    create index(:commerce_click_sessions, [:anonymous_visitor_id],
             name: :commerce_click_sessions_anonymous_visitor_idx
           )

    execute("""
    CREATE TEMPORARY TABLE legacy_anonymous_visitor_map
      (legacy_id text PRIMARY KEY, entropy_id uuid NOT NULL, visitor_id bigint)
    ON COMMIT DROP
    """)

    execute("""
    INSERT INTO legacy_anonymous_visitor_map (legacy_id, entropy_id)
    SELECT anonymous_id, uuidv7()
    FROM #{click_sessions}
    WHERE user_id IS NULL
      AND anonymous_id IS NOT NULL
      AND btrim(anonymous_id) <> ''
    GROUP BY anonymous_id
    """)

    execute("""
    INSERT INTO #{visitors} (entropy_id, inserted_at, updated_at)
    SELECT entropy_id, now(), now()
    FROM legacy_anonymous_visitor_map
    """)

    execute("""
    UPDATE legacy_anonymous_visitor_map AS legacy
    SET visitor_id = visitor.id
    FROM #{visitors} AS visitor
    WHERE visitor.entropy_id = legacy.entropy_id
    """)

    execute("""
    UPDATE #{click_sessions} AS click
    SET anonymous_visitor_id = legacy.visitor_id
    FROM legacy_anonymous_visitor_map AS legacy
    WHERE click.user_id IS NULL
      AND click.anonymous_id = legacy.legacy_id
    """)

    create constraint(:commerce_click_sessions, :commerce_click_sessions_single_actor,
             check: "NOT (user_id IS NOT NULL AND anonymous_visitor_id IS NOT NULL)"
           )

    alter table(:commerce_click_sessions) do
      remove :anonymous_id
    end
  end

  def down do
    click_sessions = qualified_table("commerce_click_sessions")
    visitors = qualified_table("anonymous_visitors")

    alter table(:commerce_click_sessions) do
      add :anonymous_id, :text
    end

    execute("""
    UPDATE #{click_sessions} AS click
    SET anonymous_id = visitor.entropy_id::text
    FROM #{visitors} AS visitor
    WHERE click.anonymous_visitor_id = visitor.id
    """)

    drop constraint(:commerce_click_sessions, :commerce_click_sessions_single_actor)

    drop index(:commerce_click_sessions, [:anonymous_visitor_id],
           name: :commerce_click_sessions_anonymous_visitor_idx
         )

    alter table(:commerce_click_sessions) do
      remove :anonymous_visitor_id
    end

    drop table(:anonymous_visitors)
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
