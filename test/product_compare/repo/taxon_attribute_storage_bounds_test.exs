defmodule ProductCompare.Repo.TaxonAttributeStorageBoundsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures

  test "taxon attributes reject a negative sort order with the named storage constraint" do
    taxon_attribute = valid_taxon_attribute!()

    assert_check_violation(
      ProductCompare.Repo.query(
        "UPDATE taxon_attributes SET sort_order = $1 WHERE id = $2",
        [-1, taxon_attribute.id]
      ),
      "taxon_attributes_sort_order_non_negative"
    )
  end

  test "taxon attributes reject a negative minimum reputation with the named storage constraint" do
    taxon_attribute = valid_taxon_attribute!()

    assert_check_violation(
      ProductCompare.Repo.query(
        "UPDATE taxon_attributes SET min_rep_to_edit = $1 WHERE id = $2",
        [-1, taxon_attribute.id]
      ),
      "taxon_attributes_min_rep_to_edit_non_negative"
    )
  end

  test "taxon attributes accept zero and positive storage boundaries" do
    taxon = TaxonomyFixtures.taxon_fixture(%{})
    zero_attribute = SpecsFixtures.attribute_fixture()
    positive_attribute = SpecsFixtures.attribute_fixture()

    assert {:ok, _result} = insert_taxon_attribute(taxon.id, zero_attribute.id, 0, 0)

    assert {:ok, _result} =
             insert_taxon_attribute(taxon.id, positive_attribute.id, 17, 250)
  end

  defp valid_taxon_attribute! do
    taxon = TaxonomyFixtures.taxon_fixture(%{})
    attribute = SpecsFixtures.attribute_fixture()

    {:ok, %{rows: [[id]]}} = insert_taxon_attribute(taxon.id, attribute.id, 0, 0)

    %{id: id}
  end

  defp insert_taxon_attribute(taxon_id, attribute_id, sort_order, min_rep_to_edit) do
    ProductCompare.Repo.query(
      """
      INSERT INTO taxon_attributes (
        taxon_id, attribute_id, sort_order, min_rep_to_edit, inserted_at
      )
      VALUES ($1, $2, $3, $4, now())
      RETURNING id
      """,
      [taxon_id, attribute_id, sort_order, min_rep_to_edit]
    )
  end

  defp assert_check_violation(result, constraint) do
    assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: ^constraint}}} =
             result
  end
end
