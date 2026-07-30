defmodule ProductCompare.Repo.DomainReferenceStorageTest do
  use ProductCompare.DataCase, async: true

  @foreign_keys [
    {"merchant_products", "currency_id", "currencies"},
    {"coupons", "currency_id", "currencies"},
    {"merchant_feed_candidates", "currency_id", "currencies"},
    {"commerce_conversions", "currency_id", "currencies"},
    {"purchase_price_facts", "currency_id", "currencies"},
    {"price_watch_rules", "currency_id", "currencies"},
    {"alert_events", "currency_id", "currencies"},
    {"affiliate_programs", "affiliate_program_status_id", "affiliate_program_statuses"},
    {"commerce_conversions", "affiliate_network_id", "affiliate_networks"}
  ]

  @removed_columns [
    {"merchant_products", "currency"},
    {"coupons", "currency"},
    {"merchant_feed_candidates", "currency"},
    {"commerce_conversions", "currency"},
    {"purchase_price_facts", "currency"},
    {"price_watch_rules", "currency"},
    {"alert_events", "currency"},
    {"affiliate_programs", "status"},
    {"commerce_conversions", "source_network"},
    {"commerce_links", "network"}
  ]

  test "commerce domain values use controlled reference rows" do
    Enum.each(@foreign_keys, fn {table, column, referenced_table} ->
      assert [[^referenced_table, "id"]] = foreign_key_target(table, column),
             "#{table}.#{column} must reference #{referenced_table}.id"
    end)

    Enum.each(@removed_columns, fn {table, column} ->
      refute column_exists?(table, column),
             "#{table}.#{column} duplicates a controlled commerce reference"
    end)
  end

  test "controlled commerce references expose unique stable codes" do
    assert column_exists?("currencies", "code")
    assert column_exists?("currencies", "numeric_code")
    assert column_exists?("currencies", "minor_unit")
    assert column_exists?("currencies", "name")
    assert unique_column?("currencies", "code")

    assert column_exists?("affiliate_program_statuses", "code")
    assert column_exists?("affiliate_program_statuses", "name")
    assert column_exists?("affiliate_program_statuses", "enabled")
    assert unique_column?("affiliate_program_statuses", "code")

    assert column_exists?("affiliate_networks", "code")
    assert unique_column?("affiliate_networks", "code")
  end

  test "seeded reference identifiers match the application code mappings" do
    assert Repo.query!("""
           SELECT id, code, numeric_code, minor_unit
           FROM currencies
           ORDER BY code
           """).rows == [
             [124, "CAD", "124", 2],
             [978, "EUR", "978", 2],
             [826, "GBP", "826", 2],
             [840, "USD", "840", 2]
           ]

    assert Repo.query!("""
           SELECT id, code, enabled
           FROM affiliate_program_statuses
           ORDER BY id
           """).rows == [[1, "active", true], [2, "paused", true]]

    assert Repo.query!("""
           SELECT code
           FROM affiliate_networks
           WHERE code IN ('impact', 'awin', 'rakuten', 'cj', 'amazon_associates')
           ORDER BY code
           """).rows == [
             ["amazon_associates"],
             ["awin"],
             ["cj"],
             ["impact"],
             ["rakuten"]
           ]
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

  defp unique_column?(table, column) do
    Repo.query!(
      """
      SELECT EXISTS (
        SELECT 1
        FROM pg_index index_record
        JOIN pg_class table_record
          ON table_record.oid = index_record.indrelid
        JOIN pg_namespace table_namespace
          ON table_namespace.oid = table_record.relnamespace
        JOIN pg_attribute column_record
          ON column_record.attrelid = table_record.oid
         AND column_record.attnum = ANY(index_record.indkey)
        WHERE table_namespace.nspname = current_schema()
          AND table_record.relname = $1
          AND column_record.attname = $2
          AND index_record.indisunique
          AND index_record.indnkeyatts = 1
      )
      """,
      [table, column]
    ).rows == [[true]]
  end
end
