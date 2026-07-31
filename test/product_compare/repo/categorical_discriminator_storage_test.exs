defmodule ProductCompare.Repo.CategoricalDiscriminatorStorageTest do
  use ProductCompare.DataCase, async: true

  @removed_columns [
    {"reputation_events", "reason"},
    {"reputation_events", "ref_table"},
    {"reputation_events", "ref_id"},
    {"derived_formulas", "lang"},
    {"alert_delivery_attempts", "failure_category"},
    {"product_threads", "kind"},
    {"community_write_receipts", "mutation_kind"}
  ]

  test "reputation events use a controlled event type reference" do
    assert [["reputation_event_types", "id"]] =
             foreign_key_target("reputation_events", "reputation_event_type_id")

    assert column_exists?("reputation_event_types", "code")
    assert column_exists?("reputation_event_types", "name")
    assert column_exists?("reputation_event_types", "default_delta")
    assert unique_columns?("reputation_event_types", ["code"])
  end

  test "redundant categorical discriminators are absent" do
    Enum.each(@removed_columns, fn {table, column} ->
      refute column_exists?(table, column),
             "#{table}.#{column} is a redundant or unsafe categorical discriminator"
    end)

    assert unique_columns?("community_write_receipts", [
             "user_id",
             "content_type",
             "idempotency_key"
           ])
  end

  defp foreign_key_target(table, column) do
    ProductCompare.Repo.query!(
      """
      SELECT referenced_table.relname, referenced_column.attname
      FROM pg_constraint constraint_record
      JOIN pg_class owner_table
        ON owner_table.oid = constraint_record.conrelid
      JOIN pg_namespace owner_namespace
        ON owner_namespace.oid = owner_table.relnamespace
      JOIN pg_class referenced_table
        ON referenced_table.oid = constraint_record.confrelid
      JOIN LATERAL unnest(constraint_record.conkey, constraint_record.confkey)
        AS key_columns(owner_attnum, referenced_attnum)
        ON true
      JOIN pg_attribute owner_column
        ON owner_column.attrelid = owner_table.oid
       AND owner_column.attnum = key_columns.owner_attnum
      JOIN pg_attribute referenced_column
        ON referenced_column.attrelid = referenced_table.oid
       AND referenced_column.attnum = key_columns.referenced_attnum
      WHERE constraint_record.contype = 'f'
        AND owner_namespace.nspname = current_schema()
        AND owner_table.relname = $1
        AND owner_column.attname = $2
      """,
      [table, column]
    ).rows
  end

  defp column_exists?(table, column) do
    ProductCompare.Repo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
          AND column_name = $2
      )
      """,
      [table, column]
    ).rows == [[true]]
  end

  defp unique_columns?(table, columns) do
    ProductCompare.Repo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM pg_index index_record
        JOIN pg_class table_record
          ON table_record.oid = index_record.indrelid
        JOIN pg_namespace table_namespace
          ON table_namespace.oid = table_record.relnamespace
        WHERE table_namespace.nspname = current_schema()
          AND table_record.relname = $1
          AND index_record.indisunique
          AND (
            SELECT array_agg(column_record.attname::text ORDER BY key_column.ordinality)
            FROM unnest(index_record.indkey) WITH ORDINALITY
              AS key_column(attnum, ordinality)
            JOIN pg_attribute column_record
              ON column_record.attrelid = table_record.oid
             AND column_record.attnum = key_column.attnum
          ) = $2::text[]
      )
      """,
      [table, columns]
    ).rows == [[true]]
  end
end
