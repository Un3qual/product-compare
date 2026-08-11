defmodule ProductCompare.Specs.HomeHighlightsTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}
  alias ProductCompare.Specs

  test "returns canonical display projections capped per product without dropping empty inputs" do
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "highlights-product"})
    empty = SpecsFixtures.product_fixture(%{slug: "highlights-empty"})

    Enum.each(["Zeta", "Alpha", "Beta", "Gamma"], fn display_name ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "highlights-#{String.downcase(display_name)}",
          display_name: display_name,
          data_type: :text
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: display_name}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)
      {:ok, _} = Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

    highlights = Specs.home_specification_highlights([product.id, empty.id, product.id], limit: 3)

    assert Enum.map(highlights[product.id], & &1.attribute.display_name) == [
             "Alpha",
             "Beta",
             "Gamma"
           ]

    assert highlights[empty.id] == []
  end

  test "uses the same select budget for one and six products" do
    operator = AccountsFixtures.operator_fixture()
    products = Enum.map(1..6, &SpecsFixtures.product_fixture(%{slug: "highlight-budget-#{&1}"}))

    Enum.each(products, fn product ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "highlight-budget-#{product.id}",
          data_type: :text
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: "Display"}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)
      {:ok, _} = Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

    {_one, one_queries} =
      capture_select_queries(fn -> Specs.home_specification_highlights([hd(products).id]) end)

    {_six, six_queries} =
      capture_select_queries(fn ->
        Specs.home_specification_highlights(Enum.map(products, & &1.id))
      end)

    Enum.each([:products, :product_attribute_current, :taxon_attributes], fn table ->
      assert count_select_queries_targeting_table(one_queries, table) ==
               count_select_queries_targeting_table(six_queries, table)
    end)
  end

  test "limits current attribute rows per product before loading nested metadata" do
    operator = AccountsFixtures.operator_fixture()
    product = SpecsFixtures.product_fixture(%{slug: "highlight-sql-bound"})

    Enum.each(1..8, fn index ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "highlight-sql-bound-#{index}",
          display_name: "Highlight #{index}",
          data_type: :text
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: "Value #{index}"}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)
      {:ok, _} = Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

    {highlights, queries} =
      capture_select_queries(fn ->
        Specs.home_specification_highlights([product.id], limit: 3)
      end)

    assert [_, _, _] = highlights[product.id]

    current_query =
      Enum.find(queries, &String.contains?(&1, ~s(FROM "product_attribute_current")))

    assert current_query =~ "row_number()"
    assert current_query =~ ~r/"rank" <= \$/
  end
end
