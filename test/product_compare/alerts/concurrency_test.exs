defmodule ProductCompare.Alerts.ConcurrencyTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [
      assert_blocked_by: 2,
      hold_row_lock: 3,
      release_row_lock: 1,
      start_unboxed_action: 1
    ]

  alias Ecto.Adapters.SQL.Sandbox
  alias ProductCompare.Alerts
  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Catalog.Brand
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Taxonomy.Taxon

  @first_transition_at ~U[2026-07-30 12:00:00.000000Z]

  test "marking an alert read preserves the first committed read timestamp" do
    fixture = committed_alert_fixture()
    on_exit(fn -> delete_committed_alert_fixture(fixture) end)

    {lock_holder, lock_backend_pid} =
      hold_row_lock(AlertEvent, fixture.event.id, fn event ->
        event
        |> AlertEvent.read_changeset(@first_transition_at)
        |> Repo.update!()
      end)

    {mark_read, mark_read_backend_pid} =
      start_unboxed_action(fn ->
        Alerts.mark_alert_read(fixture.user.id, fixture.event.entropy_id)
      end)

    assert_blocked_by(mark_read_backend_pid, lock_backend_pid)
    release_row_lock(lock_holder)

    assert {:ok, read_event} = Task.await(mark_read)
    assert read_event.read_at == @first_transition_at
    assert Repo.get!(AlertEvent, fixture.event.id).read_at == @first_transition_at
  end

  defp committed_alert_fixture do
    Sandbox.unboxed_run(Repo, fn ->
      user = AccountsFixtures.user_fixture()
      product_fixture = committed_product_fixture()
      product = product_fixture.product

      {:ok, merchant} =
        Pricing.upsert_merchant(%{
          name: "Concurrency merchant #{System.unique_integer([:positive])}",
          domain: "concurrency-#{System.unique_integer([:positive])}.example"
        })

      {:ok, offer} =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          url: "https://concurrency.example/#{System.unique_integer([:positive])}",
          currency: "USD",
          is_active: true
        })

      {:ok, watch} =
        Alerts.create_watch(user.id, %{
          product_id: product.id,
          rule_type: :target_price,
          currency: "USD",
          target_amount: "50"
        })

      {:ok, point} =
        Pricing.add_price_point(%{
          merchant_product_id: offer.id,
          observed_at: @first_transition_at,
          price: "40",
          shipping: "0",
          in_stock: true
        })

      {:ok, %{events_created: 1}} =
        Alerts.evaluate_price_point(point.id, now: @first_transition_at)

      %{
        event: Repo.get_by!(AlertEvent, watch_rule_id: watch.id),
        merchant: merchant,
        product_fixture: product_fixture,
        user: user
      }
    end)
  end

  defp committed_product_fixture do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    taxon =
      TaxonomyFixtures.taxon_fixture(%{
        taxonomy_id: type_taxonomy.id,
        code: "alert-concurrency-#{Ecto.UUID.generate()}",
        name: "Alert Concurrency"
      })

    {:ok, brand} = Catalog.upsert_brand(%{name: "Alert Concurrency #{Ecto.UUID.generate()}"})

    product =
      SpecsFixtures.product_fixture(%{
        primary_type_taxon: taxon,
        brand_id: brand.id,
        slug: "alert-concurrency-#{Ecto.UUID.generate()}"
      })

    %{brand: brand, product: product, taxon: taxon}
  end

  defp delete_committed_alert_fixture(fixture) do
    Sandbox.unboxed_run(Repo, fn ->
      Repo.delete_all(from event in AlertEvent, where: event.id == ^fixture.event.id)
      Repo.delete_all(from user in User, where: user.id == ^fixture.user.id)
      Repo.delete_all(from merchant in Merchant, where: merchant.id == ^fixture.merchant.id)

      Repo.delete_all(
        from product in Product, where: product.id == ^fixture.product_fixture.product.id
      )

      Repo.delete_all(from brand in Brand, where: brand.id == ^fixture.product_fixture.brand.id)
      Repo.delete_all(from taxon in Taxon, where: taxon.id == ^fixture.product_fixture.taxon.id)
    end)
  end
end
