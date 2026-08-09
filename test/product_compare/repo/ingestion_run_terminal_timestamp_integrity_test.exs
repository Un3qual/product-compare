defmodule ProductCompare.Repo.IngestionRunTerminalTimestampIntegrityTest do
  use ProductCompare.DataCase, async: true

  test "ingestion runs reject succeeded rows without a completion timestamp" do
    assert_check_violation(
      insert_ingestion_run("succeeded", nil),
      "ingestion_runs_terminal_finished_at_required"
    )
  end

  test "ingestion runs reject failed rows without a completion timestamp" do
    assert_check_violation(
      insert_ingestion_run("failed", nil),
      "ingestion_runs_terminal_finished_at_required"
    )
  end

  test "ingestion runs accept running rows without a completion timestamp" do
    assert {:ok, _result} = insert_ingestion_run("running", nil)
  end

  test "ingestion runs accept succeeded rows with a completion timestamp" do
    assert {:ok, _result} = insert_ingestion_run("succeeded", DateTime.utc_now())
  end

  test "ingestion runs accept failed rows with a completion timestamp" do
    assert {:ok, _result} = insert_ingestion_run("failed", DateTime.utc_now())
  end

  defp insert_ingestion_run(status, finished_at) do
    ProductCompare.Repo.query(
      """
      INSERT INTO ingestion_runs (
        source_id, integration_surface_id, status, started_at, finished_at,
        inserted_at, updated_at
      )
      VALUES ($1, 1, $2, now(), $3, now(), now())
      """,
      [insert_source!(), status, finished_at]
    )
  end

  defp insert_source! do
    {:ok, %{rows: [[source_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO sources (source_kind_id, name, inserted_at, updated_at)
        VALUES (1, $1, now(), now())
        RETURNING id
        """,
        ["Terminal timestamp #{System.unique_integer([:positive])}"]
      )

    source_id
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end
