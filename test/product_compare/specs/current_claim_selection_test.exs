defmodule ProductCompare.Specs.CurrentClaimSelectionTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [assert_blocked_by: 2, capture_select_queries: 1]

  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Specs.Attribute
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.Taxonomy

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

    test "returns claim_not_found for a missing selected claim" do
      product = SpecsFixtures.product_fixture(%{slug: "missing-current-claim-product"})

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "missing_current_claim_attribute",
          display_name: "Missing Current Claim",
          data_type: :bool
        })

      moderator = AccountsFixtures.user_fixture()
      missing_claim_id = System.unique_integer([:positive])

      assert {:error, :claim_not_found} =
               Specs.select_current_claim(
                 product.id,
                 attribute.id,
                 missing_claim_id,
                 moderator.id
               )
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

    test "locks the selected claim row before validating its status" do
      fixture = create_committed_proposed_claim_fixture()
      on_exit(fn -> cleanup_committed_claim_fixture(fixture) end)
      parent = self()

      lock_holder =
        Task.async(fn ->
          Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              backend_pid = Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()

              Repo.one!(
                from claim in ProductAttributeClaim,
                  where: claim.id == ^fixture.claim.id,
                  lock: "FOR UPDATE"
              )

              send(parent, {:claim_lock_held, backend_pid})

              receive do
                :release_claim_lock -> :ok
              after
                5_000 -> flunk("timed out waiting to release the held claim lock")
              end
            end)
          end)
        end)

      assert_receive {:claim_lock_held, lock_backend_pid}

      selection =
        Task.async(fn ->
          Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
            backend_pid = Repo.query!("SELECT pg_backend_pid()").rows |> hd() |> hd()
            send(parent, {:selection_started, backend_pid})

            Specs.select_current_claim(
              fixture.product.id,
              fixture.attribute.id,
              fixture.claim.id,
              fixture.moderator.id
            )
          end)
        end)

      assert_receive {:selection_started, selection_backend_pid}
      assert_blocked_by(selection_backend_pid, lock_backend_pid)

      send(lock_holder.pid, :release_claim_lock)
      assert {:ok, :ok} = Task.await(lock_holder)
      assert {:error, :claim_not_accepted} = Task.await(selection)
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

  defp create_committed_proposed_claim_fixture do
    Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
      moderator = AccountsFixtures.user_fixture()

      product =
        SpecsFixtures.product_fixture(%{
          slug: "locked-claim-#{System.unique_integer([:positive])}"
        })

      taxon = Repo.get!(Taxon, product.primary_type_taxon_id)

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "locked_claim_#{System.unique_integer([:positive])}",
          display_name: "Locked Claim",
          data_type: :bool
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_bool: true}, %{
          source_type: :user,
          created_by: moderator.id
        })

      %{
        attribute: attribute,
        brand_id: product.brand_id,
        claim: claim,
        moderator: moderator,
        product: product,
        taxon_id: taxon.id,
        taxonomy_id: taxon.taxonomy_id
      }
    end)
  end

  defp cleanup_committed_claim_fixture(fixture) do
    Ecto.Adapters.SQL.Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from product in Product, where: product.id == ^fixture.product.id)
      Repo.delete_all(from attribute in Attribute, where: attribute.id == ^fixture.attribute.id)
      Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.brand_id)
      Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.taxon_id)
      Repo.delete_all(from taxonomy in Taxonomy, where: taxonomy.id == ^fixture.taxonomy_id)
      Repo.delete_all(from user in User, where: user.id == ^fixture.moderator.id)
    end)
  end
end
