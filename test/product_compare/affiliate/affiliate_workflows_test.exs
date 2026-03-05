defmodule ProductCompare.AffiliateWorkflowsTest do
  use ProductCompare.DataCase, async: true

  import Ecto.Query

  alias ProductCompare.Affiliate
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.Coupon

  describe "upsert_network/1" do
    test "inserts then upserts existing network by name" do
      name = "Network-#{System.unique_integer([:positive])}"

      {:ok, inserted} = Affiliate.upsert_network(%{name: name})
      {:ok, updated} = Affiliate.upsert_network(%{name: name})

      assert updated.id == inserted.id
      assert updated.name == name
      assert Repo.aggregate(AffiliateNetwork, :count, :id) == 1
    end
  end

  describe "upsert_program/1" do
    test "inserts then updates existing program for the same network and merchant" do
      network = network_fixture()
      merchant = merchant_fixture()

      {:ok, inserted} =
        Affiliate.upsert_program(%{
          affiliate_network_id: network.id,
          merchant_id: merchant.id,
          program_code: "CJ-OLD",
          status: "active"
        })

      {:ok, updated} =
        Affiliate.upsert_program(%{
          affiliate_network_id: network.id,
          merchant_id: merchant.id,
          program_code: "CJ-NEW",
          status: "paused"
        })

      assert updated.id == inserted.id
      assert updated.affiliate_network_id == network.id
      assert updated.merchant_id == merchant.id
      assert updated.program_code == "CJ-NEW"
      assert updated.status == "paused"
      assert Repo.aggregate(AffiliateProgram, :count, :id) == 1
    end
  end

  describe "upsert_link/1" do
    test "inserts then updates existing link for the same merchant product" do
      merchant_product = merchant_product_fixture()
      first_network = network_fixture()
      second_network = network_fixture()

      first_verified_at = ~U[2026-01-15 12:00:00.000000Z]
      second_verified_at = DateTime.add(first_verified_at, 3600, :second)

      {:ok, inserted} =
        Affiliate.upsert_link(%{
          merchant_product_id: merchant_product.id,
          affiliate_network_id: first_network.id,
          original_url: "https://merchant.example.com/products/1",
          affiliate_url: "https://network.example.com/track/first",
          last_verified_at: first_verified_at
        })

      {:ok, updated} =
        Affiliate.upsert_link(%{
          merchant_product_id: merchant_product.id,
          affiliate_network_id: second_network.id,
          original_url: "https://merchant.example.com/products/1?ref=updated",
          affiliate_url: "https://network.example.com/track/second",
          last_verified_at: second_verified_at
        })

      assert updated.id == inserted.id
      assert updated.merchant_product_id == merchant_product.id
      assert updated.affiliate_network_id == second_network.id
      assert updated.original_url == "https://merchant.example.com/products/1?ref=updated"
      assert updated.affiliate_url == "https://network.example.com/track/second"
      assert updated.last_verified_at == second_verified_at
      assert Repo.aggregate(AffiliateLink, :count, :id) == 1
    end
  end

  describe "create_coupon/1 and list_active_coupons/2" do
    test "create_coupon/1 inserts a valid coupon" do
      merchant = merchant_fixture()
      suffix = System.unique_integer([:positive])

      {:ok, coupon} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "SAVE-#{suffix}",
          description: "Ten dollars off",
          discount_type: :amount,
          discount_value: Decimal.new("10.00"),
          currency: "USD",
          terms: "One use per customer"
        })

      assert coupon.merchant_id == merchant.id
      assert coupon.code == "SAVE-#{suffix}"
      assert coupon.description == "Ten dollars off"
      assert coupon.discount_type == :amount
      assert Decimal.equal?(coupon.discount_value, Decimal.new("10.00"))
      assert coupon.currency == "USD"
      assert coupon.terms == "One use per customer"
      assert Repo.aggregate(Coupon, :count, :id) == 1
    end

    test "list_active_coupons/2 applies validity window semantics and deterministic ordering" do
      merchant = merchant_fixture()
      other_merchant = merchant_fixture()

      now = ~U[2026-01-15 12:00:00.000000Z]

      create_coupon!(%{
        merchant_id: merchant.id,
        code: "EXPIRED",
        valid_from: DateTime.add(now, -7200, :second),
        valid_to: DateTime.add(now, -1, :second)
      })

      create_coupon!(%{
        merchant_id: merchant.id,
        code: "NOT-YET-VALID",
        valid_from: DateTime.add(now, 1, :second),
        valid_to: DateTime.add(now, 7200, :second)
      })

      ends_now =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "ENDS-NOW",
          valid_from: DateTime.add(now, -7200, :second),
          valid_to: now
        })

      tie_later_code =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "ZZZ-TIE",
          valid_from: now,
          valid_to: DateTime.add(now, 3600, :second)
        })

      tie_earlier_code =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "AAA-TIE",
          valid_from: DateTime.add(now, -60, :second),
          valid_to: DateTime.add(now, 3600, :second)
        })

      open_ended =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "OPEN-ENDED"
        })

      create_coupon!(%{
        merchant_id: other_merchant.id,
        code: "OTHER-MERCHANT",
        valid_from: DateTime.add(now, -3600, :second),
        valid_to: DateTime.add(now, 3600, :second)
      })

      coupons = Affiliate.list_active_coupons(merchant.id, now)

      assert Enum.map(coupons, & &1.code) == ["ENDS-NOW", "AAA-TIE", "ZZZ-TIE", "OPEN-ENDED"]

      assert Enum.map(coupons, & &1.id) == [
               ends_now.id,
               tie_earlier_code.id,
               tie_later_code.id,
               open_ended.id
             ]
    end

    test "list_active_coupons_query/2 supports db-level pagination with deterministic ordering" do
      merchant = merchant_fixture()
      now = ~U[2026-01-15 12:00:00.000000Z]

      first_coupon =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "FIRST",
          valid_from: DateTime.add(now, -3600, :second),
          valid_to: DateTime.add(now, 1800, :second)
        })

      second_coupon =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "SECOND-A",
          valid_from: DateTime.add(now, -3000, :second),
          valid_to: DateTime.add(now, 3600, :second)
        })

      third_coupon =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "SECOND-B",
          valid_from: DateTime.add(now, -2400, :second),
          valid_to: DateTime.add(now, 3600, :second)
        })

      fourth_coupon =
        create_coupon!(%{
          merchant_id: merchant.id,
          code: "OPEN"
        })

      query = Affiliate.list_active_coupons_query(merchant.id, now)

      first_page =
        query
        |> limit(2)
        |> Repo.all()

      second_page =
        query
        |> offset(2)
        |> limit(2)
        |> Repo.all()

      assert Enum.map(first_page, & &1.id) == [first_coupon.id, second_coupon.id]
      assert Enum.map(second_page, & &1.id) == [third_coupon.id, fourth_coupon.id]

      assert Enum.map(first_page ++ second_page, & &1.code) == [
               "FIRST",
               "SECOND-A",
               "SECOND-B",
               "OPEN"
             ]
    end
  end

  defp create_coupon!(attrs) do
    attrs =
      attrs
      |> Map.put_new(:code, "coupon-#{System.unique_integer([:positive])}")
      |> Map.put_new(:discount_type, :other)

    {:ok, coupon} = Affiliate.create_coupon(attrs)
    coupon
  end

  defp network_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    {:ok, network} =
      attrs
      |> Map.put_new(:name, "Network #{suffix}")
      |> Affiliate.upsert_network()

    network
  end

  defp merchant_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      attrs
      |> Map.put_new(:name, "Merchant #{suffix}")
      |> Map.put_new(:domain, "merchant-#{suffix}.example.com")
      |> Pricing.upsert_merchant()

    merchant
  end

  defp merchant_product_fixture(attrs \\ %{}) do
    merchant = Map.get(attrs, :merchant, merchant_fixture())
    product = Map.get(attrs, :product, SpecsFixtures.product_fixture())
    suffix = System.unique_integer([:positive])

    params =
      attrs
      |> Map.drop([:merchant, :product])
      |> Map.put_new(:merchant_id, merchant.id)
      |> Map.put_new(:product_id, product.id)
      |> Map.put_new(:url, "https://merchant.example.com/products/#{suffix}")
      |> Map.put_new(:currency, "usd")
      |> Map.put_new(:external_sku, "sku-#{suffix}")
      |> Map.put_new(:is_active, true)

    {:ok, merchant_product} = Pricing.upsert_merchant_product(params)
    merchant_product
  end
end
