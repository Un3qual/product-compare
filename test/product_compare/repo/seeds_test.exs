Code.require_file(Path.join(File.cwd!(), "priv/repo/seeds/support.exs"))
Code.require_file(Path.join(File.cwd!(), "priv/repo/seeds/accounts.exs"))

defmodule ProductCompare.Repo.SeedsTest do
  use ProductCompare.DataCase, async: false

  @moduletag sandbox_isolation: "REPEATABLE READ"

  import ExUnit.CaptureIO

  alias ProductCompare.Accounts
  alias ProductCompare.Affiliate
  alias ProductCompare.Alerts
  alias ProductCompare.Catalog
  alias ProductCompare.ComparisonSnapshots
  alias ProductCompare.CommerceAttribution
  alias ProductCompare.DevSeeds.Accounts, as: DevSeedAccounts
  alias ProductCompare.Discussions
  alias ProductCompare.Ingestion
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
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.ComparisonSnapshot
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Catalog.SavedComparisonSet
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Discussions.CommunityReport
  alias ProductCompareSchemas.Discussions.CommunityWriteReceipt
  alias ProductCompareSchemas.Discussions.CommunityWriteWindow
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Discussions.ProductThread
  alias ProductCompareSchemas.Discussions.ThreadPost
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Specs.SpecificationCorrection

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

  test "account reruns preserve the original confirmation timestamp" do
    first_anchor = ~U[2026-07-31 12:00:00.000000Z]
    second_anchor = DateTime.add(first_anchor, 3_600, :second)

    first = DevSeedAccounts.seed!(@seed_password, first_anchor)
    second = DevSeedAccounts.seed!(@seed_password, second_anchor)

    assert second.shopper.confirmed_at == first.shopper.confirmed_at
  end

  test "account reruns restore changed and missing operator reputation baselines" do
    anchor = ~U[2026-07-31 12:00:00.000000Z]
    accounts = DevSeedAccounts.seed!(@seed_password, anchor)

    assert {:ok, %UserReputation{points: 17}} =
             Accounts.upsert_user_reputation(accounts.admin.id, 17)

    accounts.moderator.id
    |> then(&Repo.get_by!(UserReputation, user_id: &1))
    |> Repo.delete!()

    restored = DevSeedAccounts.seed!(@seed_password, DateTime.add(anchor, 3_600, :second))

    assert %UserReputation{points: 1_000} =
             Repo.get_by!(UserReputation, user_id: restored.admin.id)

    assert %UserReputation{points: 500} =
             Repo.get_by!(UserReputation, user_id: restored.moderator.id)
  end

  test "development seeds refuse to run outside development and test" do
    original_mix_env = Mix.env()
    original_seed_password = System.get_env("SEED_USER_PASSWORD")

    Mix.env(:prod)
    System.put_env("SEED_USER_PASSWORD", @seed_password)

    on_exit(fn ->
      Mix.env(original_mix_env)

      case original_seed_password do
        nil -> System.delete_env("SEED_USER_PASSWORD")
        password -> System.put_env("SEED_USER_PASSWORD", password)
      end
    end)

    assert_raise RuntimeError, ~r/development and test environments only/, fn ->
      capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)
    end
  end

  test "whitespace-only seed passwords use the development default" do
    original_seed_password = System.get_env("SEED_USER_PASSWORD")
    whitespace_password = String.duplicate(" ", 16)

    System.put_env("SEED_USER_PASSWORD", whitespace_password)

    on_exit(fn ->
      case original_seed_password do
        nil -> System.delete_env("SEED_USER_PASSWORD")
        password -> System.put_env("SEED_USER_PASSWORD", password)
      end
    end)

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert %User{email: "admin@example.com"} =
             Accounts.authenticate_user_by_email_and_password(
               "admin@example.com",
               @seed_password
             )

    refute Accounts.authenticate_user_by_email_and_password(
             "admin@example.com",
             whitespace_password
           )
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

    refute Repo.get_by(User, email: "shopper@example.com")

    assert Repo.aggregate(
             from(product in Product,
               where:
                 product.slug in [
                   "acme-vision-27g",
                   "acme-vision-27uw",
                   "acme-vision-27i-import",
                   "acme-cinema-55o",
                   "acme-beam-4k"
                 ]
             ),
             :count,
             :id
           ) == 0

    assert Repo.aggregate(
             from(merchant in Merchant,
               where: merchant.domain in ["examplemart.test", "valuevision.test"]
             ),
             :count,
             :id
           ) == 0

    assert Repo.aggregate(
             from(source in Source,
               where:
                 source.name in [
                   "Development Manufacturer Evidence",
                   "Development Marketplace Evidence",
                   "CJ"
                 ]
             ),
             :count,
             :id
           ) == 0
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

  test "seeds saved comparison, alert, community, and correction lifecycles" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Accounts.get_user_by_email("shopper@example.com")
    participant = Accounts.get_user_by_email("participant@example.com")

    saved_sets =
      SavedComparisonSet
      |> where(
        [saved_set],
        saved_set.user_id == ^shopper.id and
          saved_set.name in ["Gaming shortlist", "Home theater shortlist"]
      )
      |> preload(:items)
      |> Repo.all()
      |> Map.new(&{&1.name, &1})

    assert Map.keys(saved_sets) |> Enum.sort() ==
             ["Gaming shortlist", "Home theater shortlist"]

    assert [_, _, _] = saved_sets["Gaming shortlist"].items
    assert [_, _] = saved_sets["Home theater shortlist"].items

    assert %ComparisonSnapshot{public_token: public_token, revoked_at: nil} =
             Repo.get_by(ComparisonSnapshot,
               user_id: shopper.id,
               title: "Development comparison"
             )

    assert %ComparisonSnapshot{public_token: ^public_token} =
             ComparisonSnapshots.get_public(public_token)

    watches =
      shopper.id
      |> Alerts.list_watch_rules_query()
      |> Repo.all()

    assert Enum.map(watches, & &1.rule_type) |> Enum.sort() ==
             [:back_in_stock, :newly_available, :percentage_drop, :target_price]

    assert Enum.count(watches, & &1.enabled) == 3
    assert Enum.count(watches, &(not &1.enabled)) == 1

    events =
      shopper.id
      |> Alerts.list_alert_events_query()
      |> Repo.all()

    assert [_, _ | _] = events
    assert Enum.any?(events, &match?(%DateTime{}, &1.read_at))
    assert Enum.any?(events, &is_nil(&1.read_at))

    assert Enum.all?(events, fn event ->
             %PriceWatchRule{user_id: user_id} = Repo.get!(PriceWatchRule, event.watch_rule_id)
             user_id == shopper.id
           end)

    visible_reviews =
      ProductReview
      |> where(
        [review],
        review.user_id in ^[shopper.id, participant.id] and
          review.moderation_status == :published
      )
      |> Repo.all()

    assert Enum.map(visible_reviews, & &1.user_id) |> Enum.sort() ==
             Enum.sort([shopper.id, participant.id])

    question =
      Repo.get_by!(ProductThread,
        created_by: shopper.id,
        title: "Which display fits a mixed gaming and movie room?"
      )

    assert question.moderation_status == :published

    answers =
      ThreadPost
      |> where([post], post.thread_id == ^question.id)
      |> Repo.all()

    assert [_, _] = answers

    assert Enum.any?(
             answers,
             &(&1.user_id == participant.id and &1.moderation_status == :published)
           )

    assert Enum.any?(answers, &(&1.user_id == shopper.id and &1.moderation_status == :hidden))
    assert question.accepted_post_id in Enum.map(answers, & &1.id)

    assert %ProductThread{moderation_status: :pending} =
             Repo.get_by(ProductThread,
               created_by: participant.id,
               title: "Does the OLED model work well in a bright room?"
             )

    shopper_review = Enum.find(visible_reviews, &(&1.user_id == shopper.id))

    assert %CommunityReport{reporter_id: reporter_id, review_id: review_id} =
             Repo.get_by(CommunityReport,
               reporter_id: participant.id,
               review_id: shopper_review.id
             )

    assert reporter_id == participant.id
    assert review_id == shopper_review.id

    corrections =
      SpecificationCorrection
      |> where([correction], correction.submitted_by == ^shopper.id)
      |> where(
        [correction],
        correction.reason in [
          "Development pending correction example",
          "Development accepted correction example",
          "Development rejected correction example"
        ]
      )
      |> Repo.all()
      |> Map.new(&{&1.reason, &1})

    assert corrections["Development pending correction example"].status == :pending
    assert corrections["Development accepted correction example"].status == :accepted
    assert corrections["Development rejected correction example"].status == :rejected

    assert corrections["Development pending correction example"].attribute_id !=
             corrections["Development accepted correction example"].attribute_id

    assert corrections["Development accepted correction example"].attribute_id !=
             corrections["Development rejected correction example"].attribute_id

    assert Enum.all?(events, &match?(%AlertEvent{}, &1))
    assert [_ | _] = Discussions.list_public_reviews(shopper_review.product_id)
  end

  test "seeds synthetic CJ and attribution history and prints a complete local testing guide" do
    parent = self()
    original_accounts_config = Application.get_env(:product_compare, Accounts, [])
    original_product_runner = Application.get_env(:product_compare, :cj_product_import_job_runner)
    original_feed_runner = Application.get_env(:product_compare, :cj_feed_discovery_job_runner)
    original_discovery_runner = Application.get_env(:product_compare, :cj_feed_discovery_runner)

    external_call = fn _value ->
      send(parent, :external_seed_call)
      raise "development seeds must not invoke external integration hooks"
    end

    Application.put_env(
      :product_compare,
      Accounts,
      deliver_user_confirmation_instructions: external_call,
      deliver_user_reset_password_instructions: external_call
    )

    Application.put_env(:product_compare, :cj_product_import_job_runner, external_call)
    Application.put_env(:product_compare, :cj_feed_discovery_job_runner, external_call)
    Application.put_env(:product_compare, :cj_feed_discovery_runner, external_call)

    on_exit(fn ->
      Application.put_env(:product_compare, Accounts, original_accounts_config)
      restore_env(:cj_product_import_job_runner, original_product_runner)
      restore_env(:cj_feed_discovery_job_runner, original_feed_runner)
      restore_env(:cj_feed_discovery_runner, original_discovery_runner)
    end)

    cj_workers = [
      "ProductCompare.Ingestion.Jobs.CJProductImportWorker",
      "ProductCompare.Ingestion.Jobs.CJFeedDiscoveryWorker"
    ]

    cj_job_count_before =
      Repo.aggregate(from(job in Oban.Job, where: job.worker in ^cj_workers), :count, :id)

    output = capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    refute_receive :external_seed_call

    assert Repo.aggregate(from(job in Oban.Job, where: job.worker in ^cj_workers), :count, :id) ==
             cj_job_count_before

    cj_source = Repo.get_by!(Source, name: "CJ", provider: "cj")

    programs =
      CJProgram
      |> where([program], program.source_id == ^cj_source.id)
      |> where([program], like(program.advertiser_id, "DEV-CJ-ADV-%"))
      |> Repo.all()

    assert Enum.frequencies_by(programs, & &1.stage) == %{
             new: 1,
             considering: 1,
             selected: 1,
             applied: 1,
             accepted: 1,
             not_pursuing: 1,
             declined: 1
           }

    feeds =
      MerchantFeedCandidate
      |> where([feed], feed.source_id == ^cj_source.id)
      |> where([feed], like(feed.provider_feed_id, "DEV-CJ-FEED-%"))
      |> Repo.all()

    assert Enum.count(feeds, &is_integer(&1.cj_program_id)) == 7
    assert Enum.count(feeds, &is_nil(&1.cj_program_id)) == 1

    runs =
      ImportRun
      |> where([run], run.source_id == ^cj_source.id)
      |> Repo.all()
      |> Enum.filter(&String.starts_with?(&1.query["seedScenario"] || "", "development-"))

    assert Enum.frequencies_by(runs, &{&1.surface, &1.status}) == %{
             {"shoppingProducts", :succeeded} => 1,
             {"shoppingProducts", :failed} => 1,
             {"shoppingProductFeeds", :succeeded} => 1,
             {"shoppingProductFeeds", :failed} => 1
           }

    failed_runs = Enum.filter(runs, &(&1.status == :failed))
    assert Enum.all?(failed_runs, &String.contains?(&1.error_summary, "Synthetic development"))
    refute Enum.any?(failed_runs, &String.contains?(&1.error_summary, "token"))

    conversions =
      CommerceConversion
      |> where([conversion], like(conversion.network_conversion_ref, "DEV-CONV-%"))
      |> Repo.all()

    assert Enum.frequencies_by(conversions, & &1.status) == %{
             approved: 1,
             pending: 1,
             reversed: 1,
             paid: 1
           }

    assert Repo.aggregate(
             from(fact in PurchasePriceFact,
               where: fact.conversion_id in ^Enum.map(conversions, & &1.id)
             ),
             :count,
             :id
           ) == 4

    assert Repo.aggregate(
             from(click in CommerceClickSession,
               where: like(click.anonymous_id, "development-shopper-%")
             ),
             :count,
             :id
           ) == 4

    assert %{
             "metrics" => %{
               "clicks" => 4,
               "commission_revenue" => "145.00",
               "conversions" => 2,
               "currency" => "USD"
             }
           } = CommerceAttribution.dashboard_revenue_summary(currency: "USD")

    for email <- ~w(
          admin@example.com
          moderator@example.com
          shopper@example.com
          participant@example.com
          unverified@example.com
          reset@example.com
        ) do
      assert output =~ email
    end

    for route <- [
          "/auth/login",
          "/auth/verify-email?token=",
          "/auth/reset-password?token=",
          "/products/acme-vision-27g",
          "/categories/monitors",
          "/offers",
          "/merchants/",
          "/compare/saved",
          "/compare/shared/",
          "/account/alerts",
          "/account/api-tokens",
          "/affiliate/setup",
          "/ingestion/cj-programs",
          "/commerce/revenue"
        ] do
      assert output =~ route
    end

    assert output =~ "Synthetic"
    assert output =~ "Development API token"
  end

  test "reruns restore seed-owned state without duplicating it or changing unrelated data" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    first_counts = seed_scope_counts()
    shopper = Repo.get_by!(User, email: "shopper@example.com")

    snapshot =
      Repo.one!(
        from(snapshot in ComparisonSnapshot,
          where:
            snapshot.user_id == ^shopper.id and snapshot.title == "Development comparison" and
              is_nil(snapshot.revoked_at)
        )
      )

    seeded_product = Repo.get_by!(Product, slug: "acme-vision-27g")
    seeded_merchant = Repo.get_by!(Merchant, domain: "examplemart.test")
    seeded_network = Repo.get_by!(AffiliateNetwork, name: "Development Affiliate Network")

    assert {:ok, _renamed_product} =
             Catalog.update_product(seeded_product, %{name: "Corrupted development product"})

    assert {:ok, _paused_program} =
             Affiliate.upsert_program(%{
               affiliate_network_id: seeded_network.id,
               merchant_id: seeded_merchant.id,
               program_code: "DEV-EXAMPLEMART",
               status: "paused"
             })

    assert {:ok, unrelated_user} =
             Accounts.register_user(%{
               email: "unrelated@example.com",
               password: @seed_password
             })

    assert {:ok, %{api_token: unrelated_token}} =
             Accounts.create_api_token(unrelated_user.id, %{label: "Unrelated token"})

    assert {:ok, unrelated_product} =
             Catalog.create_product(%{
               name: "Unrelated local product",
               slug: "unrelated-local-product",
               primary_type_taxon_id: seeded_product.primary_type_taxon_id
             })

    assert {:ok, unrelated_merchant} =
             Pricing.upsert_merchant(%{
               name: "Unrelated local merchant",
               domain: "unrelated-local.test"
             })

    assert {:ok, unrelated_review} =
             Discussions.submit_review(
               unrelated_user.id,
               unrelated_product.id,
               %{rating: 3, title: "Unrelated local review"},
               "unrelated-review-v1"
             )

    unrelated_records = %{
      user: Repo.get!(User, unrelated_user.id),
      api_token: Repo.get!(ApiToken, unrelated_token.id),
      product: Repo.get!(Product, unrelated_product.id),
      merchant: Repo.get!(Merchant, unrelated_merchant.id),
      review: Repo.get!(ProductReview, unrelated_review.id)
    }

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert seed_scope_counts() == first_counts
    assert Repo.get_by!(Product, slug: "acme-vision-27g").name == "Acme Vision 27G"

    assert %AffiliateProgram{status: "active"} =
             Repo.get_by!(AffiliateProgram,
               affiliate_network_id: seeded_network.id,
               merchant_id: seeded_merchant.id
             )

    assert Repo.get!(ComparisonSnapshot, snapshot.id).public_token == snapshot.public_token
    assert Repo.get!(User, unrelated_user.id) == unrelated_records.user
    assert Repo.get!(ApiToken, unrelated_token.id) == unrelated_records.api_token
    assert Repo.get!(Product, unrelated_product.id) == unrelated_records.product
    assert Repo.get!(Merchant, unrelated_merchant.id) == unrelated_records.merchant
    assert Repo.get!(ProductReview, unrelated_review.id) == unrelated_records.review
  end

  test "reruns preserve user-created saved sets that reuse a development name" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    product = Repo.get_by!(Product, slug: "acme-beam-4k")

    assert {:ok, unrelated_set} =
             Catalog.create_saved_comparison_set(shopper.id, %{
               name: "Gaming shortlist",
               product_ids: [product.id]
             })

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert %SavedComparisonSet{name: "Gaming shortlist"} =
             Repo.get(SavedComparisonSet, unrelated_set.id)

    assert Repo.aggregate(
             from(saved_set in SavedComparisonSet,
               where: saved_set.user_id == ^shopper.id and saved_set.name == "Gaming shortlist"
             ),
             :count,
             :id
           ) == 2
  end

  test "reruns restore seed-owned records after normal feature lifecycle actions" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    participant = Repo.get_by!(User, email: "participant@example.com")
    moderator = Repo.get_by!(User, email: "moderator@example.com")

    snapshot =
      Repo.get_by!(ComparisonSnapshot,
        user_id: shopper.id,
        title: "Development comparison"
      )

    review =
      Repo.get_by!(ProductReview,
        user_id: shopper.id,
        title: "Excellent for fast games"
      )

    question =
      Repo.get_by!(ProductThread,
        created_by: shopper.id,
        title: "Which display fits a mixed gaming and movie room?"
      )

    answer = Repo.get_by!(ThreadPost, thread_id: question.id, user_id: participant.id)

    pending_correction =
      Repo.get_by!(SpecificationCorrection,
        submitted_by: shopper.id,
        reason: "Development pending correction example"
      )

    correction_claim_count =
      Repo.aggregate(
        from(claim in ProductAttributeClaim,
          where:
            claim.product_id == ^pending_correction.product_id and
              claim.attribute_id == ^pending_correction.attribute_id
        ),
        :count,
        :id
      )

    cj_source = Repo.get_by!(Source, name: "CJ", provider: "cj")
    accepted_program = Repo.get_by!(CJProgram, source_id: cj_source.id, stage: :accepted)

    unmatched_feed =
      Repo.get_by!(MerchantFeedCandidate,
        source_id: cj_source.id,
        provider_feed_id: "DEV-CJ-FEED-UNMATCHED"
      )

    assert {:ok, _revoked_snapshot} =
             ComparisonSnapshots.revoke(shopper.id, snapshot.entropy_id)

    assert {:ok, _removed_review} =
             Discussions.remove_owned(shopper.id, :review, review.entropy_id)

    assert {:ok, _removed_answer} =
             Discussions.remove_owned(participant.id, :answer, answer.entropy_id)

    assert {:ok, accepted_correction} =
             Specs.moderate_correction(
               pending_correction.id,
               moderator.id,
               :accepted,
               %{moderation_note: "Developer exercised the pending correction"}
             )

    assert accepted_correction.status == :accepted

    assert {:ok, linked_feed} =
             Ingestion.upsert_merchant_feed_candidate(cj_source, %{
               provider: "cj",
               provider_feed_id: unmatched_feed.provider_feed_id,
               advertiser_id: accepted_program.advertiser_id,
               advertiser_name: "Developer linked unmatched feed",
               last_seen_at: DateTime.utc_now() |> DateTime.truncate(:microsecond)
             })

    assert linked_feed.cj_program_id == accepted_program.id

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    restored_snapshot = Repo.get!(ComparisonSnapshot, snapshot.id)
    assert restored_snapshot.public_token == snapshot.public_token
    assert is_nil(restored_snapshot.revoked_at)

    assert %ProductReview{moderation_status: :published} = Repo.get!(ProductReview, review.id)
    assert %ThreadPost{moderation_status: :published} = Repo.get!(ThreadPost, answer.id)
    assert Repo.get!(ProductThread, question.id).accepted_post_id == answer.id

    restored_correction = Repo.get!(SpecificationCorrection, pending_correction.id)
    assert restored_correction.status == :pending
    assert is_nil(restored_correction.reviewed_by)
    assert is_nil(restored_correction.reviewed_at)
    assert is_nil(restored_correction.moderation_note)

    restored_claim = Repo.get!(ProductAttributeClaim, restored_correction.claim_id)
    assert restored_claim.status == :proposed

    restored_current =
      Repo.get_by!(ProductAttributeCurrent,
        product_id: restored_correction.product_id,
        attribute_id: restored_correction.attribute_id
      )

    assert restored_current.claim_id == restored_claim.supersedes_claim_id

    assert Repo.aggregate(
             from(claim in ProductAttributeClaim,
               where:
                 claim.product_id == ^pending_correction.product_id and
                   claim.attribute_id == ^pending_correction.attribute_id
             ),
             :count,
             :id
           ) == correction_claim_count

    assert %MerchantFeedCandidate{advertiser_id: nil, cj_program_id: nil} =
             Repo.get!(MerchantFeedCandidate, unmatched_feed.id)
  end

  test "reruns preserve unrelated watches that share a seeded scope" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    product = Repo.get_by!(Product, slug: "acme-vision-27g")

    assert {:ok, unrelated_watch} =
             Alerts.create_watch(shopper.id, %{
               product_id: product.id,
               rule_type: :target_price,
               currency: "USD",
               target_amount: "1000.00",
               cooldown_seconds: 604_800
             })

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert %PriceWatchRule{
             target_amount: target_amount,
             cooldown_seconds: 604_800,
             last_evaluated_at: nil,
             last_evaluated_price_point_id: nil,
             last_event_at: nil
           } = Repo.get(PriceWatchRule, unrelated_watch.id)

    assert Decimal.equal?(target_amount, Decimal.new("1000.00"))
    refute Repo.get_by(AlertEvent, watch_rule_id: unrelated_watch.id)
  end

  test "reruns restore community content without consuming interactive write quota" do
    previous_config = Application.get_env(:product_compare, ProductCompare.Discussions)

    on_exit(fn ->
      restore_env(ProductCompare.Discussions, previous_config)
    end)

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")

    review =
      Repo.get_by!(ProductReview,
        user_id: shopper.id,
        title: "Excellent for fast games"
      )

    Application.put_env(:product_compare, ProductCompare.Discussions,
      community_write_limits: [review: 2, question: 10, answer: 30, report: 30]
    )

    assert {:ok, edited_review} =
             Discussions.update_owned(shopper.id, :review, review.entropy_id, %{
               title: "Developer-edited review"
             })

    assert edited_review.title == "Developer-edited review"

    assert Repo.get_by!(CommunityWriteWindow,
             user_id: shopper.id,
             action_kind: :review
           ).count == 2

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert %ProductReview{
             title: "Excellent for fast games",
             moderation_status: :published
           } = Repo.get!(ProductReview, review.id)

    assert Repo.get_by!(CommunityWriteWindow,
             user_id: shopper.id,
             action_kind: :review
           ).count == 2
  end

  test "reruns restore a superseded imported claim as current" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    moderator = Repo.get_by!(User, email: "moderator@example.com")
    product = Repo.get_by!(Product, slug: "acme-vision-27i-import")
    imported_current = imported_current_claim(product.id, "refresh_rate")
    imported_claim = Repo.get!(ProductAttributeClaim, imported_current.claim_id)

    assert {:ok, correction} =
             Specs.propose_correction(
               product.id,
               imported_claim.attribute_id,
               shopper.id,
               %{value_num: Decimal.new("181"), unit_id: imported_claim.unit_id},
               %{
                 reason: "Developer exercised the imported claim correction",
                 explanation: "Synthetic local correction used to exercise the lifecycle."
               }
             )

    assert {:ok, _accepted_correction} =
             Specs.moderate_correction(correction.id, moderator.id, :accepted, %{
               moderation_note: "Developer accepted the local correction"
             })

    assert Repo.get!(ProductAttributeClaim, imported_claim.id).status == :superseded

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert Repo.get!(ProductAttributeClaim, imported_claim.id).status == :accepted
    assert imported_current_claim(product.id, "refresh_rate").claim_id == imported_claim.id
  end

  test "reruns restore the accepted correction after a newer correction is selected" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    moderator = Repo.get_by!(User, email: "moderator@example.com")

    seeded_correction =
      Repo.get_by!(SpecificationCorrection,
        submitted_by: shopper.id,
        reason: "Development accepted correction example"
      )

    seeded_claim = Repo.get!(ProductAttributeClaim, seeded_correction.claim_id)

    assert {:ok, newer_correction} =
             Specs.propose_correction(
               seeded_correction.product_id,
               seeded_correction.attribute_id,
               shopper.id,
               %{value_num: Decimal.new("170"), unit_id: seeded_claim.unit_id},
               %{
                 reason: "Developer selected a newer refresh-rate correction",
                 explanation: "Synthetic local correction used to exercise reseeding."
               }
             )

    assert {:ok, _accepted_correction} =
             Specs.moderate_correction(newer_correction.id, moderator.id, :accepted, %{
               moderation_note: "Developer accepted the newer correction"
             })

    assert Repo.get!(ProductAttributeClaim, seeded_claim.id).status == :superseded

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert Repo.get!(SpecificationCorrection, seeded_correction.id).status == :accepted
    assert Repo.get!(ProductAttributeClaim, seeded_claim.id).status == :accepted

    assert Repo.get_by!(ProductAttributeCurrent,
             product_id: seeded_correction.product_id,
             attribute_id: seeded_correction.attribute_id
           ).claim_id == seeded_claim.id

    assert Repo.get!(SpecificationCorrection, newer_correction.id).status == :accepted
  end

  test "reruns reset a pending correction whose claim has no superseded claim" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    moderator = Repo.get_by!(User, email: "moderator@example.com")

    pending_correction =
      Repo.get_by!(SpecificationCorrection,
        submitted_by: shopper.id,
        reason: "Development pending correction example"
      )

    pending_claim = Repo.get!(ProductAttributeClaim, pending_correction.claim_id)
    baseline_claim_id = pending_claim.supersedes_claim_id

    ProductAttributeCurrent
    |> Repo.get_by!(
      product_id: pending_correction.product_id,
      attribute_id: pending_correction.attribute_id
    )
    |> Repo.delete!()

    pending_claim
    |> ProductAttributeClaim.changeset(%{supersedes_claim_id: nil})
    |> Repo.update!()

    assert {:ok, accepted_correction} =
             Specs.moderate_correction(pending_correction.id, moderator.id, :accepted, %{
               moderation_note: "Developer accepted a correction without a prior current claim"
             })

    assert accepted_correction.status == :accepted

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    restored_correction = Repo.get!(SpecificationCorrection, pending_correction.id)
    restored_claim = Repo.get!(ProductAttributeClaim, pending_claim.id)

    assert restored_correction.status == :pending
    assert restored_claim.status == :proposed
    assert is_nil(restored_claim.supersedes_claim_id)

    assert Repo.get_by!(ProductAttributeCurrent,
             product_id: pending_correction.product_id,
             attribute_id: pending_correction.attribute_id
           ).claim_id == baseline_claim_id
  end

  test "reruns preserve user-created coupons that reuse a development code" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    merchant = Repo.get_by!(Merchant, domain: "examplemart.test")
    network = Repo.get_by!(AffiliateNetwork, name: "Development Affiliate Network")

    seeded_coupon =
      Repo.get_by!(Coupon,
        merchant_id: merchant.id,
        code: "DEV-ACTIVE-10",
        description: "Active synthetic development discount"
      )

    assert {:ok, unrelated_coupon} =
             Affiliate.create_coupon(%{
               merchant_id: merchant.id,
               affiliate_network_id: network.id,
               code: "DEV-ACTIVE-10",
               description: "Developer-created coupon with a reused visible code",
               discount_type: :percent,
               discount_value: Decimal.new("25"),
               valid_from: DateTime.add(seeded_coupon.valid_from, -86_400, :second),
               valid_to: DateTime.add(seeded_coupon.valid_to, 86_400, :second),
               terms: "Unrelated local coupon"
             })

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert %Coupon{
             description: "Developer-created coupon with a reused visible code",
             artifact_id: nil,
             terms: "Unrelated local coupon"
           } = Repo.get(Coupon, unrelated_coupon.id)

    assert Repo.get_by!(Coupon,
             merchant_id: merchant.id,
             artifact_id: seeded_coupon.artifact_id,
             code: "DEV-ACTIVE-10"
           ).id == seeded_coupon.id
  end

  test "reruns restore the reserved unobserved offer after price ingestion" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    offer = Repo.get_by!(MerchantProduct, external_sku: "EXM-AB4K")

    watch =
      Repo.get_by!(PriceWatchRule,
        user_id: shopper.id,
        merchant_product_id: offer.id,
        rule_type: :newly_available
      )

    assert {:ok, %PriceWatchRule{enabled: true}} =
             Alerts.update_watch(shopper.id, watch.entropy_id, %{enabled: true})

    observed_at = DateTime.utc_now() |> DateTime.add(60, :second)

    assert {:ok, observation} =
             Pricing.add_price_point(%{
               merchant_product_id: offer.id,
               observed_at: observed_at,
               price: Decimal.new("1799.99"),
               shipping: Decimal.new("0.00"),
               in_stock: true
             })

    assert {:ok, %{events_created: 1}} =
             Alerts.evaluate_price_point(observation.id,
               now: DateTime.add(observed_at, 1, :second)
             )

    event = Repo.get_by!(AlertEvent, triggering_price_point_id: observation.id)

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert Pricing.latest_price(offer.id) == nil
    assert Repo.get(AlertEvent, event.id) == nil
  end

  test "reruns restore reserved conversions after a newer ingestion update" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    seeded = Repo.get_by!(CommerceConversion, network_conversion_ref: "DEV-CONV-APPROVED")
    later_reported_at = DateTime.utc_now() |> DateTime.add(7, :day)

    assert {:ok, exercised} =
             CommerceAttribution.ingest_conversion(%{
               source_network: "development_affiliate",
               network_conversion_ref: seeded.network_conversion_ref,
               status: :paid,
               currency: "USD",
               order_amount: Decimal.new("999.99"),
               commission_amount: Decimal.new("1.00"),
               data_freshness_at: later_reported_at,
               reported_at: later_reported_at,
               raw_payload: %{
                 "synthetic" => true,
                 "exercise" => "newer-development-update"
               }
             })

    assert exercised.id == seeded.id
    assert exercised.status == :paid

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    restored = Repo.get!(CommerceConversion, seeded.id)

    assert restored.status == :approved
    assert Decimal.equal?(restored.order_amount, Decimal.new("649.99"))
    assert Decimal.equal?(restored.commission_amount, Decimal.new("65.00"))
    assert restored.raw_payload["seedScenario"] == "development-approved"
    assert DateTime.compare(restored.reported_at, later_reported_at) == :lt
  end

  test "purchase facts use the linked price observation values" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    facts =
      PurchasePriceFact
      |> join(:inner, [fact], conversion in assoc(fact, :conversion))
      |> where([_fact, conversion], like(conversion.network_conversion_ref, "DEV-CONV-%"))
      |> preload([fact, _conversion], price_observation: [])
      |> Repo.all()

    assert [_, _, _, _] = facts

    for fact <- facts do
      observation = fact.price_observation

      assert Decimal.equal?(fact.observed_price, observation.price)
      assert fact.observed_at == observation.observed_at
      assert Decimal.equal?(fact.listed_price_at_click, observation.price)
      assert Decimal.equal?(fact.shipping_amount, observation.shipping || Decimal.new("0.00"))
    end

    paid_conversion =
      Repo.get_by!(CommerceConversion, network_conversion_ref: "DEV-CONV-PAID")

    paid_fact = Repo.get_by!(PurchasePriceFact, conversion_id: paid_conversion.id)
    paid_observation = Repo.get!(PricePoint, paid_fact.price_observation_id)

    assert Decimal.equal?(paid_conversion.order_amount, Decimal.new("1149.99"))
    assert Decimal.equal?(paid_observation.price, Decimal.new("1149.99"))
    assert Decimal.equal?(paid_fact.reported_paid_price, Decimal.new("1129.99"))
    assert Decimal.equal?(paid_fact.discount_amount, Decimal.new("20.00"))
    assert Decimal.equal?(paid_fact.price_delta, Decimal.new("-20.00"))
  end

  test "reruns tolerate duplicate matching product claims" do
    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    product = Repo.get_by!(Product, slug: "acme-vision-27g")
    moderator = Repo.get_by!(User, email: "moderator@example.com")

    current =
      ProductAttributeCurrent
      |> join(:inner, [current], attribute in assoc(current, :attribute))
      |> where(
        [current, attribute],
        current.product_id == ^product.id and attribute.code == "refresh_rate"
      )
      |> Repo.one!()

    claim = Repo.get!(ProductAttributeClaim, current.claim_id)

    assert {:ok, duplicate} =
             Specs.propose_claim(
               product.id,
               claim.attribute_id,
               %{value_num: claim.value_num, unit_id: claim.unit_id},
               %{source_type: :user, created_by: moderator.id, confidence: Decimal.new("0.50")}
             )

    assert duplicate.id != claim.id

    capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)

    assert Repo.get!(ProductAttributeCurrent, current.id).claim_id == claim.id
    assert Repo.get!(ProductAttributeClaim, duplicate.id).status == :proposed
  end

  test "seeds fail closed rather than move a conflicting validated product identifier" do
    unrelated_product =
      %Product{}
      |> Product.changeset(%{
        name: "Unrelated product with reserved MPN",
        slug: "unrelated-reserved-mpn"
      })
      |> Repo.insert!()

    source =
      %Source{}
      |> Source.changeset(%{
        kind: "manufacturer",
        name: "Unrelated manufacturer evidence",
        domain: "unrelated-manufacturer.test"
      })
      |> Repo.insert!()

    artifact =
      %SourceArtifact{}
      |> SourceArtifact.changeset(%{
        source_id: source.id,
        fetched_at: DateTime.utc_now() |> DateTime.truncate(:microsecond),
        content_hash: "unrelated-reserved-mpn-v1"
      })
      |> Repo.insert!()

    assert {:ok, identifier} =
             Catalog.create_product_identifier(%{
               product_id: unrelated_product.id,
               scheme: :mpn,
               normalized_value: "AV27G",
               display_value: "AV27G",
               verification_status: :validated,
               source_artifact_id: artifact.id
             })

    assert_raise RuntimeError, ~r/MPN AV27G: it already belongs to product/, fn ->
      capture_io(fn -> Code.eval_file("priv/repo/seeds.exs") end)
    end

    assert Repo.get!(ProductIdentifier, identifier.id).product_id == unrelated_product.id
    refute Repo.get_by(User, email: "shopper@example.com")
  end

  defp seed_scope_counts do
    reserved_emails = ~w(
      admin@example.com
      moderator@example.com
      shopper@example.com
      participant@example.com
      unverified@example.com
      reset@example.com
    )

    product_slugs = ~w(
      acme-vision-27g
      acme-vision-27uw
      acme-vision-27i-import
      acme-cinema-55o
      acme-beam-4k
    )

    shopper = Repo.get_by!(User, email: "shopper@example.com")
    cj_source = Repo.get_by!(Source, name: "CJ", provider: "cj")

    import_runs =
      ImportRun
      |> where([run], run.source_id == ^cj_source.id)
      |> Repo.all()
      |> Enum.count(&String.starts_with?(&1.query["seedScenario"] || "", "development-"))

    %{
      users:
        Repo.aggregate(from(user in User, where: user.email in ^reserved_emails), :count, :id),
      products:
        Repo.aggregate(
          from(product in Product, where: product.slug in ^product_slugs),
          :count,
          :id
        ),
      merchants:
        Repo.aggregate(
          from(merchant in Merchant,
            where: merchant.domain in ["examplemart.test", "valuevision.test"]
          ),
          :count,
          :id
        ),
      api_tokens:
        Repo.aggregate(
          from(token in ApiToken,
            where:
              token.user_id == ^shopper.id and
                token.label in ["Development active", "Development revoked"]
          ),
          :count,
          :id
        ),
      saved_sets:
        Repo.aggregate(
          from(saved_set in SavedComparisonSet,
            where:
              saved_set.user_id == ^shopper.id and
                saved_set.name in ["Gaming shortlist", "Home theater shortlist"]
          ),
          :count,
          :id
        ),
      community_receipts:
        Repo.aggregate(
          from(receipt in CommunityWriteReceipt,
            where: like(receipt.idempotency_key, "dev-seed-%")
          ),
          :count,
          :id
        ),
      cj_feeds:
        Repo.aggregate(
          from(feed in MerchantFeedCandidate,
            where:
              feed.source_id == ^cj_source.id and
                like(feed.provider_feed_id, "DEV-CJ-FEED-%")
          ),
          :count,
          :id
        ),
      sources:
        Repo.aggregate(
          from(source in Source,
            where:
              source.name in [
                "Development Manufacturer Evidence",
                "Development Marketplace Evidence",
                "CJ"
              ]
          ),
          :count,
          :id
        ),
      conversions:
        Repo.aggregate(
          from(conversion in CommerceConversion,
            where: like(conversion.network_conversion_ref, "DEV-CONV-%")
          ),
          :count,
          :id
        ),
      import_runs: import_runs
    }
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

  defp restore_env(key, nil), do: Application.delete_env(:product_compare, key)
  defp restore_env(key, value), do: Application.put_env(:product_compare, key, value)
end
