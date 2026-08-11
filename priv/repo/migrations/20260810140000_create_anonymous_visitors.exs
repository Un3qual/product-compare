defmodule ProductCompare.Repo.Migrations.CreateAnonymousVisitors do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  @backfill_batch_size 10_000
  @transition_function "resolve_legacy_anonymous_visitor"
  @transition_trigger "commerce_click_sessions_resolve_legacy_anonymous_visitor"
  @lookup_index "commerce_click_sessions_anonymous_visitor_idx"
  @visitor_foreign_key "commerce_click_sessions_anonymous_visitor_id_fkey"
  @single_actor_check "commerce_click_sessions_single_actor"

  def up do
    click_sessions = qualified_table("commerce_click_sessions")
    visitors = qualified_table("anonymous_visitors")
    transition_function = qualified_name(@transition_function)

    create_if_not_exists table(:anonymous_visitors) do
      add :legacy_anonymous_id, :text
      add :entropy_id, :uuid, null: false, default: fragment("uuidv7()")
      timestamps(type: :timestamptz, precision: 6, size: 6)
    end

    create_if_not_exists(
      unique_index(:anonymous_visitors, [:legacy_anonymous_id],
        name: :anonymous_visitors_legacy_anonymous_id_index,
        where: "legacy_anonymous_id IS NOT NULL"
      )
    )

    create_if_not_exists unique_index(:anonymous_visitors, [:entropy_id])

    alter table(:commerce_click_sessions) do
      add_if_not_exists :anonymous_visitor_id, :bigint
    end

    flush()

    execute("""
    CREATE OR REPLACE FUNCTION #{transition_function}()
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
        SELECT visitor.id
        INTO resolved_visitor_id
        FROM #{visitors} AS visitor
        WHERE visitor.legacy_anonymous_id = NEW.anonymous_id;

        IF resolved_visitor_id IS NULL THEN
          INSERT INTO #{visitors} (legacy_anonymous_id, entropy_id, inserted_at, updated_at)
          VALUES (NEW.anonymous_id, uuidv7(), now(), now())
          ON CONFLICT (legacy_anonymous_id) WHERE legacy_anonymous_id IS NOT NULL
          DO NOTHING
          RETURNING id INTO resolved_visitor_id;

          IF resolved_visitor_id IS NULL THEN
            SELECT visitor.id
            INTO resolved_visitor_id
            FROM #{visitors} AS visitor
            WHERE visitor.legacy_anonymous_id = NEW.anonymous_id;
          END IF;
        END IF;

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
    CREATE OR REPLACE TRIGGER #{@transition_trigger}
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

    ensure_concurrent_index(
      "commerce_click_sessions",
      @lookup_index,
      " USING btree (anonymous_visitor_id)",
      "CREATE INDEX CONCURRENTLY #{quote_identifier(@lookup_index)} " <>
        "ON #{click_sessions} (anonymous_visitor_id)"
    )

    add_constraint_unless_exists(
      "commerce_click_sessions",
      @visitor_foreign_key,
      """
      ALTER TABLE #{click_sessions}
      ADD CONSTRAINT #{@visitor_foreign_key}
      FOREIGN KEY (anonymous_visitor_id)
      REFERENCES #{visitors}(id)
      ON DELETE SET NULL
      NOT VALID
      """
    )

    add_constraint_unless_exists(
      "commerce_click_sessions",
      @single_actor_check,
      """
      ALTER TABLE #{click_sessions}
      ADD CONSTRAINT #{@single_actor_check}
      CHECK (NOT (user_id IS NOT NULL AND anonymous_visitor_id IS NOT NULL))
      NOT VALID
      """
    )

    repo().query!("""
    ALTER TABLE #{click_sessions}
    VALIDATE CONSTRAINT #{@visitor_foreign_key}
    """)

    repo().query!("""
    ALTER TABLE #{click_sessions}
    VALIDATE CONSTRAINT #{@single_actor_check}
    """)
  end

  def down do
    click_sessions = qualified_table("commerce_click_sessions")
    transition_function = qualified_name(@transition_function)

    execute("DROP TRIGGER IF EXISTS #{@transition_trigger} ON #{click_sessions}")
    execute("DROP FUNCTION IF EXISTS #{transition_function}()")

    flush()

    restore_current_visitor_legacy_ids(click_sessions)

    repo().query!("""
    ALTER TABLE #{click_sessions}
    DROP CONSTRAINT IF EXISTS #{@single_actor_check}
    """)

    repo().query!("""
    ALTER TABLE #{click_sessions}
    DROP CONSTRAINT IF EXISTS #{@visitor_foreign_key}
    """)

    drop_concurrent_index(@lookup_index)

    repo().query!("ALTER TABLE #{click_sessions} DROP COLUMN IF EXISTS anonymous_visitor_id")
    repo().query!("DROP TABLE IF EXISTS #{qualified_table("anonymous_visitors")}")
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
              AND click.anonymous_visitor_id IS DISTINCT FROM visitor.id
            """,
            [window_start, window_end]
          )
        end)
    end
  end

  defp qualified_table(table), do: qualified_name(table)

  defp restore_current_visitor_legacy_ids(click_sessions) do
    if table_exists?("anonymous_visitors") and
         column_exists?("commerce_click_sessions", "anonymous_visitor_id") do
      repo().query!("""
      UPDATE #{click_sessions} AS click
      SET anonymous_id = visitor.entropy_id::text
      FROM #{qualified_table("anonymous_visitors")} AS visitor
      WHERE click.anonymous_visitor_id = visitor.id
        AND click.user_id IS NULL
        AND click.anonymous_id IS NULL
      """)
    end
  end

  defp ensure_concurrent_index(table, index, expected_suffix, create_sql) do
    case index_state(table, index, expected_suffix) do
      :ready ->
        :ok

      _missing_or_wrong ->
        drop_concurrent_index(index)
        repo().query!(create_sql)
    end
  end

  defp index_state(table, index, expected_suffix) do
    case repo().query!(
           """
           SELECT index_record.indisvalid,
                  index_record.indisunique,
                  indexed_relation.relname,
                  pg_get_indexdef(index_relation.oid)
           FROM pg_index AS index_record
           JOIN pg_class AS index_relation ON index_relation.oid = index_record.indexrelid
           JOIN pg_class AS indexed_relation ON indexed_relation.oid = index_record.indrelid
           JOIN pg_namespace AS namespace ON namespace.oid = index_relation.relnamespace
           WHERE namespace.nspname = $1 AND index_relation.relname = $2
           """,
           [schema_name(), index]
         ).rows do
      [[true, false, ^table, definition]] ->
        if String.ends_with?(definition, expected_suffix), do: :ready, else: :wrong

      [] ->
        :missing

      [_invalid_or_wrong] ->
        :wrong
    end
  end

  defp drop_concurrent_index(index) do
    repo().query!("DROP INDEX CONCURRENTLY IF EXISTS #{qualified_name(index)}")
  end

  defp add_constraint_unless_exists(table, constraint, ddl) do
    unless constraint_exists?(table, constraint), do: repo().query!(ddl)
  end

  defp constraint_exists?(table, constraint) do
    repo().query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM pg_constraint AS constraint_record
        JOIN pg_class AS relation ON relation.oid = constraint_record.conrelid
        JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = $1
          AND relation.relname = $2
          AND constraint_record.conname = $3
      )
      """,
      [schema_name(), table, constraint]
    ).rows == [[true]]
  end

  defp table_exists?(table) do
    repo().query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      )
      """,
      [schema_name(), table]
    ).rows == [[true]]
  end

  defp column_exists?(table, column) do
    repo().query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
      )
      """,
      [schema_name(), table, column]
    ).rows == [[true]]
  end

  defp schema_name do
    case prefix() do
      nil -> repo().query!("SELECT current_schema()").rows |> List.first() |> List.first()
      prefix -> prefix
    end
  end

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
