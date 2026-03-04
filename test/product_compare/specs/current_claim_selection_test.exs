defmodule ProductCompare.Specs.CurrentClaimSelectionTest do
  use ProductCompare.DataCase, async: false

  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent

  describe "select_current_claim/4" do
    test "keeps one current row per product+attribute and atomically replaces claim" do
      product = SpecsFixtures.product_fixture()

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "hdr_supported_atomic",
          display_name: "HDR Supported",
          data_type: :bool
        })

      moderator = AccountsFixtures.user_fixture()

      {:ok, claim_a} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      {:ok, claim_b} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: false}, %{
          source_type: :user,
          created_by: moderator.id
        })

      {:ok, claim_a} = Specs.accept_claim(claim_a.id, moderator.id)
      {:ok, claim_b} = Specs.accept_claim(claim_b.id, moderator.id)

      assert {:ok, _} =
               Specs.select_current_claim(product.id, attribute.id, claim_a.id, moderator.id)

      assert {:ok, current} =
               Specs.select_current_claim(product.id, attribute.id, claim_b.id, moderator.id)

      assert current.claim_id == claim_b.id

      assert Repo.aggregate(
               from(c in ProductAttributeCurrent,
                 where: c.product_id == ^product.id and c.attribute_id == ^attribute.id
               ),
               :count,
               :id
             ) == 1
    end

    test "rejects selecting a non-accepted claim" do
      product = SpecsFixtures.product_fixture(%{slug: "claim-not-accepted-product"})

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "hdr_supported_not_accepted",
          display_name: "HDR Supported",
          data_type: :bool
        })

      moderator = AccountsFixtures.user_fixture()

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      assert {:error, :claim_not_accepted} =
               Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)
    end

    test "rejects selecting claim for a different product/attribute" do
      product = SpecsFixtures.product_fixture(%{slug: "claim-mismatch-product-a"})
      other_product = SpecsFixtures.product_fixture(%{slug: "claim-mismatch-product-b"})

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "hdr_supported_mismatch",
          display_name: "HDR Supported",
          data_type: :bool
        })

      moderator = AccountsFixtures.user_fixture()

      {:ok, claim} =
        Specs.propose_claim(other_product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      {:ok, _claim} = Specs.accept_claim(claim.id, moderator.id)

      assert {:error, :claim_product_attribute_mismatch} =
               Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)
    end

    test "concurrent selection still leaves a single current row" do
      product = SpecsFixtures.product_fixture(%{slug: "concurrent-swap-product"})

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "hdr_supported_concurrent",
          display_name: "HDR Supported",
          data_type: :bool
        })

      moderator = AccountsFixtures.user_fixture()

      {:ok, claim_a} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      {:ok, claim_b} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: false}, %{
          source_type: :user,
          created_by: moderator.id
        })

      {:ok, _} = Specs.accept_claim(claim_a.id, moderator.id)
      {:ok, _} = Specs.accept_claim(claim_b.id, moderator.id)

      parent = self()

      task_a =
        Task.async(fn ->
          Ecto.Adapters.SQL.Sandbox.allow(Repo, parent, self())
          Specs.select_current_claim(product.id, attribute.id, claim_a.id, moderator.id)
        end)

      task_b =
        Task.async(fn ->
          Ecto.Adapters.SQL.Sandbox.allow(Repo, parent, self())
          Specs.select_current_claim(product.id, attribute.id, claim_b.id, moderator.id)
        end)

      assert {:ok, _} = Task.await(task_a)
      assert {:ok, _} = Task.await(task_b)

      rows =
        Repo.all(
          from c in ProductAttributeCurrent,
            where: c.product_id == ^product.id and c.attribute_id == ^attribute.id
        )

      assert length(rows) == 1
      assert hd(rows).claim_id in [claim_a.id, claim_b.id]
    end
  end
end
