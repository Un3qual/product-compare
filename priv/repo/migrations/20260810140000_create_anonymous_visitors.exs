defmodule ProductCompare.Repo.Migrations.CreateAnonymousVisitors do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  @backfill_batch_size 10_000
  @transition_function "resolve_legacy_anonymous_visitor"
  @transition_trigger "commerce_click_sessions_resolve_legacy_anonymous_visitor"

  def up do
    click_sessions = qualified_table("commerce_click_sessions")
    visitors = qualified_table("anonymous_visitors")
    transition_function = qualified_name(@transition_function)

    create table(:anonymous_visitors) do
      add :legacy_anonymous_id, :text
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create unique_index(:anonymous_visitors, [:legacy_anonymous_id],
             name: :anonymous_visitors_legacy_anonymous_id_index,
             where: "legacy_anonymous_id IS NOT NULL"
           )

    create unique_index(:anonymous_visitors, [:entropy_id])

    alter table(:commerce_click_sessions) do
      add :anonymous_visitor_id, :bigint
    end

    flush()

    execute("""
    CREATE FUNCTION #{transition_function}()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      resolved_visitor_id bigint;
    BEGIN
      IF NEW.user_id IS NULL
        AND NEW.anonymous_id IS NOT NULL
        AND btrim(NEW.anonymous_id) <> ''
        AND (
          NEW.anonymous_visitor_id IS NULL
          OR (TG_OP = 'UPDATE' AND NEW.anonymous_id IS DISTINCT FROM OLD.anonymous_id)
        ) THEN
        INSERT INTO #{visitors} (legacy_anonymous_id, entropy_id, inserted_at, updated_at)
        VALUES (NEW.anonymous_id, uuidv7(), now(), now())
        ON CONFLICT (legacy_anonymous_id) WHERE legacy_anonymous_id IS NOT NULL
        DO UPDATE SET legacy_anonymous_id = EXCLUDED.legacy_anonymous_id
        RETURNING id INTO resolved_visitor_id;

        NEW.anonymous_visitor_id := resolved_visitor_id;
      ELSIF NEW.user_id IS NULL
        AND TG_OP = 'UPDATE'
        AND NEW.anonymous_id IS DISTINCT FROM OLD.anonymous_id THEN
        NEW.anonymous_visitor_id := NULL;
      END IF;

      RETURN NEW;
    END
    $$
    """)

    execute("""
    CREATE TRIGGER #{@transition_trigger}
    BEFORE INSERT OR UPDATE OF anonymous_id
    ON #{click_sessions}
    FOR EACH ROW
    EXECUTE FUNCTION #{transition_function}()
    """)

    flush()

    repo().query!("""
    INSERT INTO #{visitors} (legacy_anonymous_id, entropy_id, inserted_at, updated_at)
    SELECT legacy_anonymous_id, uuidv7(), now(), now()
    FROM (
      SELECT DISTINCT anonymous_id AS legacy_anonymous_id
      FROM #{click_sessions}
      WHERE user_id IS NULL
        AND anonymous_id IS NOT NULL
        AND btrim(anonymous_id) <> ''
    ) AS legacy
    ON CONFLICT (legacy_anonymous_id) WHERE legacy_anonymous_id IS NOT NULL
    DO NOTHING
    """)

    backfill_click_sessions(click_sessions, visitors)

    create index(:commerce_click_sessions, [:anonymous_visitor_id],
             concurrently: true,
             name: :commerce_click_sessions_anonymous_visitor_idx
           )

    flush()

    execute("""
    ALTER TABLE #{click_sessions}
    ADD CONSTRAINT commerce_click_sessions_anonymous_visitor_id_fkey
    FOREIGN KEY (anonymous_visitor_id)
    REFERENCES #{visitors}(id)
    ON DELETE SET NULL
    NOT VALID
    """)

    execute("""
    ALTER TABLE #{click_sessions}
    ADD CONSTRAINT commerce_click_sessions_single_actor
    CHECK (NOT (user_id IS NOT NULL AND anonymous_visitor_id IS NOT NULL))
    NOT VALID
    """)

    execute("""
    ALTER TABLE #{click_sessions}
    VALIDATE CONSTRAINT commerce_click_sessions_anonymous_visitor_id_fkey
    """)

    execute("""
    ALTER TABLE #{click_sessions}
    VALIDATE CONSTRAINT commerce_click_sessions_single_actor
    """)
  end

  def down do
    click_sessions = qualified_table("commerce_click_sessions")
    transition_function = qualified_name(@transition_function)

    execute("DROP TRIGGER IF EXISTS #{@transition_trigger} ON #{click_sessions}")
    execute("DROP FUNCTION IF EXISTS #{transition_function}()")

    execute("""
    ALTER TABLE #{click_sessions}
    DROP CONSTRAINT IF EXISTS commerce_click_sessions_single_actor
    """)

    execute("""
    ALTER TABLE #{click_sessions}
    DROP CONSTRAINT IF EXISTS commerce_click_sessions_anonymous_visitor_id_fkey
    """)

    drop index(:commerce_click_sessions, [:anonymous_visitor_id],
           concurrently: true,
           name: :commerce_click_sessions_anonymous_visitor_idx
         )

    alter table(:commerce_click_sessions) do
      remove :anonymous_visitor_id
    end

    drop table(:anonymous_visitors)
  end

  defp backfill_click_sessions(click_sessions, visitors) do
    case repo().query!("SELECT min(id), max(id) FROM #{click_sessions}").rows do
      [[nil, nil]] ->
        :ok

      [[first_id, last_id]] ->
        first_id
        |> Stream.iterate(&(&1 + @backfill_batch_size))
        |> Stream.take_while(&(&1 <= last_id))
        |> Enum.each(fn window_start ->
          window_end = min(window_start + @backfill_batch_size - 1, last_id)

          repo().query!(
            """
            UPDATE #{click_sessions} AS click
            SET anonymous_visitor_id = visitor.id
            FROM #{visitors} AS visitor
            WHERE click.id BETWEEN $1 AND $2
              AND click.user_id IS NULL
              AND click.anonymous_id IS NOT NULL
              AND btrim(click.anonymous_id) <> ''
              AND visitor.legacy_anonymous_id = click.anonymous_id
            """,
            [window_start, window_end]
          )
        end)
    end
  end

  defp qualified_table(table), do: qualified_name(table)

  defp qualified_name(name) do
    case prefix() do
      nil -> quote_identifier(name)
      prefix -> "#{quote_identifier(prefix)}.#{quote_identifier(name)}"
    end
  end

  defp quote_identifier(identifier) do
    escaped = String.replace(identifier, "\"", "\"\"")
    "\"#{escaped}\""
  end
end
