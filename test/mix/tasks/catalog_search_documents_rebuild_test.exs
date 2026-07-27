defmodule Mix.Tasks.Catalog.SearchDocuments.RebuildTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Repo

  test "rebuild task restores persisted catalog search documents" do
    product = SpecsFixtures.product_fixture(%{name: "Task Rebuild Keyboard"})

    Repo.query!("UPDATE products SET search_document = ''::tsvector WHERE id = $1", [product.id])
    refute document_matches?(product.id, product.name)

    output =
      capture_io(fn ->
        Mix.Task.reenable("catalog.search_documents.rebuild")
        Mix.Task.run("catalog.search_documents.rebuild")
      end)

    assert output =~ ~r/^Rebuilt \d+ catalog search documents?\.\n$/
    assert document_matches?(product.id, product.name)
  end

  defp document_matches?(product_id, query) do
    %Postgrex.Result{rows: [[matches?]]} =
      Repo.query!(
        """
        SELECT search_document @@ (
          websearch_to_tsquery('simple', $2) ||
          websearch_to_tsquery('english', $2)
        )
        FROM products
        WHERE id = $1
        """,
        [product_id, query]
      )

    matches?
  end
end
