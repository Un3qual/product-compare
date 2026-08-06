defmodule ProductCompare.Repo.IngestionRunRequestBoundsTest do
  use ProductCompare.DataCase, async: true

  test "ingestion runs accept nullable and positive page sizes and reject zero or negative page sizes" do
    source_id = insert_source!()

    assert {:ok, _result} = insert_ingestion_run(source_id, "NULL", "NULL")
    assert {:ok, _result} = insert_ingestion_run(source_id, "1", "NULL")

    for page_size <- ["0", "-1"] do
      assert_check_violation(
        insert_ingestion_run(source_id, page_size, "NULL"),
        "ingestion_runs_page_size_positive"
      )
    end
  end

  test "ingestion runs accept nullable and positive requested-page counts and reject zero or negative requested-page counts" do
    source_id = insert_source!()

    assert {:ok, _result} = insert_ingestion_run(source_id, "NULL", "NULL")
    assert {:ok, _result} = insert_ingestion_run(source_id, "NULL", "1")

    for pages_requested <- ["0", "-1"] do
      assert_check_violation(
        insert_ingestion_run(source_id, "NULL", pages_requested),
        "ingestion_runs_pages_requested_positive"
      )
    end
  end

  defp insert_source! do
    {:ok, %{rows: [[source_id]]}} =
      ProductCompare.Repo.query(
        """
        INSERT INTO sources (source_kind_id, name, inserted_at, updated_at)
        VALUES (1, $1, now(), now())
        RETURNING id
        """,
        ["Ingestion run request bounds #{System.unique_integer([:positive])}"]
      )

    source_id
  end

  defp insert_ingestion_run(source_id, page_size, pages_requested) do
    ProductCompare.Repo.query(
      """
      INSERT INTO ingestion_runs (
        source_id, integration_surface_id, status, started_at, page_size, pages_requested,
        inserted_at, updated_at
      )
      VALUES ($1, 1, 'running', now(), #{page_size}, #{pages_requested}, now(), now())
      """,
      [source_id]
    )
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end
