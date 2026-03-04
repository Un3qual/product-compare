defmodule ProductCompare.Taxonomy.UseCaseAndGuardrailTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Taxonomy.ProductTaxon

  describe "use-case tagging" do
    test "assign_use_case/5 upserts and unassign_use_case/2 removes tag" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "use-case-tag-product"})

      use_case_taxonomy = TaxonomyFixtures.taxonomy_fixture("use_case", "Use Case")

      use_case_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: "gaming-#{System.unique_integer([:positive])}",
          name: "Gaming"
        })

      assert {:ok, first_tag} =
               Taxonomy.assign_use_case(
                 product.id,
                 use_case_taxon.id,
                 user.id,
                 :editorial,
                 Decimal.new("0.8")
               )

      assert {:ok, second_tag} =
               Taxonomy.assign_use_case(
                 product.id,
                 use_case_taxon.id,
                 user.id,
                 :editorial,
                 Decimal.new("0.9")
               )

      assert first_tag.id == second_tag.id

      assert Repo.aggregate(
               from(pt in ProductTaxon,
                 where: pt.product_id == ^product.id and pt.taxon_id == ^use_case_taxon.id
               ),
               :count,
               :id
             ) == 1

      assert {:ok, 1} = Taxonomy.unassign_use_case(product.id, use_case_taxon.id)
      assert {:ok, 0} = Taxonomy.unassign_use_case(product.id, use_case_taxon.id)
    end

    test "assign_use_case/5 rejects non-use-case taxons" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "reject-non-use-case-product"})

      type_taxonomy =
        TaxonomyFixtures.taxonomy_fixture("type-#{System.unique_integer([:positive])}", "Type")

      type_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: "monitor-#{System.unique_integer([:positive])}",
          name: "Monitor"
        })

      assert {:error, :invalid_taxon} =
               Taxonomy.assign_use_case(product.id, type_taxon.id, user.id, :editorial)
    end
  end

  describe "primary type guardrail" do
    test "create_product/1 rejects non-type primary taxon" do
      use_case_taxonomy = TaxonomyFixtures.taxonomy_fixture("use_case", "Use Case")

      use_case_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: "office-#{System.unique_integer([:positive])}",
          name: "Office"
        })

      {:ok, brand} = Catalog.upsert_brand(%{name: "Guardrail Brand #{System.unique_integer()}"})

      assert {:error, :primary_type_taxon_must_be_type_taxon} =
               Catalog.create_product(%{
                 brand_id: brand.id,
                 primary_type_taxon_id: use_case_taxon.id,
                 name: "Invalid Product",
                 slug: "invalid-product-#{System.unique_integer([:positive])}"
               })
    end
  end
end
