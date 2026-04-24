defmodule ProductCompare.Catalog.SavedComparisonSetTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures

  describe "public read helpers" do
    test "get_product/1 and get_brand/1 return records for positive ids" do
      product = SpecsFixtures.product_fixture(%{slug: "catalog-read-contract-product"})

      assert Catalog.get_product(product.id).id == product.id
      assert Catalog.get_brand(product.brand_id).id == product.brand_id
    end

    test "get_product/1 and get_brand/1 only accept positive integer ids" do
      assert_raise FunctionClauseError, fn -> Catalog.get_product(0) end
      assert_raise FunctionClauseError, fn -> Catalog.get_product(-1) end
      assert_raise FunctionClauseError, fn -> Catalog.get_brand(0) end
      assert_raise FunctionClauseError, fn -> Catalog.get_brand(-1) end
    end
  end

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

      assert saved_set.user_id == user.id
      assert saved_set.name == "Desk setup"

      assert Enum.map(saved_set.items, &{&1.position, &1.product_id}) == [
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

    test "rejects malformed product ids before querying" do
      user = AccountsFixtures.user_fixture()

      assert {:error, :invalid_product_id} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Malformed set",
                 product_ids: [1, "2", -3]
               })
    end
  end

  describe "get_saved_comparison_set_for_user/2" do
    test "returns an owned set without eagerly preloading node associations" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "saved-node-lazy-product"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Lazy node set",
                 product_ids: [product.id]
               })

      loaded_saved_set = Catalog.get_saved_comparison_set_for_user(user, saved_set.entropy_id)

      assert loaded_saved_set.id == saved_set.id
      assert loaded_saved_set.user_id == user.id
      refute Ecto.assoc_loaded?(loaded_saved_set.items)
    end
  end

  describe "delete_saved_comparison_set/2" do
    test "returns not_found for invalid entropy ids" do
      user = AccountsFixtures.user_fixture()

      assert {:error, :not_found} =
               Catalog.delete_saved_comparison_set(user.id, "not-a-uuid")
    end

    test "deletes an owned set and becomes not_found on repeat delete" do
      user = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "saved-delete-repeat"})

      assert {:ok, saved_set} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Delete once",
                 product_ids: [product.id]
               })

      assert {:ok, deleted_saved_set} =
               Catalog.delete_saved_comparison_set(user.id, saved_set.entropy_id)

      assert deleted_saved_set.id == saved_set.id

      assert {:error, :not_found} =
               Catalog.delete_saved_comparison_set(user.id, saved_set.entropy_id)
    end
  end
end
