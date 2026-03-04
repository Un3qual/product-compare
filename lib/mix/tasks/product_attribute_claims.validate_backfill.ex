defmodule ProductCompare.ProductAttributeClaims.ValidationBackfillWorkflow do
  @moduledoc false

  alias Ecto.Adapters.SQL
  alias ProductCompare.Repo

  @default_table "product_attribute_claims"
  @default_sample_size 10
  @typed_value_count_expression """
  (
    (CASE WHEN value_bool IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN value_int IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN value_num IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN value_text IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN value_date IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN value_ts IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN enum_option_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN value_json IS NOT NULL THEN 1 ELSE 0 END)
  )
  """
  @confidence_out_of_range_condition "confidence IS NOT NULL AND (confidence < 0 OR confidence > 1)"

  @type violation_bucket :: %{count: non_neg_integer(), sample_ids: [integer()]}
  @type report :: %{
          mode: :dry_run,
          typed_value_missing: violation_bucket(),
          typed_value_multiple: violation_bucket(),
          confidence_out_of_range: violation_bucket(),
          total_violating_rows: non_neg_integer(),
          manual_remediation_required: boolean()
        }

  @spec run(keyword()) :: report()
  def run(opts \\ []) do
    repo = Keyword.get(opts, :repo, Repo)
    table = opts |> Keyword.get(:table, @default_table) |> validate_table_name!()

    sample_size =
      opts |> Keyword.get(:sample_size, @default_sample_size) |> validate_sample_size!()

    counts = fetch_counts(repo, table)

    report = %{
      mode: :dry_run,
      typed_value_missing: %{
        count: counts.typed_value_missing,
        sample_ids: fetch_sample_ids(repo, table, "typed_value_count = 0", sample_size)
      },
      typed_value_multiple: %{
        count: counts.typed_value_multiple,
        sample_ids: fetch_sample_ids(repo, table, "typed_value_count > 1", sample_size)
      },
      confidence_out_of_range: %{
        count: counts.confidence_out_of_range,
        sample_ids: fetch_sample_ids(repo, table, @confidence_out_of_range_condition, sample_size)
      },
      total_violating_rows: counts.total_violating_rows
    }

    Map.put(report, :manual_remediation_required, report.total_violating_rows > 0)
  end

  @spec format_report(report()) :: String.t()
  def format_report(report) do
    [
      "product_attribute_claims validation report (dry-run)\n",
      "typed_value_missing: count=#{report.typed_value_missing.count} sample_ids=#{inspect(report.typed_value_missing.sample_ids)}\n",
      "typed_value_multiple: count=#{report.typed_value_multiple.count} sample_ids=#{inspect(report.typed_value_multiple.sample_ids)}\n",
      "confidence_out_of_range: count=#{report.confidence_out_of_range.count} sample_ids=#{inspect(report.confidence_out_of_range.sample_ids)}\n",
      "total_violating_rows: #{report.total_violating_rows}\n",
      remediation_line(report)
    ]
    |> IO.iodata_to_binary()
  end

  defp remediation_line(%{manual_remediation_required: true}) do
    "manual remediation required: YES (no deterministic safe auto-backfill implemented)\n"
  end

  defp remediation_line(%{manual_remediation_required: false}) do
    "manual remediation required: NO\n"
  end

  defp fetch_counts(repo, table) do
    result =
      SQL.query!(
        repo,
        """
        SELECT
          COUNT(*) FILTER (WHERE typed_value_count = 0) AS typed_value_missing,
          COUNT(*) FILTER (WHERE typed_value_count > 1) AS typed_value_multiple,
          COUNT(*) FILTER (WHERE #{`@confidence_out_of_range_condition`}) AS confidence_out_of_range,
          COUNT(*) FILTER (
            WHERE typed_value_count <> 1
               OR #{`@confidence_out_of_range_condition`}
          ) AS total_violating_rows
        FROM (
          SELECT id, confidence, #{`@typed_value_count_expression`} AS typed_value_count
          FROM "#{table}"
        ) claims
        """,
        []
      )

    [typed_value_missing, typed_value_multiple, confidence_out_of_range, total_violating_rows] =
      List.first(result.rows)

    %{
      typed_value_missing: typed_value_missing,
      typed_value_multiple: typed_value_multiple,
      confidence_out_of_range: confidence_out_of_range,
      total_violating_rows: total_violating_rows
    }
  end

  defp fetch_sample_ids(repo, table, condition_sql, sample_size) do
    result =
      SQL.query!(
        repo,
        """
        SELECT id
        FROM (
          SELECT id, confidence, #{@typed_value_count_expression} AS typed_value_count
          FROM #{table}
        ) claims
        WHERE #{condition_sql}
        ORDER BY id
        LIMIT $1
        """,
        [sample_size]
      )

    Enum.map(result.rows, fn [id] -> id end)
  end

  defp validate_table_name!(table_name) when is_binary(table_name) do
    if Regex.match?(~r/^[a-zA-Z_][a-zA-Z0-9_]*$/, table_name) do
      table_name
    else
      raise ArgumentError, "invalid table name: #{inspect(table_name)}"
    end
  end

  defp validate_table_name!(table_name) do
    raise ArgumentError, "invalid table name: #{inspect(table_name)}"
  end

  defp validate_sample_size!(sample_size) when is_integer(sample_size) and sample_size > 0,
    do: sample_size

  defp validate_sample_size!(sample_size) do
    raise ArgumentError, "sample_size must be a positive integer, got: #{inspect(sample_size)}"
  end
end

defmodule Mix.Tasks.ProductAttributeClaims.ValidateBackfill do
  use Mix.Task

  alias ProductCompare.ProductAttributeClaims.ValidationBackfillWorkflow

  @shortdoc "Validate existing product_attribute_claims rows for typed value and confidence violations"
  @switches [sample_size: :integer, strict: :boolean]
  @aliases [s: :sample_size]

  @moduledoc """
  Scans `product_attribute_claims` and reports existing-row violations for:
  - exactly one typed-value field set
  - confidence range (`NULL` or between `0` and `1`)

  This task is intentionally dry-run only. It does not mutate data.

  ## Options

    * `--sample-size` / `-s` - number of sample IDs to print per violation type (default: 10)
    * `--strict` - raises if violations are found (useful in automation)

  ## Example

      mix product_attribute_claims.validate_backfill --sample-size 25 --strict
  """

  @impl Mix.Task
  def run(args) do
    Mix.Task.run("app.start")

    {opts, _argv, invalid} = OptionParser.parse(args, strict: @switches, aliases: @aliases)
    validate_cli!(invalid)

    report =
      ValidationBackfillWorkflow.run(sample_size: Keyword.get(opts, :sample_size, 10))

    Mix.shell().info(ValidationBackfillWorkflow.format_report(report))

    if opts[:strict] && report.total_violating_rows > 0 do
      Mix.raise("Validation found existing-row violations in product_attribute_claims")
    end
  end

  defp validate_cli!([]), do: :ok

  defp validate_cli!(invalid) do
    invalid_flags =
      invalid
      |> Enum.map(fn {flag, _value} -> "--#{flag}" end)
      |> Enum.join(", ")

    Mix.raise("Unknown or invalid options: #{invalid_flags}")
  end
end
