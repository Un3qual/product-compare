defmodule ProductCompare.Repo.CategoricalStoragePolicy do
  @moduledoc false

  @text_types ~w(bpchar text varchar)

  @type enum_field :: %{
          schema: module(),
          table: String.t(),
          field: atom(),
          column: String.t()
        }

  @type enum_column :: %{
          data_type: String.t(),
          udt_name: String.t(),
          type_kind: String.t()
        }

  @spec validate(module()) :: {:ok, [enum_field()]} | {:error, [String.t()]}
  def validate(repo) do
    fields = enum_fields()

    violations =
      enum_storage_violations(fields, enum_column_catalog(repo)) ++
        closed_domain_constraint_violations(text_constraint_catalog(repo))

    case violations do
      [] -> {:ok, fields}
      _ -> {:error, violations}
    end
  end

  @spec enum_fields(atom()) :: [enum_field()]
  def enum_fields(application \\ :product_compare) do
    case Application.spec(application, :modules) do
      nil -> raise ArgumentError, "application #{inspect(application)} is not loaded"
      modules -> enum_fields_from_modules(modules)
    end
  end

  @spec enum_fields_from_modules([module()]) :: [enum_field()]
  def enum_fields_from_modules(modules) do
    modules
    |> Enum.flat_map(&module_enum_fields/1)
    |> Enum.sort_by(&{&1.table, &1.column, &1.schema})
  end

  @spec enum_storage_violations(
          [enum_field()],
          %{{String.t(), String.t()} => enum_column()}
        ) :: [String.t()]
  def enum_storage_violations(fields, catalog) do
    Enum.flat_map(fields, fn field ->
      case Map.fetch(catalog, {field.table, field.column}) do
        {:ok, %{data_type: "USER-DEFINED", type_kind: "e"}} ->
          []

        {:ok, column} ->
          [
            "#{Atom.to_string(field.schema)} #{field.table}.#{field.column} " <>
              "(#{inspect(field.field)}) uses #{column.data_type}/#{column.udt_name} " <>
              "with PostgreSQL type kind #{column.type_kind}, expected a native enum"
          ]

        :error ->
          [
            "#{Atom.to_string(field.schema)} #{field.table}.#{field.column} " <>
              "(#{inspect(field.field)}) has no PostgreSQL column"
          ]
      end
    end)
  end

  @spec closed_domain_constraint_violations([map()]) :: [String.t()]
  def closed_domain_constraint_violations(constraints) do
    constraints
    |> Enum.filter(&closed_domain_constraint?/1)
    |> Enum.map(fn constraint ->
      "#{constraint.table}.#{constraint.column} uses text-backed closed-domain " <>
        "constraint #{constraint.constraint}"
    end)
    |> Enum.sort()
  end

  defp module_enum_fields(module) do
    if ecto_schema?(module) do
      persisted_enum_fields(module)
    else
      []
    end
  end

  defp ecto_schema?(module) do
    Code.ensure_loaded?(module) and function_exported?(module, :__schema__, 1) and
      is_binary(module.__schema__(:source))
  end

  defp persisted_enum_fields(module) do
    virtual_fields = MapSet.new(module.__schema__(:virtual_fields))

    module.__schema__(:fields)
    |> Enum.reject(&MapSet.member?(virtual_fields, &1))
    |> Enum.filter(&ecto_enum?(module.__schema__(:type, &1)))
    |> Enum.map(fn field ->
      %{
        schema: module,
        table: module.__schema__(:source),
        field: field,
        column: module.__schema__(:field_source, field) |> to_string()
      }
    end)
  end

  defp ecto_enum?({:parameterized, {Ecto.Enum, _parameters}}), do: true
  defp ecto_enum?(_type), do: false

  defp enum_column_catalog(repo) do
    repo.query!("""
    SELECT
      column_record.table_name,
      column_record.column_name,
      column_record.data_type,
      column_record.udt_name,
      type_record.typtype::text
    FROM information_schema.columns column_record
    JOIN pg_namespace type_namespace
      ON type_namespace.nspname = column_record.udt_schema
    JOIN pg_type type_record
      ON type_record.typnamespace = type_namespace.oid
     AND type_record.typname = column_record.udt_name
    WHERE column_record.table_schema = current_schema()
    """).rows
    |> Map.new(fn [table, column, data_type, udt_name, type_kind] ->
      {{table, column},
       %{
         data_type: data_type,
         udt_name: udt_name,
         type_kind: type_kind
       }}
    end)
  end

  defp text_constraint_catalog(repo) do
    repo.query!(
      """
      SELECT
        table_record.relname,
        column_record.attname,
        constraint_record.conname,
        pg_get_constraintdef(constraint_record.oid, true)
      FROM pg_constraint constraint_record
      JOIN pg_class table_record
        ON table_record.oid = constraint_record.conrelid
      JOIN pg_namespace table_namespace
        ON table_namespace.oid = table_record.relnamespace
      JOIN LATERAL unnest(constraint_record.conkey)
        AS constraint_column(attnum)
        ON true
      JOIN pg_attribute column_record
        ON column_record.attrelid = table_record.oid
       AND column_record.attnum = constraint_column.attnum
      JOIN pg_type type_record
        ON type_record.oid = column_record.atttypid
      WHERE constraint_record.contype = 'c'
        AND table_namespace.nspname = current_schema()
        AND type_record.typname = ANY($1)
      """,
      [@text_types]
    ).rows
    |> Enum.map(fn [table, column, constraint, definition] ->
      %{
        table: table,
        column: column,
        constraint: constraint,
        definition: definition
      }
    end)
  end

  defp closed_domain_constraint?(constraint) do
    column = Regex.escape(constraint.column)
    column_reference = ~s/(?:\"#{column}\"|\\b#{column}\\b)/

    any_array =
      Regex.compile!(
        column_reference <> ~S/\s*=\s*ANY\s*\(\s*ARRAY\s*\[/,
        "i"
      )

    in_list = Regex.compile!(column_reference <> ~S/\s+IN\s*\(/, "i")
    equality = Regex.compile!(column_reference <> ~S/\s*=\s*'[^']*'/, "i")

    Regex.match?(any_array, constraint.definition) or
      Regex.match?(in_list, constraint.definition) or
      (constraint.definition =~ ~r/\bOR\b/i and
         match?([_, _ | _], Regex.scan(equality, constraint.definition)))
  end
end
