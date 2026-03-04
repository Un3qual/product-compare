defmodule ProductCompare.ProductAttributeClaims.ValidationBackfillWorkflowTest do
  use ProductCompare.DataCase, async: true

  alias Ecto.Adapters.SQL
  alias ProductCompare.ProductAttributeClaims.ValidationBackfillWorkflow

  describe "run/1" do
    test "returns zero violations when all rows are valid" do
      table_name = create_temp_claims_table!()

      SQL.query!(
        Repo,
        """
        INSERT INTO #{table_name} (id, confidence, value_bool)
        VALUES
          (1, 0.8, true),
          (2, NULL, false),
          (3, 0.5, true)
        """,
        []
      )

      report = ValidationBackfillWorkflow.run(repo: Repo, table: table_name, sample_size: 5)

      assert report.mode == :dry_run
      assert report.typed_value_missing.count == 0
      assert report.typed_value_missing.sample_ids == []
      assert report.typed_value_multiple.count == 0
      assert report.typed_value_multiple.sample_ids == []
      assert report.confidence_out_of_range.count == 0
      assert report.confidence_out_of_range.sample_ids == []
      assert report.total_violating_rows == 0
      assert report.manual_remediation_required == false
    end

    test "reports counts and sample ids for each violation type" do
      table_name = create_temp_claims_table!()

      SQL.query!(
        Repo,
        """
        INSERT INTO #{table_name} (id, confidence, value_bool, value_text, value_int)
        VALUES
          (1, NULL, NULL, NULL, NULL),
          (2, 0.7, true, 'conflicting', NULL),
          (3, -0.1, true, NULL, NULL),
          (4, 2.0, NULL, NULL, NULL),
          (5, 0.4, NULL, NULL, 7)
        """,
        []
      )

      report = ValidationBackfillWorkflow.run(repo: Repo, table: table_name, sample_size: 1)

      assert report.mode == :dry_run
      assert report.typed_value_missing.count == 2
      assert report.typed_value_missing.sample_ids == [1]
      assert report.typed_value_multiple.count == 1
      assert report.typed_value_multiple.sample_ids == [2]
      assert report.confidence_out_of_range.count == 2
      assert report.confidence_out_of_range.sample_ids == [3]
      assert report.total_violating_rows == 4
      assert report.manual_remediation_required == true
    end

    test "rejects invalid table names" do
      assert_raise ArgumentError, ~r/invalid table name/, fn ->
        ValidationBackfillWorkflow.run(repo: Repo, table: "claims;drop table", sample_size: 10)
      end
    end
  end

  defp create_temp_claims_table! do
    unique_suffix = System.unique_integer([:positive])
    table_name = "tmp_claim_validation_#{unique_suffix}"

    SQL.query!(
      Repo,
      """
      CREATE TEMP TABLE #{table_name} (
        id BIGINT PRIMARY KEY,
        confidence NUMERIC,
        value_bool BOOLEAN,
        value_int BIGINT,
        value_num NUMERIC,
        value_text TEXT,
        value_date DATE,
        value_ts TIMESTAMPTZ,
        enum_option_id BIGINT,
        value_json JSONB
      ) ON COMMIT DROP
      """,
      []
    )

    table_name
  end
end
