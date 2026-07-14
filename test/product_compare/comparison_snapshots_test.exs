defmodule ProductCompare.ComparisonSnapshotsTest do
  use ProductCompare.DataCase, async: true

  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Catalog.Product

  @now ~U[2026-07-13 23:00:00Z]

  test "publishes ordered immutable facts behind a high-entropy public token" do
    owner = AccountsFixtures.user_fixture()
    {first, first_point} = product_with_price("First camera", "120")
    {second, second_point} = product_with_price("Second camera", "90")

    assert {:ok, snapshot} =
             ComparisonSnapshots.publish(
               owner.id,
               %{
                 title: "Camera shortlist",
                 product_ids: [second.id, first.id],
                 recommendation_profile: :lowest_current_cost
               },
               now: @now
             )

    assert snapshot.title == "Camera shortlist"
    assert snapshot.public_token =~ ~r/^[A-Za-z0-9_-]{43}$/
    assert Enum.map(snapshot.payload.products, & &1.name) == ["Second camera", "First camera"]
    assert snapshot.payload.recommendation.winner_product_id == second.id

    assert Enum.map(snapshot.payload.products, fn product ->
             product.offers |> hd() |> Map.fetch!(:price_point_id)
           end) == [second_point.id, first_point.id]

    Repo.update!(Product.changeset(second, %{name: "Renamed later"}))
    {_same_product, _new_point} = product_with_existing_price(second, "40")

    public_snapshot = ComparisonSnapshots.get_public(snapshot.public_token)
    assert public_snapshot.payload == snapshot.payload

    assert Enum.map(public_snapshot.payload.products, & &1.name) == [
             "Second camera",
             "First camera"
           ]
  end

  test "republishing creates a distinct immutable version and token" do
    owner = AccountsFixtures.user_fixture()
    first = SpecsFixtures.product_fixture(%{name: "First"})
    second = SpecsFixtures.product_fixture(%{name: "Second"})

    attrs = %{
      title: "Shortlist",
      product_ids: [first.id, second.id],
      recommendation_profile: :best_value
    }

    assert {:ok, first_snapshot} = ComparisonSnapshots.publish(owner.id, attrs, now: @now)
    assert {:ok, second_snapshot} = ComparisonSnapshots.publish(owner.id, attrs, now: @now)

    refute first_snapshot.id == second_snapshot.id
    refute first_snapshot.public_token == second_snapshot.public_token
    assert first_snapshot.payload == second_snapshot.payload
  end

  test "revocation is owner-scoped and hides the public token" do
    owner = AccountsFixtures.user_fixture()
    other_user = AccountsFixtures.user_fixture()
    first = SpecsFixtures.product_fixture(%{name: "First"})
    second = SpecsFixtures.product_fixture(%{name: "Second"})

    assert {:ok, snapshot} =
             ComparisonSnapshots.publish(owner.id, %{
               product_ids: [first.id, second.id],
               recommendation_profile: :lowest_current_cost
             })

    assert {:error, :not_found} = ComparisonSnapshots.revoke(other_user.id, snapshot.entropy_id)
    assert ComparisonSnapshots.get_public(snapshot.public_token)
    assert {:ok, revoked} = ComparisonSnapshots.revoke(owner.id, snapshot.entropy_id)
    assert revoked.revoked_at
    assert ComparisonSnapshots.get_public(snapshot.public_token) == nil
    assert {:error, :not_found} = ComparisonSnapshots.revoke(owner.id, snapshot.entropy_id)
  end

  test "refuses invalid product sets and keeps owner data out of the captured payload" do
    owner = AccountsFixtures.user_fixture()
    first = SpecsFixtures.product_fixture(%{name: "First"})

    assert {:error, :invalid_products} =
             ComparisonSnapshots.publish(owner.id, %{
               product_ids: [first.id],
               recommendation_profile: :lowest_current_cost
             })

    second = SpecsFixtures.product_fixture(%{name: "Second"})

    assert {:ok, snapshot} =
             ComparisonSnapshots.publish(owner.id, %{
               product_ids: [first.id, second.id],
               recommendation_profile: :lowest_current_cost
             })

    encoded = Jason.encode!(snapshot.payload)
    refute encoded =~ owner.email
    refute encoded =~ "user_id"
    refute encoded =~ "owner"
  end

  defp product_with_price(name, price) do
    product = SpecsFixtures.product_fixture(%{name: name})
    product_with_existing_price(product, price)
  end

  defp product_with_existing_price(product, price) do
    {:ok, merchant} =
      Pricing.upsert_merchant(%{
        name: "Merchant #{System.unique_integer([:positive])}",
        domain: "merchant-#{System.unique_integer([:positive])}.example"
      })

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://merchant.example/#{System.unique_integer([:positive])}",
        currency: "USD",
        is_active: true
      })

    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: @now,
        price: price,
        shipping: "0",
        in_stock: true
      })

    {product, point}
  end
end
