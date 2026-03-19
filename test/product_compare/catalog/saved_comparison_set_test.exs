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

    test "rejects malformed product ids before querying" do
      user = AccountsFixtures.user_fixture()

      assert {:error, :invalid_product_id} =
               Catalog.create_saved_comparison_set(user.id, %{
                 name: "Malformed set",
                 product_ids: [1, "2", -3]
               })
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
