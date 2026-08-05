defmodule ProductCompare.TestSupport.ApplicationJsonStoragePolicy do
  @moduledoc false

  @classifications [
    %{
      schema: ProductCompareSchemas.CommerceAttribution.CommerceConversion,
      field: :raw_payload,
      source: :raw_payload,
      table: "commerce_conversions",
      column: "raw_payload",
      classification: "raw provider evidence"
    },
    %{
      schema: ProductCompareSchemas.CommerceAttribution.CommerceLink,
      field: :campaign_params,
      source: :campaign_params,
      table: "commerce_links",
      column: "campaign_params",
      classification: "open-key campaign metadata"
    },
    %{
      schema: ProductCompareSchemas.Ingestion.ImportRun,
      field: :query,
      source: :query,
      table: "ingestion_runs",
      column: "query",
      classification: "provider request metadata"
    },
    %{
      schema: ProductCompareSchemas.Ingestion.MerchantFeedCandidate,
      field: :raw_metadata,
      source: :raw_metadata,
      table: "merchant_feed_candidates",
      column: "raw_metadata",
      classification: "raw provider evidence"
    },
    %{
      schema: ProductCompareSchemas.Specs.ProductAttributeClaim,
      field: :value_json,
      source: :value_json,
      table: "product_attribute_claims",
      column: "value_json",
      classification: "explicitly JSON-typed specification data"
    },
    %{
      schema: ProductCompareSchemas.Specs.SourceArtifact,
      field: :raw_json,
      source: :raw_json,
      table: "source_artifacts",
      column: "raw_json",
      classification: "raw provider evidence"
    }
  ]

  @classification_choices [
    "raw provider evidence",
    "provider request metadata",
    "open-key campaign metadata",
    "explicitly JSON-typed specification data"
  ]

  @framework_owned_json_columns MapSet.new([
                                  {"oban_jobs", "args"},
                                  {"oban_jobs", "meta"}
                                ])

  @type schema_field :: %{
          schema: module(),
          field: atom(),
          source: atom(),
          table: String.t(),
          column: String.t()
        }

  @type catalog_column :: %{
          table: String.t(),
          column: String.t(),
          data_type: String.t(),
          udt_name: String.t()
        }

  @type classification :: %{
          schema: module(),
          field: atom(),
          source: atom(),
          table: String.t(),
          column: String.t(),
          classification: String.t()
        }

  @spec validate(module()) :: {:ok, [classification()]} | {:error, [String.t()]}
  def validate(repo) do
    fields = ecto_schema_modules() |> persisted_map_fields_from_modules()
    catalog = json_column_catalog(repo)

    validate_inventories(fields, catalog, @classifications)
  end

  @spec persisted_map_fields_from_modules([module()]) :: [schema_field()]
  def persisted_map_fields_from_modules(modules) do
    modules
    |> Enum.flat_map(fn module ->
      if ecto_schema?(module) do
        virtual_fields = MapSet.new(module.__schema__(:virtual_fields))

        module.__schema__(:fields)
        |> Enum.reject(&MapSet.member?(virtual_fields, &1))
        |> Enum.filter(&(module.__schema__(:type, &1) == :map))
        |> Enum.map(&field_inventory(module, &1))
      else
        []
      end
    end)
    |> Enum.sort_by(&field_contract_key/1)
  end

  @spec virtual_map_fields_from_modules([module()]) :: [schema_field()]
  def virtual_map_fields_from_modules(modules) do
    modules
    |> Enum.flat_map(fn module ->
      if ecto_schema?(module) do
        module.__schema__(:virtual_fields)
        |> Enum.filter(&(module.__schema__(:virtual_type, &1) == :map))
        |> Enum.map(&field_inventory(module, &1))
      else
        []
      end
    end)
    |> Enum.sort_by(&field_contract_key/1)
  end

  @spec virtual_map_fields() :: [schema_field()]
  def virtual_map_fields do
    ecto_schema_modules()
    |> virtual_map_fields_from_modules()
  end

  @spec validate_inventories([schema_field()], [catalog_column()], [classification()]) ::
          {:ok, [classification()]} | {:error, [String.t()]}
  def validate_inventories(schema_fields, catalog_columns, classifications) do
    fields = Enum.sort_by(schema_fields, &field_contract_key/1)

    columns =
      catalog_columns
      |> Enum.reject(&MapSet.member?(@framework_owned_json_columns, column_key(&1)))
      |> Enum.sort_by(&column_key/1)

    policies = Enum.sort_by(classifications, &field_contract_key/1)

    violations =
      schema_inventory_violations(fields, columns) ++
        catalog_inventory_violations(fields, columns) ++
        field_classification_violations(fields, policies) ++
        catalog_classification_violations(fields, columns, policies) ++
        classification_contract_violations(fields, columns, policies)

    case violations |> Enum.uniq() |> Enum.sort() do
      [] -> {:ok, policies}
      errors -> {:error, errors}
    end
  end

  defp schema_inventory_violations(fields, columns) do
    Enum.flat_map(fields, fn field ->
      if Enum.any?(columns, &(column_key(&1) == column_key(field))) do
        []
      else
        [
          "Schema inventory: #{field_label(field)} is a persisted Ecto :map field without a " <>
            "matching PostgreSQL json/jsonb catalog column."
        ]
      end
    end)
  end

  defp catalog_inventory_violations(fields, columns) do
    Enum.flat_map(columns, fn column ->
      if Enum.any?(fields, &(column_key(&1) == column_key(column))) do
        []
      else
        [
          "Catalog inventory: #{column_label(column)} uses PostgreSQL " <>
            "#{column.data_type}/#{column.udt_name} without a matching persisted Ecto :map field."
        ]
      end
    end)
  end

  defp field_classification_violations(fields, policies) do
    Enum.flat_map(fields, fn field ->
      case Enum.filter(policies, &(field_contract_key(&1) == field_contract_key(field))) do
        [] ->
          [
            "Policy classification: #{field_label(field)} has no explicit JSON storage " <>
              "classification. Classify only raw provider evidence, provider request metadata, " <>
              "open-key campaign metadata, or explicitly JSON-typed specification data; " <>
              "stable application-owned facts must use typed relational storage."
          ]

        [_policy] ->
          []

        matches ->
          [
            "Policy classification: #{field_label(field)} has #{length(matches)} JSON storage " <>
              "classifications; exactly one narrow classification is required."
          ]
      end
    end)
  end

  defp catalog_classification_violations(fields, columns, policies) do
    Enum.flat_map(columns, fn column ->
      reflected? = Enum.any?(fields, &(column_key(&1) == column_key(column)))
      classified? = Enum.any?(policies, &(column_key(&1) == column_key(column)))

      if reflected? or classified? do
        []
      else
        [
          "Policy classification: #{column_label(column)} has no explicit JSON storage contract " <>
            "for its PostgreSQL #{column.data_type}/#{column.udt_name} column. Add a matching " <>
            "persisted Ecto :map field and one narrow classification, or migrate stable " <>
            "application-owned facts to typed relational storage."
        ]
      end
    end)
  end

  defp classification_contract_violations(fields, columns, policies) do
    Enum.flat_map(policies, fn policy ->
      classification_errors =
        if policy.classification in @classification_choices do
          []
        else
          [
            "Policy classification: #{field_label(policy)} uses unsupported classification " <>
              "#{inspect(policy.classification)}; choose one of #{inspect(@classification_choices)}."
          ]
        end

      inventory_errors =
        if Enum.any?(fields, &(field_contract_key(&1) == field_contract_key(policy))) and
             Enum.any?(columns, &(column_key(&1) == column_key(policy))) do
          []
        else
          [
            "Policy classification: #{field_label(policy)} is stale because it does not match " <>
              "both the persisted Ecto :map inventory and PostgreSQL json/jsonb catalog."
          ]
        end

      classification_errors ++ inventory_errors
    end)
  end

  defp ecto_schema_modules do
    case Application.spec(:product_compare, :modules) do
      nil -> raise ArgumentError, "application :product_compare is not loaded"
      modules -> Enum.filter(modules, &ecto_schema?/1)
    end
  end

  defp ecto_schema?(module) do
    Code.ensure_loaded?(module) and function_exported?(module, :__schema__, 1) and
      is_binary(module.__schema__(:source))
  end

  defp field_inventory(module, field) do
    source = module.__schema__(:field_source, field) || field

    %{
      schema: module,
      field: field,
      source: source,
      table: module.__schema__(:source),
      column: to_string(source)
    }
  end

  defp json_column_catalog(repo) do
    repo.query!(
      """
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND data_type IN ('json', 'jsonb')
      ORDER BY table_name, column_name
      """,
      []
    ).rows
    |> Enum.map(fn [table, column, data_type, udt_name] ->
      %{table: table, column: column, data_type: data_type, udt_name: udt_name}
    end)
  end

  defp field_contract_key(field) do
    {field.table, field.column, field.schema, field.field, field.source}
  end

  defp column_key(column), do: {column.table, column.column}

  defp field_label(field) do
    "#{Atom.to_string(field.schema)} #{field.table}.#{field.column} " <>
      "(#{inspect(field.field)}, source #{inspect(field.source)})"
  end

  defp column_label(column), do: "#{column.table}.#{column.column}"
end
