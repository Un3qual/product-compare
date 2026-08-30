defmodule ProductCompare.Repo.ForeignKeyConstraintMappingTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Discussions
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Taxonomy.ProductTaxon

  @missing_id 9_223_372_036_854_775_807

  test "products map every cast foreign key" do
    for field <- [:brand_id, :primary_type_taxon_id] do
      attrs =
        %{
          name: "Missing relationship",
          slug: "missing-#{field |> Atom.to_string() |> String.replace("_", "-")}"
        }
        |> Map.put(field, @missing_id)

      %Product{}
      |> Product.changeset(attrs)
      |> assert_foreign_key_error(field)
    end
  end

  test "product taxons map every cast foreign key" do
    product = SpecsFixtures.product_fixture()
    taxon = TaxonomyFixtures.taxon_fixture(%{})
    creator = AccountsFixtures.user_fixture()

    base_attrs = %{
      product_id: product.id,
      taxon_id: taxon.id,
      source_type: :editorial,
      created_by: creator.id
    }

    for field <- [:product_id, :taxon_id, :created_by] do
      %ProductTaxon{}
      |> ProductTaxon.changeset(Map.put(base_attrs, field, @missing_id))
      |> assert_foreign_key_error(field)
    end
  end

  test "community reports map reporter and target foreign keys" do
    author = AccountsFixtures.user_fixture()
    reporter = AccountsFixtures.user_fixture()
    product = SpecsFixtures.product_fixture()

    {:ok, review} =
      Discussions.create_review(%{product_id: product.id, user_id: author.id, rating: 5})

    cases = [
      {:reporter_id, %{reporter_id: @missing_id, review_id: review.id}},
      {:review_id, %{reporter_id: reporter.id, review_id: @missing_id}},
      {:thread_id, %{reporter_id: reporter.id, thread_id: @missing_id}},
      {:post_id, %{reporter_id: reporter.id, post_id: @missing_id}}
    ]

    for {field, target_attrs} <- cases do
      %CommunityReport{}
      |> CommunityReport.changeset(Map.put(target_attrs, :reason, "Missing relationship"))
      |> assert_foreign_key_error(field)
    end
  end

  defp assert_foreign_key_error(changeset, field) do
    assert {:error, invalid_changeset} = Repo.insert(changeset)
    assert "does not exist" in Map.fetch!(errors_on(invalid_changeset), field)
  end
end
