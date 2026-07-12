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

    test "the schema changeset performs no repository query for claim scope" do
      product = SpecsFixtures.product_fixture(%{slug: "pacur-scope-product-a"})
      other_product = SpecsFixtures.product_fixture(%{slug: "pacur-scope-product-b"})

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "pacur_scope_attribute",
          display_name: "PACUR Scope Attribute",
          data_type: :bool
        })

      moderator = AccountsFixtures.user_fixture()

      {:ok, claim} =
        Specs.propose_claim(other_product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      {:ok, _} = Specs.accept_claim(claim.id, moderator.id)

      {changeset, queries} =
        capture_select_queries(fn ->
          ProductAttributeCurrent.changeset(%ProductAttributeCurrent{}, %{
            product_id: product.id,
            attribute_id: attribute.id,
            claim_id: claim.id,
            selected_by: moderator.id
          })
        end)

      assert changeset.valid?
      assert queries == []

      assert {:error, :claim_product_attribute_mismatch} =
               Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)
    end

    test "selecting a current claim queries its scope only once" do
      product = SpecsFixtures.product_fixture(%{slug: "single-claim-query-product"})

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "single_claim_query_attribute",
          display_name: "Single Claim Query Attribute",
          data_type: :bool
        })

      moderator = AccountsFixtures.user_fixture()

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, moderator.id)

      {result, queries} =
        capture_select_queries(fn ->
          Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)
        end)

      assert {:ok, %ProductAttributeCurrent{claim_id: claim_id}} = result
      assert claim_id == claim.id

      assert Enum.count(queries, &String.contains?(&1, ~s(FROM "product_attribute_claims"))) == 1
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

      assert [row] = rows
      assert row.claim_id in [claim_a.id, claim_b.id]
    end
  end

  defp capture_select_queries(fun) do
    handler_id = {__MODULE__, System.unique_integer([:positive])}
    ref = make_ref()
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        fn _event, _measurements, metadata, {pid, message_ref} ->
          if select_query?(metadata.query) do
            send(pid, {message_ref, metadata.query})
          end
        end,
        {test_pid, ref}
      )

    try do
      result = fun.()
      {result, drain_queries(ref, [])}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp drain_queries(ref, acc) do
    receive do
      {^ref, query} -> drain_queries(ref, [query | acc])
    after
      0 -> Enum.reverse(acc)
    end
  end

  defp select_query?(query) when is_binary(query) do
    query
    |> String.trim_leading()
    |> String.upcase()
    |> String.starts_with?("SELECT")
  end
end
