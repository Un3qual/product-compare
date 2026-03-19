defmodule ProductCompare.Catalog.SavedComparisonSetTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Catalog
  alias ProductCompare.Repo
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures

  describe "create_saved_comparison_set/2" do
    test "persists an owner-scoped saved set with ordered items" do
      user = AccountsFixtures.user_fixture()
      first_product = SpecsFixtures.product_fixture(%{slug: "saved-set-first"})
      second_product = SpecsFixtures.product_fixture(%{slug: "saved-set-second"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Desk setup",
                 product_ids: [second_product.id, first_product.id]
               })

      persisted =
        saved_set
        |> Repo.preload(items: [:product])

      assert persisted.user_id == user.id
      assert persisted.name == "Desk setup"

      assert Enum.map(persisted.items, &{&1.position, &1.product_id}) == [
               {1, second_product.id},
               {2, first_product.id}
             ]
    end

    test "rejects empty selections, duplicate products, missing products, and over-limit sets" do
      user = AccountsFixtures.user_fixture()
      first_product = SpecsFixtures.product_fixture(%{slug: "saved-set-validation-first"})
      second_product = SpecsFixtures.product_fixture(%{slug: "saved-set-validation-second"})
      third_product = SpecsFixtures.product_fixture(%{slug: "saved-set-validation-third"})
      fourth_product = SpecsFixtures.product_fixture(%{slug: "saved-set-validation-fourth"})

      assert {:error, :empty_products} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Empty set",
                 product_ids: []
               })

      assert {:error, :duplicate_products} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Duplicate set",
                 product_ids: [first_product.id, first_product.id]
               })

      assert {:error, :product_not_found} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Missing product set",
                 product_ids: [first_product.id, second_product.id, 999_999]
               })

      assert {:error, :too_many_products} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Too many products set",
                 product_ids: [
                   first_product.id,
                   second_product.id,
                   third_product.id,
                   fourth_product.id
                 ]
               })
    end
  end
end
