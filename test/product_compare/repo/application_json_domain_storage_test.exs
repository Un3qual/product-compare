defmodule ProductCompare.Repo.ApplicationJsonDomainStorageTest do
  use ProductCompare.DataCase, async: true

  @snapshot_foreign_keys [
    {"comparison_snapshot_products", "comparison_snapshot_id", "comparison_snapshots"},
    {"comparison_snapshot_attributes", "snapshot_product_id", "comparison_snapshot_products"},
    {"comparison_snapshot_evidence", "snapshot_attribute_id", "comparison_snapshot_attributes"},
    {"comparison_snapshot_offers", "snapshot_product_id", "comparison_snapshot_products"},
    {"comparison_snapshot_recommendations", "comparison_snapshot_id", "comparison_snapshots"},
    {"comparison_snapshot_recommendations", "recommendation_algorithm_id",
     "recommendation_algorithms"},
    {"comparison_snapshot_rankings", "snapshot_recommendation_id",
     "comparison_snapshot_recommendations"}
  ]

  @enum_columns [
    {"comparison_snapshot_attributes", "source_type", "product_attribute_claim_source_type"},
    {"comparison_snapshot_offers", "freshness", "offer_freshness"},
    {"comparison_snapshot_recommendations", "profile", "recommendation_profile"},
    {"comparison_snapshot_recommendations", "status", "recommendation_status"}
  ]

  test "application-owned snapshot and alert JSON columns are absent" do
    refute column_exists?("comparison_snapshots", "payload")
    refute column_exists?("alert_events", "fact_snapshot")

    for column <- ~w(baseline_landed_price target_amount percentage_drop) do
      assert column_exists?("alert_events", column)
    end
  end

  test "comparison snapshot facts use ordered typed relational storage" do
    Enum.each(@snapshot_foreign_keys, fn {table, column, referenced_table} ->
      assert [[^referenced_table, "id"]] = foreign_key_target(table, column),
             "#{table}.#{column} must reference #{referenced_table}.id"
    end)

    Enum.each(@enum_columns, fn {table, column, expected_udt} ->
      assert [["USER-DEFINED", ^expected_udt]] = column_type(table, column)
    end)

    assert unique_columns?("recommendation_algorithms", ["code"])

    assert unique_columns?("comparison_snapshot_products", [
             "comparison_snapshot_id",
             "position"
           ])

    assert unique_columns?("comparison_snapshot_attributes", [
             "snapshot_product_id",
             "position"
           ])

    assert unique_columns?("comparison_snapshot_evidence", [
             "snapshot_attribute_id",
             "position"
           ])

    assert unique_columns?("comparison_snapshot_offers", ["snapshot_product_id", "position"])
    assert unique_columns?("comparison_snapshot_recommendations", ["comparison_snapshot_id"])

    assert unique_columns?("comparison_snapshot_rankings", [
             "snapshot_recommendation_id",
             "rank"
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

  defp column_type(table, column) do
    ProductCompare.Repo.query!(
      """
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
        AND column_name = $2
      """,
      [table, column]
    ).rows
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
