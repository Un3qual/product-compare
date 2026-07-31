defmodule ProductCompare.Repo.IngestionReferenceStorageTest do
  use ProductCompare.DataCase, async: true

  @foreign_keys [
    {"sources", "source_kind_id", "source_kinds"},
    {"sources", "provider_id", "integration_providers"},
    {"ingestion_runs", "integration_surface_id", "integration_surfaces"},
    {"merchant_feed_candidates", "advertiser_country_id", "countries"},
    {"merchant_feed_candidates", "currency_id", "currencies"},
    {"merchant_feed_candidates", "language_id", "languages"},
    {"merchant_feed_candidates", "provider_feed_type_id", "provider_feed_types"}
  ]

  @removed_columns [
    {"sources", "kind"},
    {"ingestion_runs", "provider"},
    {"ingestion_runs", "surface"},
    {"merchant_feed_candidates", "provider"},
    {"merchant_feed_candidates", "advertiser_country"},
    {"merchant_feed_candidates", "source_feed_type"},
    {"merchant_feed_candidates", "language"}
  ]

  test "source and ingestion categories use controlled references" do
    Enum.each(@foreign_keys, fn {table, column, referenced_table} ->
      assert [[^referenced_table, "id"]] = foreign_key_target(table, column),
             "#{table}.#{column} must reference #{referenced_table}.id"
    end)

    Enum.each(@removed_columns, fn {table, column} ->
      refute column_exists?(table, column),
             "#{table}.#{column} duplicates a controlled ingestion reference"
    end)
  end

  test "controlled ingestion references expose stable unique codes" do
    for table <- ~w(source_kinds integration_providers countries languages) do
      assert column_exists?(table, "code")
      assert unique_columns?(table, ["code"])
    end

    for table <- ~w(integration_surfaces provider_feed_types) do
      assert column_exists?(table, "provider_id")
      assert column_exists?(table, "code")
      assert unique_columns?(table, ["provider_id", "code"])
    end

    assert column_exists?("countries", "numeric_code")
    assert column_exists?("countries", "name")
    assert column_exists?("languages", "name")
  end

  defp foreign_key_target(table, column) do
    Repo.query!(
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
    Repo.query!(
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
    Repo.query!(
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
