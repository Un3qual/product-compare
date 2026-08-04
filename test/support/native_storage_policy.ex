defmodule ProductCompare.TestSupport.NativeStoragePolicy do
  @moduledoc false

  @catalog_schema "public"
  @allowed_timestamp_tables MapSet.new(~w(oban_jobs oban_peers schema_migrations))
  @inet_columns [{@catalog_schema, "commerce_click_sessions", "ip_address"}]
  @digest_columns [
    {@catalog_schema, "ingestion_runs", "scope_fingerprint",
     "ingestion_runs_scope_fingerprint_sha256_length"},
    {@catalog_schema, "product_attribute_claims", "fingerprint",
     "product_attribute_claims_fingerprint_sha256_length"},
    {@catalog_schema, "source_artifacts", "content_hash",
     "source_artifacts_content_hash_sha256_length"}
  ]
  @cooldown_constraints %{
    price_watch_rules_cooldown_min_check: "cooldown >= '00:01:00'::interval",
    price_watch_rules_cooldown_max_check: "cooldown <= '8760:00:00'::interval",
    price_watch_rules_cooldown_whole_seconds_check:
      "date_trunc('second'::text, cooldown) = cooldown"
  }

  @type persisted_field :: %{
          schema: module(),
          database_schema: String.t(),
          table: String.t(),
          field: atom(),
          column: String.t()
        }

  @spec validate(module()) :: {:ok, map()} | {:error, [String.t()]}
  def validate(repo) do
    fields = persisted_fields()
    inet_fields = Enum.filter(fields, &(field_type(&1) == EctoNetwork.INET))
    utc_datetime_fields = Enum.filter(fields, &(field_type(&1) == :utc_datetime_usec))
    columns = column_catalog(repo)
    constraints = constraint_catalog(repo)

    violations =
      inet_storage_violations(inet_fields, columns) ++
        digest_storage_violations(fields, columns, constraints) ++
        cooldown_storage_violations(fields, columns, constraints) ++
        utc_datetime_storage_violations(utc_datetime_fields, columns) ++
        first_party_timestamp_violations(Map.values(columns), utc_datetime_fields)

    inventory = %{
      inet_fields: inet_fields,
      utc_datetime_fields: utc_datetime_fields,
      digest_columns: Enum.map(@digest_columns, &digest_column/1)
    }

    case Enum.sort(violations) do
      [] -> {:ok, inventory}
      errors -> {:error, errors}
    end
  end

  @spec utc_datetime_fields_from_modules([module()]) :: [persisted_field()]
  def utc_datetime_fields_from_modules(modules) do
    modules
    |> persisted_fields_from_modules()
    |> Enum.filter(&(field_type(&1) == :utc_datetime_usec))
  end

  @spec utc_datetime_storage_violations(
          [persisted_field()],
          %{{String.t(), String.t(), String.t()} => map()}
        ) :: [String.t()]
  def utc_datetime_storage_violations(fields, catalog) do
    fields
    |> Enum.flat_map(fn field ->
      case Map.fetch(catalog, field_key(field)) do
        {:ok, column} ->
          if timestamp_with_time_zone?(column),
            do: [],
            else: [timestamp_violation(column, field_label(field))]

        :error ->
          [
            "#{field_label(field)} expected timestamp with time zone/timestamptz precision 6, observed no PostgreSQL column"
          ]
      end
    end)
    |> Enum.sort()
  end

  @spec inet_storage_violations(
          [persisted_field()],
          %{{String.t(), String.t(), String.t()} => map()}
        ) :: [
          String.t()
        ]
  def inet_storage_violations(fields, catalog) do
    Enum.flat_map(@inet_columns, fn {schema, table, column} ->
      location = field_location(fields, schema, table, column)

      case Map.fetch(catalog, {schema, table, column}) do
        {:ok, %{data_type: "inet", udt_name: "inet"}} -> []
        {:ok, observed} -> [native_violation(observed, location, "inet/inet")]
        :error -> ["#{location} expected inet/inet, observed no PostgreSQL column"]
      end
    end)
  end

  @spec first_party_timestamp_violations([map()], [persisted_field()]) :: [String.t()]
  def first_party_timestamp_violations(columns, reflected_datetime_fields) do
    reflected_columns =
      MapSet.new(reflected_datetime_fields, &field_key/1)

    columns
    |> Enum.filter(&timestamp_column?/1)
    |> Enum.reject(&MapSet.member?(@allowed_timestamp_tables, &1.table))
    |> Enum.reject(&MapSet.member?(reflected_columns, column_key(&1)))
    |> Enum.reject(&timestamp_with_time_zone?/1)
    |> Enum.map(&timestamp_violation(&1, "#{&1.schema}.#{&1.table}.#{&1.column} (unreflected)"))
    |> Enum.sort()
  end

  defp persisted_fields do
    case Application.spec(:product_compare, :modules) do
      nil -> raise ArgumentError, "application :product_compare is not loaded"
      modules -> persisted_fields_from_modules(modules)
    end
  end

  defp persisted_fields_from_modules(modules) do
    modules
    |> Enum.flat_map(&module_persisted_fields/1)
    |> Enum.sort_by(&{&1.table, &1.column, &1.schema, &1.field})
  end

  defp module_persisted_fields(module) do
    if ecto_schema?(module) do
      virtual_fields = MapSet.new(module.__schema__(:virtual_fields))

      module.__schema__(:fields)
      |> Enum.reject(&MapSet.member?(virtual_fields, &1))
      |> Enum.map(fn field ->
        %{
          schema: module,
          database_schema: @catalog_schema,
          table: module.__schema__(:source),
          field: field,
          column: module.__schema__(:field_source, field) |> to_string()
        }
      end)
    else
      []
    end
  end

  defp ecto_schema?(module) do
    Code.ensure_loaded?(module) and function_exported?(module, :__schema__, 1) and
      is_binary(module.__schema__(:source))
  end

  defp field_type(%{schema: schema, field: field}), do: schema.__schema__(:type, field)

  @spec digest_storage_violations(
          [persisted_field()],
          %{{String.t(), String.t(), String.t()} => map()},
          %{{String.t(), String.t(), String.t()} => String.t()}
        ) :: [String.t()]
  def digest_storage_violations(fields, columns, constraints) do
    Enum.flat_map(@digest_columns, fn {schema, table, column, constraint} ->
      location = field_location(fields, schema, table, column)

      column_errors =
        case Map.fetch(columns, {schema, table, column}) do
          {:ok, %{data_type: "bytea", udt_name: "bytea"}} -> []
          {:ok, observed} -> [native_violation(observed, location, "bytea/bytea")]
          :error -> ["#{location} expected bytea/bytea, observed no PostgreSQL column"]
        end

      constraint_errors =
        case Map.fetch(constraints, {schema, table, constraint}) do
          {:ok, definition} ->
            if digest_constraint_valid?(definition, column) do
              []
            else
              [
                "#{location} expected 32-byte SHA-256 check " <>
                  "#{constraint}, observed #{definition}"
              ]
            end

          :error ->
            [
              "#{location} expected 32-byte SHA-256 check " <>
                "#{constraint}, observed no PostgreSQL constraint"
            ]
        end

      column_errors ++ constraint_errors
    end)
  end

  @spec cooldown_storage_violations(
          [persisted_field()],
          %{{String.t(), String.t(), String.t()} => map()},
          %{{String.t(), String.t(), String.t()} => String.t()}
        ) :: [String.t()]
  def cooldown_storage_violations(fields, columns, constraints) do
    location = field_location(fields, @catalog_schema, "price_watch_rules", "cooldown")

    column_errors =
      case Map.fetch(columns, {@catalog_schema, "price_watch_rules", "cooldown"}) do
        {:ok, %{data_type: "interval", udt_name: "interval", interval_type: "DAY TO SECOND"}} ->
          []

        {:ok, column} ->
          [native_violation(column, location, "interval/interval type modifier DAY TO SECOND")]

        :error ->
          [
            "#{location} expected interval/interval type modifier DAY TO SECOND, observed no PostgreSQL column"
          ]
      end

    constraint_errors =
      Enum.flat_map(@cooldown_constraints, fn {name, expected} ->
        constraint_name = Atom.to_string(name)

        case Map.fetch(constraints, {@catalog_schema, "price_watch_rules", constraint_name}) do
          {:ok, observed} ->
            if cooldown_constraint_valid?(name, observed) do
              []
            else
              [
                "#{location} expected interval constraint #{constraint_name} as #{expected}, " <>
                  "observed #{observed}"
              ]
            end

          :error ->
            [
              "#{location} expected interval constraint #{constraint_name} as #{expected}, " <>
                "observed no PostgreSQL constraint"
            ]
        end
      end)

    column_errors ++ constraint_errors
  end

  defp column_catalog(repo) do
    repo.query!(
      """
      SELECT table_schema, table_name, column_name, data_type, udt_name,
             datetime_precision, interval_type, interval_precision
      FROM information_schema.columns
      WHERE table_schema = $1
      ORDER BY table_name, column_name
      """,
      [@catalog_schema]
    ).rows
    |> Map.new(fn [
                    schema,
                    table,
                    column,
                    data_type,
                    udt_name,
                    datetime_precision,
                    interval_type,
                    interval_precision
                  ] ->
      {{schema, table, column},
       %{
         schema: schema,
         table: table,
         column: column,
         data_type: data_type,
         udt_name: udt_name,
         datetime_precision: datetime_precision,
         interval_type: interval_type,
         interval_precision: interval_precision
       }}
    end)
  end

  defp constraint_catalog(repo) do
    repo.query!(
      """
      SELECT table_record.relname, constraint_record.conname,
             pg_get_constraintdef(constraint_record.oid, true)
      FROM pg_constraint constraint_record
      JOIN pg_class table_record ON table_record.oid = constraint_record.conrelid
      JOIN pg_namespace table_namespace ON table_namespace.oid = table_record.relnamespace
      WHERE constraint_record.contype = 'c'
        AND table_namespace.nspname = $1
      ORDER BY table_record.relname, constraint_record.conname
      """,
      [@catalog_schema]
    ).rows
    |> Map.new(fn [table, constraint, definition] ->
      {{@catalog_schema, table, constraint}, definition}
    end)
  end

  defp timestamp_with_time_zone?(%{
         data_type: "timestamp with time zone",
         udt_name: "timestamptz",
         datetime_precision: 6
       }),
       do: true

  defp timestamp_with_time_zone?(_column), do: false

  defp timestamp_column?(%{data_type: data_type})
       when data_type in ["timestamp with time zone", "timestamp without time zone"],
       do: true

  defp timestamp_column?(_column), do: false

  @spec digest_constraint_valid?(String.t(), String.t()) :: boolean()
  def digest_constraint_valid?(definition, column) do
    normalized_constraint(definition) ==
      normalized_constraint("#{column} IS NULL OR octet_length(#{column}) = 32")
  end

  @spec cooldown_constraint_valid?(atom(), String.t()) :: boolean()
  def cooldown_constraint_valid?(name, definition) do
    case Map.fetch(@cooldown_constraints, name) do
      {:ok, expected} -> normalized_constraint(definition) == normalized_constraint(expected)
      :error -> false
    end
  end

  defp native_violation(column, location, expected) do
    "#{location} expected #{expected}, observed #{observed_type(column)}"
  end

  defp timestamp_violation(column, location) do
    "#{location} expected timestamp with time zone/timestamptz precision 6, " <>
      "observed #{observed_type(column)}"
  end

  defp observed_type(column) do
    precision = Map.get(column, :datetime_precision) || Map.get(column, :interval_precision)

    modifier =
      case Map.get(column, :interval_type) do
        nil -> ""
        type -> " type modifier #{type}"
      end

    "#{column.data_type}/#{column.udt_name}" <>
      if(is_nil(precision), do: modifier, else: " precision #{precision}" <> modifier)
  end

  defp field_label(field) do
    "#{field.database_schema}.#{field.table}.#{field.column} " <>
      "(#{Atom.to_string(field.schema)} #{inspect(field.field)})"
  end

  defp field_location(fields, schema, table, column) do
    case Enum.find(fields, &(field_key(&1) == {schema, table, column})) do
      nil -> "#{schema}.#{table}.#{column} (no Ecto field)"
      field -> field_label(field)
    end
  end

  defp field_key(field), do: {field.database_schema, field.table, field.column}
  defp column_key(column), do: {column.schema, column.table, column.column}

  defp digest_column({_schema, table, column, _constraint}), do: {table, column}

  defp normalized_constraint(definition) do
    definition
    |> String.downcase()
    |> String.replace(~r/::(?:[a-z_][a-z0-9_]*|"[^"]+")/i, "")
    |> String.replace(~r/\bcheck\b/i, "")
    |> String.replace(~r/[\s()"]/, "")
  end
end
