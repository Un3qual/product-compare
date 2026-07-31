Code.require_file(Path.expand("../../../priv/repo/seeds/support.exs", __DIR__))
Code.require_file(Path.expand("../../../priv/repo/seeds/accounts.exs", __DIR__))

defmodule ProductCompare.Repo.SeedsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias ProductCompare.Accounts
  alias ProductCompare.Affiliate
  alias ProductCompare.DevSeeds.Accounts, as: DevSeedAccounts
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompareSchemas.Accounts.ApiToken
  alias ProductCompareSchemas.Accounts.User
  alias ProductCompareSchemas.Accounts.UserReputation
  alias ProductCompareSchemas.Accounts.UserSessionToken
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.Affiliate.AffiliateProgram
  alias ProductCompareSchemas.Affiliate.Coupon
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  @seed_password "supersecretpass123"

  test "seeds role accounts and local auth artifacts without delivery hooks" do
    original_config = Application.get_env(:product_compare, Accounts, [])

    Application.put_env(
      :product_compare,
      Accounts,
      deliver_user_confirmation_instructions: fn _user, _token ->
        raise "seed must not invoke the configured confirmation hook"
      end,
      deliver_user_reset_password_instructions: fn _user, _token ->
        raise "seed must not invoke the configured reset hook"
      end
    )

    on_exit(fn -> Application.put_env(:product_compare, Accounts, original_config) end)

    accounts =
      DevSeedAccounts.seed!(
        @seed_password,
        DateTime.utc_now() |> DateTime.truncate(:microsecond)
      )

    assert %User{is_operator: true} = accounts.admin
    assert %User{is_operator: true} = accounts.moderator
    assert %User{is_operator: false} = accounts.shopper
    assert %User{is_operator: false} = accounts.participant
    assert %User{confirmed_at: nil} = accounts.unverified

    assert %User{id: reset_user_id} =
             Accounts.get_user_by_reset_password_token(accounts.reset_token)

    assert reset_user_id == accounts.reset_user.id

    assert {:ok, %User{id: shopper_id}, %ApiToken{id: active_token_id}} =
             Accounts.authenticate_api_token(accounts.active_plain_text_token)

    assert shopper_id == accounts.shopper.id
    assert active_token_id == accounts.active_api_token.id
    assert %DateTime{} = accounts.revoked_api_token.revoked_at

    users_by_email =
      User
      |> where(
        [user],
        user.email in ^~w(
          admin@example.com
          moderator@example.com
          shopper@example.com
          participant@example.com
          unverified@example.com
          reset@example.com
        )
      )
      |> Repo.all()
      |> Map.new(&{&1.email, &1})

    assert map_size(users_by_email) == 6

    for email <- ~w(
          admin@example.com
          moderator@example.com
          shopper@example.com
          participant@example.com
          reset@example.com
        ) do
      assert %User{email: ^email, confirmed_at: %DateTime{}} =
               Accounts.authenticate_user_by_email_and_password(email, @seed_password)
    end

    assert %User{email: "unverified@example.com", confirmed_at: nil} =
             Accounts.authenticate_user_by_email_and_password(
               "unverified@example.com",
               @seed_password
             )

    assert users_by_email["admin@example.com"].is_operator
    assert users_by_email["moderator@example.com"].is_operator

    refute users_by_email["shopper@example.com"].is_operator
    refute users_by_email["participant@example.com"].is_operator
    refute users_by_email["unverified@example.com"].is_operator
    refute users_by_email["reset@example.com"].is_operator

    assert %UserReputation{points: 1_000} =
             Repo.get_by(UserReputation, user_id: users_by_email["admin@example.com"].id)

    assert %UserReputation{points: 500} =
             Repo.get_by(UserReputation, user_id: users_by_email["moderator@example.com"].id)

    assert %UserReputation{points: 100} =
             Repo.get_by(UserReputation, user_id: users_by_email["shopper@example.com"].id)

    assert %UserReputation{points: 25} =
             Repo.get_by(UserReputation, user_id: users_by_email["participant@example.com"].id)

    assert %UserSessionToken{context: :confirm, sent_to: "unverified@example.com"} =
             Repo.get_by(UserSessionToken,
               user_id: users_by_email["unverified@example.com"].id,
               context: :confirm
             )

    assert %UserSessionToken{context: :reset_password, sent_to: "reset@example.com"} =
             Repo.get_by(UserSessionToken,
               user_id: users_by_email["reset@example.com"].id,
               context: :reset_password
             )

    shopper_tokens =
      ApiToken
      |> where(
        [token],
        token.user_id == ^users_by_email["shopper@example.com"].id and
          token.label in ["Development active", "Development revoked"]
      )
      |> Repo.all()
      |> Map.new(&{&1.label, &1})

    assert %ApiToken{revoked_at: nil} = shopper_tokens["Development active"]
    assert %ApiToken{revoked_at: %DateTime{}} = shopper_tokens["Development revoked"]
  end

  test "seeds stop rather than promote a preclaimed operator email" do
    attacker_password = String.duplicate("a", 16)

    assert {:ok, preclaimed} =
             Accounts.register_user(%{
               email: "admin@example.com",
               password: attacker_password
             })

    assert_raise RuntimeError, ~r/Refusing to bootstrap admin@example.com/, fn ->
      Code.eval_file("priv/repo/seeds.exs")
    end

    persisted = Repo.get!(User, preclaimed.id)
    refute persisted.is_operator
    assert persisted.hashed_password == preclaimed.hashed_password
    assert Argon2.verify_pass(attacker_password, persisted.hashed_password)
    refute Repo.get_by(UserReputation, user_id: preclaimed.id)
  end

  test "seeds catalog, offer truth, affiliate, coupon, and source-backed claim scenarios" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    products =
      Product
      |> where(
        [product],
        product.slug in ^~w(
          acme-vision-27g
          acme-vision-27uw
          acme-vision-27i-import
          acme-cinema-55o
          acme-beam-4k
        )
      )
      |> Repo.all()
      |> Map.new(&{&1.slug, &1})

    assert map_size(products) == 5

    tv_attributes = current_attributes_by_code(products["acme-cinema-55o"])
    projector_attributes = current_attributes_by_code(products["acme-beam-4k"])

    assert Decimal.eq?(tv_attributes["refresh_rate"].value_num, Decimal.new("120"))
    assert tv_attributes["hdr_supported"].value_bool
    assert tv_attributes["panel_tech"].enum_option.code == "oled"

    assert Decimal.eq?(projector_attributes["refresh_rate"].value_num, Decimal.new("60"))
    refute projector_attributes["hdr_supported"].value_bool
    assert projector_attributes["panel_tech"].enum_option.code == "ips"

    merchants =
      Merchant
      |> where([merchant], merchant.domain in ["examplemart.test", "valuevision.test"])
      |> Repo.all()
      |> Map.new(&{&1.domain, &1})

    assert map_size(merchants) == 2

    offers_by_sku =
      MerchantProduct
      |> where(
        [offer],
        offer.external_sku in ^~w(
          EXM-AV27G
          VAL-AV27G
          EXM-AV27UW
          EXM-AC55O
          VAL-AC55O
          EXM-AB4K
        )
      )
      |> Repo.all()
      |> Map.new(&{&1.external_sku, &1})

    assert map_size(offers_by_sku) == 6
    assert offers_by_sku["EXM-AV27G"].is_active
    refute offers_by_sku["VAL-AC55O"].is_active
    refute Repo.get_by(PricePoint, merchant_product_id: offers_by_sku["EXM-AB4K"].id)

    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    assert %{freshness: :fresh, stock_status: :in_stock, eligible: true} =
             latest_offer_summary(offers_by_sku["EXM-AV27G"], now)

    assert %{freshness: :aging, stock_status: :in_stock, eligible: true} =
             latest_offer_summary(offers_by_sku["VAL-AV27G"], now)

    assert %{freshness: :stale, eligible: false} =
             latest_offer_summary(offers_by_sku["EXM-AV27UW"], now)

    assert %{freshness: :fresh, stock_status: :out_of_stock, eligible: false} =
             latest_offer_summary(offers_by_sku["EXM-AC55O"], now)

    assert %Source{id: source_id, kind: "manufacturer"} =
             Repo.get_by(Source, name: "Development Manufacturer Evidence")

    assert %SourceArtifact{id: artifact_id} =
             Repo.get_by(SourceArtifact,
               source_id: source_id,
               content_hash: "development-manufacturer-specs-v1"
             )

    imported_product = products["acme-vision-27i-import"]

    assert %ProductAttributeCurrent{claim_id: imported_claim_id} =
             imported_current_claim(imported_product.id, "refresh_rate")

    assert %ClaimEvidence{artifact_id: ^artifact_id} =
             Repo.get_by(ClaimEvidence, claim_id: imported_claim_id, artifact_id: artifact_id)

    assert %AffiliateNetwork{id: network_id} =
             Repo.get_by(AffiliateNetwork, name: "Development Affiliate Network")

    assert %AffiliateProgram{status: "active"} =
             Repo.get_by(AffiliateProgram,
               affiliate_network_id: network_id,
               merchant_id: merchants["examplemart.test"].id
             )

    assert %AffiliateProgram{status: "paused"} =
             Repo.get_by(AffiliateProgram,
               affiliate_network_id: network_id,
               merchant_id: merchants["valuevision.test"].id
             )

    assert Repo.aggregate(
             from(link in AffiliateLink,
               where: link.affiliate_network_id == ^network_id
             ),
             :count,
             :id
           ) >= 2

    coupons =
      Coupon
      |> where(
        [coupon],
        coupon.merchant_id == ^merchants["examplemart.test"].id and
          coupon.code in ^~w(DEV-ACTIVE-10 DEV-FUTURE-15 DEV-EXPIRED-5)
      )
      |> Repo.all()
      |> Map.new(&{&1.code, &1})

    assert Map.keys(coupons) |> Enum.sort() ==
             ~w(DEV-ACTIVE-10 DEV-EXPIRED-5 DEV-FUTURE-15) |> Enum.sort()

    assert DateTime.compare(coupons["DEV-ACTIVE-10"].valid_from, now) in [:lt, :eq]
    assert DateTime.compare(coupons["DEV-ACTIVE-10"].valid_to, now) in [:gt, :eq]
    assert DateTime.compare(coupons["DEV-FUTURE-15"].valid_from, now) == :gt
    assert DateTime.compare(coupons["DEV-EXPIRED-5"].valid_to, now) == :lt

    assert Enum.map(
             Affiliate.list_active_coupons(merchants["examplemart.test"].id, now),
             & &1.code
           ) ==
             ["DEV-ACTIVE-10"]
  end

  defp current_attributes_by_code(product) do
    product.id
    |> Specs.list_current_attributes_for_product()
    |> Map.new(&{&1.attribute.code, &1.claim})
  end

  defp latest_offer_summary(offer, now) do
    latest_price = Pricing.latest_price(offer.id)
    ProductCompare.Pricing.OfferTruth.summarize(offer, latest_price, now)
  end

  defp imported_current_claim(product_id, attribute_code) do
    ProductAttributeCurrent
    |> join(:inner, [current], attribute in assoc(current, :attribute))
    |> where(
      [current, attribute],
      current.product_id == ^product_id and attribute.code == ^attribute_code
    )
    |> Repo.one()
  end
end
