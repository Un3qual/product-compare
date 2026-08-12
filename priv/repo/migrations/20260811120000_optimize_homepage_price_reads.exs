defmodule ProductCompare.Repo.Migrations.OptimizeHomepagePriceReads do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  @new_index :price_points_home_latest_idx
  @old_index :price_points_mp_time_idx

  def up do
    ensure_concurrent_index(
      @new_index,
      " USING btree (merchant_product_id, observed_at DESC, id DESC) " <>
        "INCLUDE (price, shipping, in_stock)",
      "CREATE INDEX CONCURRENTLY #{quote_identifier(@new_index)} " <>
        "ON #{qualified_name(:price_points)} " <>
        "(merchant_product_id, observed_at DESC, id DESC) " <>
        "INCLUDE (price, shipping, in_stock)"
    )

    drop_concurrent_index(@old_index)
  end

  def down do
    ensure_concurrent_index(
      @old_index,
      " USING btree (merchant_product_id, observed_at)",
      "CREATE INDEX CONCURRENTLY #{quote_identifier(@old_index)} " <>
        "ON #{qualified_name(:price_points)} (merchant_product_id, observed_at)"
    )

    drop_concurrent_index(@new_index)
  end

  defp ensure_concurrent_index(index, expected_suffix, create_sql) do
    case index_state(index, expected_suffix) do
      :ready ->
        :ok

      _missing_or_wrong ->
        drop_concurrent_index(index)
        repo().query!(create_sql)
    end
  end

  defp index_state(index, expected_suffix) do
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
           [schema_name(), Atom.to_string(index)]
         ).rows do
      [[true, false, "price_points", definition]] ->
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
    escaped = identifier |> to_string() |> String.replace("\"", "\"\"")
    "\"#{escaped}\""
  end
end
