defmodule ProductCompare.ComparisonSnapshotConsistencyTest do
  use ProductCompare.DataCase, async: false

  @moduletag sandbox_isolation: "REPEATABLE READ"

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Catalog
  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Catalog.{Brand, Product}
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Taxonomy.Taxon

  @captured_at ~U[2026-07-30 20:00:00.000000Z]
  @initial_observed_at ~U[2026-07-30 19:00:00.000000Z]
  @replacement_observed_at ~U[2026-07-30 19:30:00.000000Z]

  test "publish captures all facts from one database snapshot" do
    fixture = committed_snapshot_fixture()
    on_exit(fn -> delete_committed_snapshot_fixture(fixture) end)
    parent = self()

    publisher =
      Task.async(fn ->
        Sandbox.unboxed_run(Repo, fn ->
          send(parent, {:publisher_ready, self()})

          receive do
            :publish -> :ok
          after
            5_000 -> flunk("timed out waiting to publish the comparison snapshot")
          end

          ComparisonSnapshots.publish(
            fixture.user.id,
            %{product_ids: [fixture.first.id, fixture.second.id]},
            now: @captured_at
          )
        end)
      end)

    assert_receive {:publisher_ready, publisher_pid}
    handler_id = {__MODULE__, make_ref()}

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        &pause_after_product_load/4,
        {handler_id, publisher_pid, parent}
      )

    on_exit(fn -> :telemetry.detach(handler_id) end)
    send(publisher_pid, :publish)

    assert_receive {:snapshot_products_loaded, ^publisher_pid}

    replacement_point =
      Sandbox.unboxed_run(Repo, fn ->
        Repo.transaction(fn ->
          fixture.first
          |> Product.changeset(%{name: "Renamed in replacement transaction"})
          |> Repo.update!()

          {:ok, point} =
            Pricing.add_price_point(%{
              merchant_product_id: fixture.first_offer.id,
              observed_at: @replacement_observed_at,
              price: "40",
              shipping: "0",
              in_stock: true
            })

          point
        end)
        |> then(fn {:ok, point} -> point end)
      end)

    send(publisher_pid, :continue_snapshot_capture)
    assert {:ok, snapshot} = Task.await(publisher)

    first_product = Enum.find(snapshot.payload.products, &(&1.id == fixture.first.id))
    assert first_product.name == fixture.first.name

    assert first_product.offers
           |> hd()
           |> Map.fetch!(:price_point_id) == fixture.first_point.id

    refute hd(first_product.offers).price_point_id == replacement_point.id
  end

  defp pause_after_product_load(
         _event,
         _measurements,
         metadata,
         {handler_id, publisher_pid, test_pid}
       ) do
    if self() == publisher_pid and product_load_query?(metadata.query) do
      :telemetry.detach(handler_id)
      send(test_pid, {:snapshot_products_loaded, self()})

      receive do
        :continue_snapshot_capture -> :ok
      after
        5_000 -> flunk("timed out waiting to continue snapshot capture")
      end
    end
  end

  defp product_load_query?(query) do
    String.contains?(query, ~s(FROM "products"))
  end

  defp committed_snapshot_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()

      first =
        committed_product(%{
          name: "Initial snapshot name",
          slug: "snapshot-consistency-first-#{Ecto.UUID.generate()}"
        })

      second =
        committed_product(%{
          name: "Second snapshot product",
          slug: "snapshot-consistency-second-#{Ecto.UUID.generate()}"
        })

      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "Snapshot merchant #{Ecto.UUID.generate()}",
          domain: "snapshot-#{Ecto.UUID.generate()}.example"
        })

      {:ok, first_offer} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: first.id,
          url: "https://snapshot.example/#{Ecto.UUID.generate()}",
          currency: "USD",
          is_active: true
        })

      {:ok, second_offer} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: second.id,
          url: "https://snapshot.example/#{Ecto.UUID.generate()}",
          currency: "USD",
          is_active: true
        })

      {:ok, first_point} =
        Pricing.add_price_point(%{
          merchant_product_id: first_offer.id,
          observed_at: @initial_observed_at,
          price: "100",
          shipping: "0",
          in_stock: true
        })

      {:ok, _second_point} =
        Pricing.add_price_point(%{
          merchant_product_id: second_offer.id,
          observed_at: @initial_observed_at,
          price: "120",
          shipping: "0",
          in_stock: true
        })

      %{
        first: first,
        first_offer: first_offer,
        first_point: first_point,
        merchant: merchant,
        second: second,
        user: user
      }
    end)
  end

  defp committed_product(attrs) do
    taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: taxonomy.id,
        code: "snapshot-consistency-#{Ecto.UUID.generate()}",
        name: "Snapshot Consistency"
      })

    {:ok, brand} =
      Catalog.upsert_brand(%{name: "Snapshot Consistency #{Ecto.UUID.generate()}"})

    attrs
    |> Map.put(:primary_type_taxon, taxon)
    |> Map.put(:brand_id, brand.id)
    |> SpecsFixtures.product_fixture()
  end

  defp delete_committed_snapshot_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from user in User, where: user.id == ^fixture.user.id)
      Repo.delete_all(from merchant in Merchant, where: merchant.id == ^fixture.merchant.id)

      product_ids = [fixture.first.id, fixture.second.id]
      brand_ids = [fixture.first.brand_id, fixture.second.brand_id]
      taxon_ids = [fixture.first.primary_type_taxon_id, fixture.second.primary_type_taxon_id]

      Repo.delete_all(from product in Product, where: product.id in ^product_ids)
      Repo.delete_all(from brand in Brand, where: brand.id in ^brand_ids)
      Repo.delete_all(from taxon in Taxon, where: taxon.id in ^taxon_ids)
    end)
  end
end
