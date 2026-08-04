defmodule ProductCompare.CommerceAttributionTest do
  use ProductCompare.DataCase, async: true

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Affiliate
  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.AwinAdapter
  alias ProductCompare.CommerceAttribution.CJAdapter
  alias ProductCompare.CommerceAttribution.ClickReference
  alias ProductCompare.CommerceAttribution.ImpactAdapter
  alias ProductCompare.CommerceAttribution.RakutenAdapter
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateNetwork
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact

  defmodule PacificTimeZoneDatabase do
    @behaviour Calendar.TimeZoneDatabase

    @pacific_daylight_time %{
      std_offset: 3600,
      utc_offset: -28_800,
      zone_abbr: "PDT"
    }

    @impl true
    def time_zone_periods_from_wall_datetime(_naive_datetime, "America/Los_Angeles"),
      do: {:ok, @pacific_daylight_time}

    def time_zone_periods_from_wall_datetime(_naive_datetime, _time_zone),
      do: {:error, :time_zone_not_found}

    @impl true
    def time_zone_period_from_utc_iso_days(_iso_days, "America/Los_Angeles"),
      do: {:ok, @pacific_daylight_time}

    def time_zone_period_from_utc_iso_days(_iso_days, _time_zone),
      do: {:error, :time_zone_not_found}
  end

  describe "upsert_commerce_link/1" do
    test "converges duplicate non-affiliate destination rows" do
      merchant = merchant_fixture()
      destination_url = "https://merchant.example.com/products/desk"

      {:ok, inserted} =
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchant.id,
          destination_url: destination_url,
          link_type: :non_affiliate,
          campaign_params: %{"utm_campaign" => "launch"},
          is_active: true
        })

      {:ok, updated} =
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchant.id,
          destination_url: destination_url,
          link_type: :non_affiliate,
          campaign_params: %{"utm_campaign" => "refresh"},
          is_active: false
        })

      assert updated.id == inserted.id
      assert updated.campaign_params == %{"utm_campaign" => "refresh"}
      assert updated.is_active == false

      {:ok, reactivated} =
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchant.id,
          destination_url: destination_url,
          link_type: :non_affiliate,
          campaign_params: %{},
          is_active: true
        })

      assert reactivated.id == inserted.id
      assert reactivated.campaign_params == %{}
      assert reactivated.is_active == true
      assert Repo.aggregate(CommerceLink, :count, :id) == 1
    end

    test "requires affiliate links to identify their affiliate program" do
      merchant = merchant_fixture()

      assert {:error, changeset} =
               CommerceAttribution.upsert_commerce_link(%{
                 merchant_id: merchant.id,
                 destination_url: "https://affiliate.example.com/click",
                 link_type: :affiliate
               })

      assert "is invalid" in errors_on(changeset).affiliate_program_id
    end

    test "rejects redirect destinations without an http or https URL" do
      merchant = merchant_fixture()

      assert {:error, changeset} =
               CommerceAttribution.upsert_commerce_link(%{
                 merchant_id: merchant.id,
                 destination_url: "javascript:alert(1)",
                 link_type: :affiliate
               })

      assert "must be a valid http/https URL" in errors_on(changeset).destination_url
    end

    test "rejects redirect destinations that are not public external URLs" do
      merchant = merchant_fixture()

      for destination_url <- [
            "https://trusted.example@attacker.example/offer",
            "https://a\u{200D}b.example/offer",
            "http://localhost/offer",
            "http://192.168.1.1/offer",
            "http://[::ffff:192.168.1.1]/offer"
          ] do
        assert {:error, changeset} =
                 CommerceAttribution.upsert_commerce_link(%{
                   merchant_id: merchant.id,
                   destination_url: destination_url,
                   link_type: :affiliate
                 })

        assert "must be a valid http/https URL" in errors_on(changeset).destination_url
      end
    end
  end

  describe "CommerceLink.valid_destination_url?/1" do
    test "rejects expanded loopback and mapped private IPv6 host forms" do
      for destination_url <- [
            "http://[0:0:0:0:0:0:0:1]/",
            "http://[0:0:0:0:0:ffff:7f00:1]/",
            "http://[0:0:0:0:0:ffff:a9fe:a9fe]/"
          ] do
        refute CommerceLink.valid_destination_url?(destination_url)
      end
    end

    test "rejects browser-canonicalized private IPv4 host forms" do
      for destination_url <- [
            "http://2130706433/",
            "http://0x7f000001/",
            "http://017700000001/",
            "http://127.1/",
            "http://１２７.０.０.１/",
            "http://127。0。0。1/",
            "http://127．0．0．1/",
            "http://127｡0｡0｡1/"
          ] do
        refute CommerceLink.valid_destination_url?(destination_url)
      end
    end

    test "rejects http URLs with malformed explicit ports" do
      for destination_url <- [
            "https://affiliate.example.com:abc/click",
            "https://affiliate.example.com:99999/click"
          ] do
        refute CommerceLink.valid_destination_url?(destination_url)
      end
    end

    test "accepts public DNS hostnames with numeric labels" do
      assert CommerceLink.valid_destination_url?("https://123.example.com/offer")
    end

    test "accepts browser-canonicalized public hostnames" do
      assert CommerceLink.valid_destination_url?("https://%65xample.com/offer")
      assert CommerceLink.valid_destination_url?("https://merchant.example.com\\deal")
    end

    test "rejects percent-encoded private hostnames after canonicalization" do
      refute CommerceLink.valid_destination_url?("http://%31%32%37.0.0.1/offer")
    end

    test "accepts unicode IDN hostnames after canonicalizing labels" do
      assert CommerceLink.valid_destination_url?("https://münich.example/offer")
    end

    test "accepts browser-canonicalized public IPv4 host forms" do
      assert CommerceLink.valid_destination_url?("https://134744072/offer")
    end
  end

  describe "click sessions" do
    test "records a public click id and resolves the redirect destination" do
      commerce_link = commerce_link_fixture(%{link_type: :non_affiliate, network: nil})
      click_id = Ecto.UUID.generate()

      {:ok, click_session} =
        CommerceAttribution.create_click_session(%{
          commerce_link_id: commerce_link.id,
          click_id: click_id,
          anonymous_id: "anon-123",
          source_surface: :web,
          referrer: "https://app.example.com/products/desk",
          user_agent: "ProductCompareTest/1.0",
          ip_address: "203.0.113.42"
        })

      assert click_session.click_id == click_id
      assert click_session.source_surface == :web
      assert click_session.referrer == "https://app.example.com/products/desk"
      assert click_session.user_agent == "ProductCompareTest/1.0"

      assert %Postgrex.INET{address: {203, 0, 113, 42}, netmask: 32} =
               Repo.reload!(click_session).ip_address

      refute Map.has_key?(click_session, :user_agent_hash)
      refute Map.has_key?(click_session, :ip_hash)

      assert {:ok, commerce_link.destination_url} ==
               CommerceAttribution.redirect_destination(click_id)

      assert {:error, :not_found} ==
               CommerceAttribution.redirect_destination(Ecto.UUID.generate())
    end

    test "rejects invalid textual IP addresses" do
      commerce_link = commerce_link_fixture(%{link_type: :non_affiliate, network: nil})

      refute CommerceClickSession.changeset(%CommerceClickSession{}, %{
               commerce_link_id: commerce_link.id,
               ip_address: "999.0.0.1"
             }).valid?
    end

    test "accepts host addresses and rejects IPv4 and IPv6 subnets" do
      commerce_link = commerce_link_fixture(%{link_type: :non_affiliate, network: nil})

      for host <- [
            "203.0.113.42",
            "2001:db8::42",
            {203, 0, 113, 42},
            {0x2001, 0xDB8, 0, 0, 0, 0, 0, 0x42}
          ] do
        assert CommerceClickSession.changeset(%CommerceClickSession{}, %{
                 commerce_link_id: commerce_link.id,
                 ip_address: host
               }).valid?
      end

      for subnet <- ["203.0.113.42/24", "2001:db8::42/64"] do
        refute CommerceClickSession.changeset(%CommerceClickSession{}, %{
                 commerce_link_id: commerce_link.id,
                 ip_address: subnet
               }).valid?
      end
    end

    test "database rejects non-host INET masks" do
      commerce_link = commerce_link_fixture(%{link_type: :non_affiliate, network: nil})

      for subnet <- [
            %Postgrex.INET{address: {203, 0, 113, 42}, netmask: 24},
            %Postgrex.INET{
              address: {0x2001, 0xDB8, 0, 0, 0, 0, 0, 0x42},
              netmask: 64
            }
          ] do
        changeset =
          %CommerceClickSession{}
          |> change(%{
            click_id: Ecto.UUID.generate(),
            commerce_link_id: commerce_link.id,
            source_surface: :web,
            ip_address: subnet
          })
          |> check_constraint(:ip_address,
            name: :commerce_click_sessions_ip_address_host_check,
            message: "must be a host address"
          )

        assert {:error, changeset} = Repo.insert(changeset)
        assert %{ip_address: ["must be a host address"]} = errors_on(changeset)
      end
    end
  end

  describe "track_outbound_click/1" do
    test "decorates verified affiliate networks with their publisher click references" do
      network_matrix = [
        %{
          network: "CJ",
          parameter: "sid",
          affiliate_url: "https://affiliate.example.com/cj#details",
          unrelated: %{}
        },
        %{
          network: "Impact",
          parameter: "subId1",
          affiliate_url:
            "https://affiliate.example.com/impact?ClickId=impact-issued&subId1=static#details",
          unrelated: %{"ClickId" => "impact-issued"}
        },
        %{
          network: "Awin",
          parameter: "clickref",
          affiliate_url:
            "https://affiliate.example.com/awin?campaign=summer&clickref=static&clickref=extra#details",
          unrelated: %{"campaign" => "summer"}
        },
        %{
          network: "Rakuten",
          parameter: "u1",
          affiliate_url: "https://affiliate.example.com/rakuten?coupon=desk&u1=static#details",
          unrelated: %{"coupon" => "desk"}
        }
      ]

      Enum.each(network_matrix, fn %{network: network, parameter: parameter} = expectation ->
        merchant = merchant_fixture()

        merchant_product =
          merchant_product_fixture(%{
            merchant: merchant,
            url: "https://merchant.example.com/direct-product"
          })

        affiliate_network = affiliate_network_fixture(%{name: network})
        affiliate_program_fixture(%{affiliate_network: affiliate_network, merchant: merchant})

        {:ok, _affiliate_link} =
          Affiliate.upsert_link(%{
            merchant_product_id: merchant_product.id,
            affiliate_network_id: affiliate_network.id,
            original_url: merchant_product.url,
            affiliate_url: expectation.affiliate_url
          })

        assert {:ok, tracked_click} =
                 CommerceAttribution.track_outbound_click(%{
                   merchant_product_id: merchant_product.id,
                   source_surface: :web
                 })

        assert {:ok, redirect_destination} =
                 CommerceAttribution.redirect_destination(tracked_click.click_session.click_id)

        redirect_uri = URI.parse(redirect_destination)
        query = URI.decode_query(redirect_uri.query || "")

        expected_reference =
          if network == "Rakuten" do
            String.replace(tracked_click.click_session.click_id, "-", "")
          else
            tracked_click.click_session.click_id
          end

        assert query[parameter] == expected_reference
        assert redirect_uri.fragment == "details"
        assert Map.take(query, Map.keys(expectation.unrelated)) == expectation.unrelated

        assert 1 ==
                 redirect_uri.query
                 |> URI.query_decoder()
                 |> Enum.count(fn {key, _value} -> key == parameter end)

        assert {:ok, tracked_click.click_session.click_id} ==
                 ClickReference.decode(String.downcase(network), expected_reference)
      end)
    end

    test "leaves unverified, Amazon, nil-network, and non-affiliate destinations unchanged" do
      destination_url = "https://affiliate.example.com/click?campaign=summer#details"

      for attrs <- [
            %{link_type: :non_affiliate, network: nil},
            %{link_type: :affiliate, network: "amazon_associates"},
            %{link_type: :affiliate, network: "partnerize"}
          ] do
        commerce_link = commerce_link_fixture(Map.put(attrs, :destination_url, destination_url))
        click_session = click_session_fixture(commerce_link)

        assert {:ok, ^destination_url} =
                 CommerceAttribution.redirect_destination(click_session.click_id)
      end
    end

    test "falls back to the merchant URL when a tracked affiliate network has no program" do
      merchant = merchant_fixture()

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          url: "https://merchant.example.com/direct-product"
        })

      affiliate_network = affiliate_network_fixture(%{name: "Unknown Network"})

      {:ok, _affiliate_link} =
        Affiliate.upsert_link(%{
          merchant_product_id: merchant_product.id,
          affiliate_network_id: affiliate_network.id,
          original_url: merchant_product.url,
          affiliate_url: "https://affiliate.example.com/click/unconfigured-network"
        })

      assert {:ok, tracked_click} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id,
                 source_surface: :web
               })

      assert tracked_click.commerce_link.link_type == :non_affiliate
      assert tracked_click.commerce_link.affiliate_program_id == nil

      assert {:ok, redirect_destination} =
               CommerceAttribution.redirect_destination(tracked_click.click_session.click_id)

      assert redirect_destination == merchant_product.url
    end

    test "falls back to the merchant product URL when no affiliate link exists" do
      merchant = merchant_fixture()

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          url: "https://merchant.example.com/direct-product"
        })

      assert {:ok, tracked_click} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id,
                 source_surface: :web
               })

      assert %CommerceLink{
               destination_url: "https://merchant.example.com/direct-product",
               link_type: :non_affiliate,
               merchant_id: merchant_id,
               backfilled_from_affiliate_links: false,
               is_active: true
             } = tracked_click.commerce_link

      assert merchant_id == merchant.id
      assert tracked_click.click_session.merchant_product_id == merchant_product.id
      assert tracked_click.redirect_path == "/r/#{tracked_click.click_session.click_id}"
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 1
    end

    test "treats existing disabled commerce links as unavailable" do
      merchant = merchant_fixture()

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          url: "https://merchant.example.com/disabled-product"
        })

      disabled_link =
        commerce_link_fixture(%{
          merchant: merchant,
          destination_url: merchant_product.url,
          link_type: :non_affiliate,
          network: nil,
          is_active: false
        })

      assert {:error, :merchant_product_not_found} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id,
                 source_surface: :web
               })

      assert Repo.get!(CommerceLink, disabled_link.id).is_active == false
      assert Repo.aggregate(CommerceLink, :count, :id) == 1
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 0
    end

    test "falls back to the merchant product URL when the affiliate URL is unsafe" do
      merchant = merchant_fixture()

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          url: "https://merchant.example.com/direct-product"
        })

      affiliate_network = affiliate_network_fixture(%{name: "Impact"})

      {:ok, _affiliate_link} =
        Affiliate.upsert_link(%{
          merchant_product_id: merchant_product.id,
          affiliate_network_id: affiliate_network.id,
          original_url: merchant_product.url,
          affiliate_url: "javascript:alert(1)"
        })

      assert {:ok, tracked_click} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id,
                 source_surface: :web
               })

      assert %CommerceLink{
               destination_url: "https://merchant.example.com/direct-product",
               link_type: :non_affiliate,
               merchant_id: merchant_id,
               backfilled_from_affiliate_links: false,
               is_active: true
             } = tracked_click.commerce_link

      assert merchant_id == merchant.id

      assert {:ok, "https://merchant.example.com/direct-product"} =
               CommerceAttribution.redirect_destination(tracked_click.click_session.click_id)
    end

    test "falls back to the merchant product URL when the affiliate URL has a malformed port" do
      merchant = merchant_fixture()

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          url: "https://merchant.example.com/direct-product"
        })

      affiliate_network = affiliate_network_fixture(%{name: "Impact"})

      {:ok, _affiliate_link} =
        Affiliate.upsert_link(%{
          merchant_product_id: merchant_product.id,
          affiliate_network_id: affiliate_network.id,
          original_url: merchant_product.url,
          affiliate_url: "https://affiliate.example.com:abc/click"
        })

      assert {:ok, tracked_click} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id,
                 source_surface: :web
               })

      assert %CommerceLink{
               destination_url: "https://merchant.example.com/direct-product",
               link_type: :non_affiliate,
               backfilled_from_affiliate_links: false
             } = tracked_click.commerce_link
    end

    test "normalizes browser-accepted merchant product URLs before tracking" do
      merchant_product =
        merchant_product_fixture(%{
          url: " https://merchant.example.com\\path with spaces?q=a b "
        })

      assert {:ok, tracked_click} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id,
                 source_surface: :web
               })

      assert %CommerceLink{
               destination_url: "https://merchant.example.com/path%20with%20spaces?q=a%20b",
               link_type: :non_affiliate
             } = tracked_click.commerce_link

      assert {:ok, "https://merchant.example.com/path%20with%20spaces?q=a%20b"} =
               CommerceAttribution.redirect_destination(tracked_click.click_session.click_id)
    end

    test "rejects inactive merchant products without creating link or click records" do
      merchant_product = merchant_product_fixture(%{is_active: false})

      assert {:error, :merchant_product_not_found} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id,
                 source_surface: :web
               })

      assert Repo.aggregate(CommerceLink, :count, :id) == 0
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 0
    end

    test "rejects unknown merchant products without creating link or click records" do
      assert {:error, :merchant_product_not_found} =
               CommerceAttribution.track_outbound_click(%{merchant_product_id: 9_999_999})

      assert Repo.aggregate(CommerceLink, :count, :id) == 0
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 0
    end

    test "rejects unsafe stored merchant destinations without creating click records" do
      for url <- [
            "javascript:alert(1)",
            "https://trusted.example@attacker.example/offer",
            "http://localhost/offer",
            "http://192.168.1.1/offer",
            "http://[::ffff:192.168.1.1]/offer",
            "http://[::127.0.0.1]/offer",
            "https:/merchant.example/offer"
          ] do
        merchant_product = merchant_product_fixture(%{url: url})

        assert {:error, %Ecto.Changeset{} = changeset} =
                 CommerceAttribution.track_outbound_click(%{
                   merchant_product_id: merchant_product.id
                 })

        assert "must be a valid http/https URL" in errors_on(changeset).destination_url
      end

      assert Repo.aggregate(CommerceLink, :count, :id) == 0
      assert Repo.aggregate(CommerceClickSession, :count, :id) == 0
    end
  end

  describe "ImpactAdapter.ingest_action/1" do
    test "upserts conversions by network reference and resolves public click ids" do
      merchant_product = merchant_product_fixture()
      commerce_link = commerce_link_fixture(%{merchant_id: merchant_product.merchant_id})
      click_session = click_session_fixture(commerce_link)

      payload = %{
        "ActionId" => "impact-action-1",
        "SubId1" => click_session.click_id,
        "ClickId" => "impact-click-1",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "EventDate" => "2026-05-20T12:00:00Z",
        "ReportingDate" => "2026-05-20T12:05:00Z",
        "MerchantProductId" => merchant_product.id
      }

      {:ok, inserted} = ImpactAdapter.ingest_action(payload)

      assert inserted.source_network == "impact"
      assert inserted.network_conversion_ref == "impact-action-1"
      assert inserted.click_session_id == click_session.id
      assert inserted.public_click_id == click_session.click_id
      assert inserted.network_click_ref == "impact-click-1"
      assert inserted.status == :pending
      assert inserted.attribution_confidence == :high
      assert inserted.merchant_product_id == merchant_product.id
      assert Decimal.equal?(inserted.order_amount, Decimal.new("129.99"))
      assert Decimal.equal?(inserted.commission_amount, Decimal.new("12.34"))

      {:ok, updated} =
        ImpactAdapter.ingest_action(%{
          payload
          | "Status" => "APPROVED",
            "Payout" => "15.00",
            "ReportingDate" => "2026-05-21T09:00:00Z"
        })

      assert updated.id == inserted.id
      assert updated.status == :approved
      assert Decimal.equal?(updated.commission_amount, Decimal.new("15.00"))
      assert updated.data_freshness_at == ~U[2026-05-21 09:00:00.000000Z]

      {:ok, reverted} =
        ImpactAdapter.ingest_action(%{
          payload
          | "Status" => "PENDING",
            "Payout" => "15.00",
            "ReportingDate" => "2026-05-21T10:00:00Z"
        })

      assert reverted.id == inserted.id
      assert reverted.status == :pending
      assert Repo.aggregate(CommerceConversion, :count, :id) == 1
    end

    test "preserves click attribution when follow-up payloads omit click ids" do
      commerce_link = commerce_link_fixture()
      click_session = click_session_fixture(commerce_link)

      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "SubId1" => click_session.click_id,
        "ClickId" => "impact-click-#{System.unique_integer([:positive])}",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      {:ok, inserted} = ImpactAdapter.ingest_action(payload)

      {:ok, updated} =
        payload
        |> Map.drop(["SubId1"])
        |> Map.merge(%{
          "Status" => "APPROVED",
          "Payout" => "15.00",
          "ReportingDate" => "2026-05-21T09:00:00Z"
        })
        |> ImpactAdapter.ingest_action()

      assert updated.id == inserted.id
      assert updated.status == :approved
      assert updated.click_session_id == click_session.id
      assert updated.public_click_id == click_session.click_id
      assert updated.attribution_confidence == :high
    end

    test "rejects a conflicting merchant product on an identifier-free follow-up" do
      clicked_merchant = merchant_fixture()
      clicked_merchant_product = merchant_product_fixture(%{merchant: clicked_merchant})
      commerce_link = commerce_link_fixture(%{merchant: clicked_merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "SubId1" => click_session.click_id,
        "ClickId" => "impact-click-#{System.unique_integer([:positive])}",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "15.00",
        "ReportingDate" => "2026-05-20T12:05:00Z",
        "MerchantProductId" => clicked_merchant_product.id
      }

      assert {:ok, approved} = ImpactAdapter.ingest_action(payload)
      conflicting_merchant_product = merchant_product_fixture()

      follow_up =
        payload
        |> Map.drop(["SubId1"])
        |> Map.merge(%{
          "Status" => "PAID",
          "Payout" => "20.00",
          "ReportingDate" => "2026-05-21T12:05:00Z",
          "MerchantProductId" => conflicting_merchant_product.id
        })

      assert {:error, changeset} = ImpactAdapter.ingest_action(follow_up)
      assert "does not match resolved click" in errors_on(changeset).merchant_product_id
      assert Repo.reload!(approved) == %{approved | source_network: nil}
    end

    test "rejects a conflicting direct dimension on an identifier-free follow-up" do
      clicked_merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: clicked_merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      attrs = %{
        source_network: "impact",
        network_conversion_ref: "direct-follow-up-#{System.unique_integer([:positive])}",
        public_click_id: click_session.click_id,
        merchant_id: clicked_merchant.id,
        status: :approved,
        currency: "USD",
        commission_amount: Decimal.new("15.00"),
        reported_at: ~U[2026-05-20 12:05:00Z]
      }

      assert {:ok, approved} = CommerceAttribution.ingest_conversion(attrs)

      assert {:error, changeset} =
               CommerceAttribution.ingest_conversion(%{
                 attrs
                 | public_click_id: nil,
                   merchant_id: merchant_fixture().id,
                   status: :paid,
                   commission_amount: Decimal.new("20.00"),
                   reported_at: ~U[2026-05-21 12:05:00Z]
               })

      assert "does not match resolved click" in errors_on(changeset).merchant_id
      assert Repo.reload!(approved) == %{approved | source_network: nil}
    end

    test "stores malformed publisher references without rejecting conversions" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "SubId1" => "impact-subid-123",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = ImpactAdapter.ingest_action(payload)
      assert conversion.public_click_id == nil
      assert conversion.click_session_id == nil
      assert conversion.network_click_ref == "impact-subid-123"
      assert conversion.attribution_confidence == :unmatched
    end

    test "clears stale click identity when a newer payload has a malformed publisher reference" do
      clicked_merchant = merchant_fixture()
      clicked_product = SpecsFixtures.product_fixture()

      clicked_merchant_product =
        merchant_product_fixture(%{merchant: clicked_merchant, product: clicked_product})

      commerce_link = commerce_link_fixture(%{merchant: clicked_merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)
      provider_merchant_product = merchant_product_fixture()

      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "SubId1" => click_session.click_id,
        "ClickId" => "impact-click-original",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "ReportingDate" => "2026-05-20T12:05:00Z",
        "MerchantProductId" => clicked_merchant_product.id
      }

      assert {:ok, attributed} = ImpactAdapter.ingest_action(payload)
      assert attributed.click_session_id == click_session.id
      assert attributed.attribution_confidence == :high

      assert {:ok, updated} =
               ImpactAdapter.ingest_action(%{
                 payload
                 | "SubId1" => "not-a-product-compare-click",
                   "ClickId" => "impact-click-reported",
                   "ReportingDate" => "2026-05-21T12:05:00Z",
                   "MerchantProductId" => provider_merchant_product.id
               })

      assert updated.click_session_id == nil
      assert updated.public_click_id == nil
      assert updated.merchant_id == nil
      assert updated.affiliate_program_id == nil
      assert updated.product_id == nil
      assert updated.merchant_product_id == provider_merchant_product.id
      assert updated.attribution_confidence == :unmatched
      assert updated.network_click_ref == "impact-click-reported"
    end

    test "clears stale click identity while retaining a newer unresolved public click UUID" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)
      unresolved_click_id = Ecto.UUID.generate()

      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "SubId1" => click_session.click_id,
        "ClickId" => "impact-click-original",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "ReportingDate" => "2026-05-20T12:05:00Z",
        "MerchantProductId" => merchant_product.id
      }

      assert {:ok, attributed} = ImpactAdapter.ingest_action(payload)
      assert attributed.click_session_id == click_session.id
      assert attributed.attribution_confidence == :high

      assert {:ok, updated} =
               ImpactAdapter.ingest_action(%{
                 payload
                 | "SubId1" => unresolved_click_id,
                   "ClickId" => "impact-click-unresolved",
                   "ReportingDate" => "2026-05-21T12:05:00Z"
               })

      assert updated.click_session_id == nil
      assert updated.public_click_id == unresolved_click_id
      assert updated.merchant_id == nil
      assert updated.affiliate_program_id == nil
      assert updated.product_id == nil
      assert updated.merchant_product_id == merchant_product.id
      assert updated.attribution_confidence == :unmatched
      assert updated.network_click_ref == "impact-click-unresolved"
    end

    test "attributes SubId1 conversions to the clicked merchant product" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})

      {:ok, click_session} =
        CommerceAttribution.create_click_session(%{
          commerce_link_id: commerce_link.id,
          merchant_product_id: merchant_product.id,
          anonymous_id: "anon-#{System.unique_integer([:positive])}",
          source_surface: :web
        })

      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "SubId1" => click_session.click_id,
        "ClickId" => "impact-click-#{System.unique_integer([:positive])}",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "12.34",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = ImpactAdapter.ingest_action(payload)
      assert conversion.click_session_id == click_session.id
      assert conversion.public_click_id == click_session.click_id
      assert conversion.merchant_id == merchant.id
      assert conversion.product_id == product.id
      assert conversion.merchant_product_id == merchant_product.id
      assert conversion.attribution_confidence == :high

      assert %{
               "metrics" => %{
                 "commission_revenue" => "12.34",
                 "conversions" => 1,
                 "gross_order_value" => "129.99"
               }
             } = CommerceAttribution.product_revenue_summary(product.id, network: "impact")
    end

    test "rejects provider dimensions that conflict with the resolved click" do
      clicked_merchant = merchant_fixture()
      clicked_product = SpecsFixtures.product_fixture()

      clicked_merchant_product =
        merchant_product_fixture(%{merchant: clicked_merchant, product: clicked_product})

      clicked_program =
        affiliate_program_fixture(%{
          affiliate_network: affiliate_network_fixture(%{name: "Impact"}),
          merchant: clicked_merchant
        })

      commerce_link =
        commerce_link_fixture(%{
          merchant: clicked_merchant,
          affiliate_program_id: clicked_program.id,
          network: "impact"
        })

      {:ok, click_session} =
        CommerceAttribution.create_click_session(%{
          commerce_link_id: commerce_link.id,
          merchant_product_id: clicked_merchant_product.id,
          anonymous_id: "anon-#{System.unique_integer([:positive])}",
          source_surface: :web
        })

      other_merchant = merchant_fixture()
      other_product = SpecsFixtures.product_fixture()

      other_merchant_product =
        merchant_product_fixture(%{merchant: other_merchant, product: other_product})

      other_program =
        affiliate_program_fixture(%{
          affiliate_network: affiliate_network_fixture(%{name: "Awin"}),
          merchant: other_merchant
        })

      conflicts = [
        merchant_id: other_merchant.id,
        affiliate_program_id: other_program.id,
        product_id: other_product.id,
        merchant_product_id: other_merchant_product.id
      ]

      for {field, conflicting_id} <- conflicts do
        attrs = %{
          source_network: "impact",
          network_conversion_ref: "conflicting-#{field}-#{System.unique_integer([:positive])}",
          public_click_id: click_session.click_id,
          status: :approved,
          currency: "USD",
          reported_at: ~U[2026-05-20 12:05:00Z]
        }

        assert {:error, changeset} =
                 attrs
                 |> Map.put(field, conflicting_id)
                 |> CommerceAttribution.ingest_conversion()

        assert "does not match resolved click" in errors_on(changeset)[field]
      end

      assert Repo.aggregate(CommerceConversion, :count, :id) == 0
    end

    test "rejects provider relations that conflict with a click-known merchant" do
      clicked_merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: clicked_merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      other_merchant = merchant_fixture()

      other_program =
        affiliate_program_fixture(%{
          affiliate_network: affiliate_network_fixture(%{name: "Awin"}),
          merchant: other_merchant
        })

      other_merchant_product = merchant_product_fixture(%{merchant: other_merchant})

      conflicts = [
        affiliate_program_id: other_program.id,
        merchant_product_id: other_merchant_product.id
      ]

      for {field, conflicting_id} <- conflicts do
        attrs = %{
          source_network: "impact",
          network_conversion_ref:
            "relational-conflict-#{field}-#{System.unique_integer([:positive])}",
          public_click_id: click_session.click_id,
          status: :approved,
          currency: "USD",
          reported_at: ~U[2026-05-20 12:05:00Z]
        }

        assert {:error, changeset} =
                 attrs
                 |> Map.put(field, conflicting_id)
                 |> CommerceAttribution.ingest_conversion()

        assert "does not match resolved click" in errors_on(changeset)[field]
      end

      assert Repo.aggregate(CommerceConversion, :count, :id) == 0
    end

    test "allows compatible provider relations where the click lacks those dimensions" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

      affiliate_program =
        affiliate_program_fixture(%{
          affiliate_network: affiliate_network_fixture(%{name: "Impact"}),
          merchant: merchant
        })

      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      assert {:ok, conversion} =
               CommerceAttribution.ingest_conversion(%{
                 source_network: "impact",
                 network_conversion_ref:
                   "compatible-relations-#{System.unique_integer([:positive])}",
                 public_click_id: click_session.click_id,
                 affiliate_program_id: affiliate_program.id,
                 merchant_product_id: merchant_product.id,
                 status: :approved,
                 currency: "USD",
                 reported_at: ~U[2026-05-20 12:05:00Z]
               })

      assert conversion.merchant_id == merchant.id
      assert conversion.affiliate_program_id == affiliate_program.id
      assert conversion.merchant_product_id == merchant_product.id
      assert conversion.product_id == nil
      assert conversion.attribution_confidence == :high
    end

    test "resolves a castable string click session id before validating dimensions" do
      clicked_merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: clicked_merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)
      other_merchant = merchant_fixture()

      assert {:error, changeset} =
               CommerceAttribution.ingest_conversion(%{
                 source_network: "impact",
                 network_conversion_ref:
                   "string-click-session-#{System.unique_integer([:positive])}",
                 click_session_id: Integer.to_string(click_session.id),
                 merchant_id: other_merchant.id,
                 status: :approved,
                 currency: "USD",
                 reported_at: ~U[2026-05-20 12:05:00Z]
               })

      assert "does not match resolved click" in errors_on(changeset).merchant_id
      assert Repo.aggregate(CommerceConversion, :count, :id) == 0
    end

    test "enriches provider conversions from a resolved link when no dimensions conflict" do
      merchant = merchant_fixture()

      affiliate_program =
        affiliate_program_fixture(%{
          affiliate_network: affiliate_network_fixture(%{name: "Impact"}),
          merchant: merchant
        })

      commerce_link =
        commerce_link_fixture(%{
          merchant: merchant,
          affiliate_program_id: affiliate_program.id,
          network: "impact"
        })

      click_session = click_session_fixture(commerce_link)

      assert {:ok, conversion} =
               CommerceAttribution.ingest_conversion(%{
                 source_network: "impact",
                 network_conversion_ref: "link-only-#{System.unique_integer([:positive])}",
                 public_click_id: click_session.click_id,
                 status: :approved,
                 currency: "USD",
                 reported_at: ~U[2026-05-20 12:05:00Z]
               })

      assert conversion.click_session_id == click_session.id
      assert conversion.merchant_id == merchant.id
      assert conversion.affiliate_program_id == affiliate_program.id
      assert conversion.merchant_product_id == nil
      assert conversion.product_id == nil
      assert conversion.attribution_confidence == :high
    end

    test "rejects an unknown initial status without writing a conversion" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "UNRECOGNIZED",
        "Currency" => "USD",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:error, changeset} = ImpactAdapter.ingest_action(payload)
      assert "is invalid" in errors_on(changeset).status
      assert Repo.aggregate(CommerceConversion, :count, :id) == 0
    end

    test "rejects an unknown status update without downgrading an approved conversion" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "Payout" => "15.00",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, approved} = ImpactAdapter.ingest_action(payload)

      assert {:error, changeset} =
               ImpactAdapter.ingest_action(%{
                 payload
                 | "Status" => "UNRECOGNIZED",
                   "Payout" => "1.00",
                   "ReportingDate" => "2026-05-21T12:05:00Z"
               })

      assert "is invalid" in errors_on(changeset).status

      reloaded = Repo.reload!(approved)
      assert reloaded.status == :approved
      assert Decimal.equal?(reloaded.commission_amount, Decimal.new("15.00"))
      assert reloaded.reported_at == ~U[2026-05-20 12:05:00.000000Z]
    end

    test "rejects missing and nil initial statuses without writing conversions" do
      for status_attrs <- [%{}, %{"Status" => nil}] do
        payload =
          Map.merge(
            %{
              "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
              "Currency" => "USD",
              "ReportingDate" => "2026-05-20T12:05:00Z"
            },
            status_attrs
          )

        assert {:error, changeset} = ImpactAdapter.ingest_action(payload)
        assert "is invalid" in errors_on(changeset).status
      end

      assert Repo.aggregate(CommerceConversion, :count, :id) == 0
    end

    test "rejects missing and nil status updates without downgrading an approved conversion" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "Payout" => "15.00",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, approved} = ImpactAdapter.ingest_action(payload)

      for status_transform <- [
            &Map.delete(&1, "Status"),
            &Map.put(&1, "Status", nil)
          ] do
        update_payload =
          payload
          |> status_transform.()
          |> Map.merge(%{
            "Payout" => "1.00",
            "ReportingDate" => "2026-05-21T12:05:00Z"
          })

        assert {:error, changeset} = ImpactAdapter.ingest_action(update_payload)
        assert "is invalid" in errors_on(changeset).status

        reloaded = Repo.reload!(approved)
        assert reloaded.status == :approved
        assert Decimal.equal?(reloaded.commission_amount, Decimal.new("15.00"))
        assert reloaded.reported_at == ~U[2026-05-20 12:05:00.000000Z]
      end
    end

    test "ignores stale follow-up payloads with older reported timestamps" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "APPROVED",
        "Currency" => "USD",
        "SaleAmount" => "129.99",
        "Payout" => "15.00",
        "ReportingDate" => "2026-05-21T09:00:00Z"
      }

      {:ok, inserted} = ImpactAdapter.ingest_action(payload)

      {:ok, stale_result} =
        ImpactAdapter.ingest_action(%{
          payload
          | "Status" => "PENDING",
            "Payout" => "1.00",
            "ReportingDate" => "2026-05-20T09:00:00Z"
        })

      assert stale_result.id == inserted.id
      assert stale_result.status == :approved
      assert Decimal.equal?(stale_result.commission_amount, Decimal.new("15.00"))
      assert stale_result.reported_at == ~U[2026-05-21 09:00:00.000000Z]
    end

    test "does not crash on malformed numeric payload fields" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => "N/A",
        "Payout" => "",
        "ReportingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = ImpactAdapter.ingest_action(payload)
      assert conversion.order_amount == nil
      assert conversion.commission_amount == nil
    end

    test "does not crash on unsupported optional payload field types" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "PENDING",
        "Currency" => "USD",
        "SaleAmount" => %{"amount" => "129.99"},
        "Payout" => ["12.34"],
        "EventDate" => %{"timestamp" => "2026-05-20T12:00:00Z"},
        "ReportingDate" => "2026-05-20T12:05:00Z",
        "MerchantProductId" => %{"id" => 123}
      }

      assert {:ok, conversion} = ImpactAdapter.ingest_action(payload)
      assert conversion.order_amount == nil
      assert conversion.commission_amount == nil
      assert conversion.purchased_at == nil
      assert conversion.merchant_product_id == nil
    end

    test "returns a changeset error instead of crashing on unsupported required date types" do
      payload = %{
        "ActionId" => "impact-action-#{System.unique_integer([:positive])}",
        "Status" => "PENDING",
        "Currency" => "USD",
        "ReportingDate" => %{"timestamp" => "2026-05-20T12:05:00Z"}
      }

      assert {:error, changeset} = ImpactAdapter.ingest_action(payload)
      assert "can't be blank" in errors_on(changeset).reported_at
    end
  end

  describe "CJAdapter.ingest_transaction/1" do
    test "normalizes string-keyed commissions and resolves SID click attribution" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      affiliate_network = Repo.get_by!(AffiliateNetwork, code: "cj")

      affiliate_program =
        affiliate_program_fixture(%{
          affiliate_network: affiliate_network,
          merchant: merchant
        })

      commerce_link =
        commerce_link_fixture(%{
          merchant: merchant,
          affiliate_program_id: affiliate_program.id
        })

      {:ok, click_session} =
        CommerceAttribution.create_click_session(%{
          commerce_link_id: commerce_link.id,
          merchant_product_id: merchant_product.id,
          source_surface: :web
        })

      payload = %{
        "commissionId" => "cj-commission-#{System.unique_integer([:positive])}",
        "SID" => click_session.click_id,
        "actionStatus" => "LOCKED",
        "currency" => "USD",
        "saleAmount" => "81.25",
        "commissionAmount" => "8.12",
        "eventDate" => "2026-05-20T12:00:00Z",
        "postingDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = CJAdapter.ingest_transaction(payload)
      assert conversion.source_network == "cj"
      assert conversion.network_conversion_ref == payload["commissionId"]
      assert conversion.click_session_id == click_session.id
      assert conversion.public_click_id == click_session.click_id
      assert conversion.merchant_id == merchant.id
      assert conversion.product_id == product.id
      assert conversion.merchant_product_id == merchant_product.id
      assert conversion.status == :approved
      assert conversion.currency == "USD"
      assert conversion.attribution_confidence == :high
      assert Decimal.equal?(conversion.order_amount, Decimal.new("81.25"))
      assert Decimal.equal?(conversion.commission_amount, Decimal.new("8.12"))
      assert conversion.purchased_at == ~U[2026-05-20 12:00:00.000000Z]
      assert conversion.reported_at == ~U[2026-05-20 12:05:00.000000Z]
      assert conversion.data_freshness_at == ~U[2026-05-20 12:05:00.000000Z]
      assert conversion.raw_payload == payload
    end

    test "normalizes atom-keyed commissions and preserves malformed publisher references" do
      payload = %{
        commission_id: "cj-commission-#{System.unique_integer([:positive])}",
        sid: "not-a-product-compare-click",
        action_status: :new,
        currency: "USD",
        sale_amount: Decimal.new("25.00"),
        commission_amount: Decimal.new("2.50"),
        event_date: ~U[2026-05-20 12:00:00Z],
        posting_date: ~U[2026-05-20 12:05:00Z]
      }

      assert {:ok, conversion} = CJAdapter.ingest_transaction(payload)
      assert conversion.public_click_id == nil
      assert conversion.click_session_id == nil
      assert conversion.network_click_ref == "not-a-product-compare-click"
      assert conversion.status == :pending
      assert conversion.attribution_confidence == :unmatched
      assert conversion.raw_payload["sid"] == "not-a-product-compare-click"
      assert conversion.raw_payload["action_status"] == "new"
      assert conversion.raw_payload["commission_amount"] == "2.50"
    end
  end

  describe "AwinAdapter.ingest_transaction/1" do
    test "normalizes string-keyed transactions and resolves clickRef attribution" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "awin"})

      {:ok, click_session} =
        CommerceAttribution.create_click_session(%{
          commerce_link_id: commerce_link.id,
          merchant_product_id: merchant_product.id,
          source_surface: :web
        })

      payload = %{
        "id" => "awin-transaction-#{System.unique_integer([:positive])}",
        "ClickRef" => click_session.click_id,
        "commissionStatus" => "approved",
        "saleAmount" => %{"amount" => "92.50", "currency" => "USD"},
        "commissionAmount" => %{"amount" => "9.25", "currency" => "USD"},
        "transactionDate" => "2026-05-20T12:00:00Z",
        "validationDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = AwinAdapter.ingest_transaction(payload)
      assert conversion.source_network == "awin"
      assert conversion.network_conversion_ref == payload["id"]
      assert conversion.click_session_id == click_session.id
      assert conversion.public_click_id == click_session.click_id
      assert conversion.merchant_id == merchant.id
      assert conversion.product_id == product.id
      assert conversion.merchant_product_id == merchant_product.id
      assert conversion.status == :approved
      assert conversion.currency == "USD"
      assert conversion.attribution_confidence == :high
      assert Decimal.equal?(conversion.order_amount, Decimal.new("92.50"))
      assert Decimal.equal?(conversion.commission_amount, Decimal.new("9.25"))
      assert conversion.purchased_at == ~U[2026-05-20 12:00:00.000000Z]
      assert conversion.reported_at == ~U[2026-05-20 12:05:00.000000Z]
      assert conversion.data_freshness_at == ~U[2026-05-20 12:05:00.000000Z]
      assert conversion.raw_payload == payload
    end

    test "normalizes atom-keyed transactions and ignores stale updates" do
      reference = "awin-transaction-#{System.unique_integer([:positive])}"

      payload = %{
        id: reference,
        click_ref: " ",
        commission_status: :approved,
        sale_amount: %{amount: "92.50", currency: "USD"},
        commission_amount: %{amount: "9.25", currency: "USD"},
        transaction_date: ~U[2026-05-20 12:00:00Z],
        validation_date: ~U[2026-05-21 12:05:00Z]
      }

      assert {:ok, approved} = AwinAdapter.ingest_transaction(payload)
      assert approved.public_click_id == nil
      assert approved.network_click_ref == nil

      stale_payload = %{
        payload
        | commission_status: :declined,
          commission_amount: %{amount: "1.00", currency: "USD"},
          validation_date: ~U[2026-05-20 12:05:00Z]
      }

      assert {:ok, stale} = AwinAdapter.ingest_transaction(stale_payload)
      assert stale.id == approved.id
      assert stale.status == :approved
      assert Decimal.equal?(stale.commission_amount, Decimal.new("9.25"))
      assert stale.raw_payload["click_ref"] == " "
      assert stale.raw_payload["commission_status"] == "approved"

      assert stale.raw_payload["commission_amount"] == %{
               "amount" => "9.25",
               "currency" => "USD"
             }
    end
  end

  describe "RakutenAdapter.ingest_transaction/1" do
    test "restores string-keyed compact u1 references and hydrates click dimensions" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "rakuten"})

      {:ok, click_session} =
        CommerceAttribution.create_click_session(%{
          commerce_link_id: commerce_link.id,
          merchant_product_id: merchant_product.id,
          source_surface: :web
        })

      payload = %{
        "transactionId" => "rakuten-transaction-#{System.unique_integer([:positive])}",
        "u1" => String.replace(click_session.click_id, "-", ""),
        "status" => "approved",
        "currency" => "USD",
        "saleAmount" => "105.00",
        "commissionAmount" => "10.50",
        "transactionDate" => "2026-05-20T12:00:00Z",
        "processDate" => "2026-05-20T12:05:00Z"
      }

      assert {:ok, conversion} = RakutenAdapter.ingest_transaction(payload)
      assert conversion.source_network == "rakuten"
      assert conversion.network_conversion_ref == payload["transactionId"]
      assert conversion.click_session_id == click_session.id
      assert conversion.public_click_id == click_session.click_id
      assert conversion.merchant_id == merchant.id
      assert conversion.product_id == product.id
      assert conversion.merchant_product_id == merchant_product.id
      assert conversion.status == :approved
      assert conversion.currency == "USD"
      assert conversion.attribution_confidence == :high
      assert Decimal.equal?(conversion.order_amount, Decimal.new("105.00"))
      assert Decimal.equal?(conversion.commission_amount, Decimal.new("10.50"))
      assert conversion.purchased_at == ~U[2026-05-20 12:00:00.000000Z]
      assert conversion.reported_at == ~U[2026-05-20 12:05:00.000000Z]
      assert conversion.data_freshness_at == ~U[2026-05-20 12:05:00.000000Z]
      assert conversion.raw_payload == payload
    end

    test "normalizes atom-keyed member IDs and rejects affiliate-network conflicts" do
      clicked_merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: clicked_merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      payload = %{
        transaction_id: "rakuten-transaction-#{System.unique_integer([:positive])}",
        member_id: String.replace(click_session.click_id, "-", ""),
        status: :paid,
        currency: "USD",
        sale_amount: Decimal.new("105.00"),
        commission_amount: Decimal.new("10.50"),
        transaction_date: ~U[2026-05-20 12:00:00Z],
        process_date: ~U[2026-05-20 12:05:00Z]
      }

      assert {:error, changeset} = RakutenAdapter.ingest_transaction(payload)
      assert "does not match resolved click" in errors_on(changeset).affiliate_network_id
      assert Repo.aggregate(CommerceConversion, :count, :id) == 0
    end

    test "keeps malformed compact u1 references unmatched and ignores blank references" do
      for {u1, expected_network_click_ref} <- [
            {"not-a-compact-uuid", "not-a-compact-uuid"},
            {" ", nil}
          ] do
        payload = %{
          "transactionId" => "rakuten-transaction-#{System.unique_integer([:positive])}",
          "u1" => u1,
          "status" => "pending",
          "currency" => "USD",
          "saleAmount" => "20.00",
          "commissionAmount" => "2.00",
          "transactionDate" => "2026-05-20T12:00:00Z",
          "processDate" => "2026-05-20T12:05:00Z"
        }

        assert {:ok, conversion} = RakutenAdapter.ingest_transaction(payload)
        assert conversion.public_click_id == nil
        assert conversion.click_session_id == nil
        assert conversion.network_click_ref == expected_network_click_ref
        assert conversion.attribution_confidence == :unmatched
        assert conversion.raw_payload == payload
      end
    end
  end

  describe "provider publisher-reference updates" do
    test "clears malformed CJ, Awin, and Rakuten evidence on an independently blank update" do
      for %{provider: provider, ingest: ingest, reference_keys: reference_keys} <-
            adapter_click_reference_update_cases(),
          provider != :impact,
          reference_key <- reference_keys do
        conversion_ref = "#{provider}-malformed-blank-#{System.unique_integer([:positive])}"
        malformed_reference = "malformed-#{provider}-publisher-reference"

        assert {:ok, malformed} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     malformed_reference,
                     "2026-05-20T12:05:00Z"
                   )
                 )

        assert malformed.network_click_ref == malformed_reference
        assert malformed.attribution_confidence == :unmatched

        assert {:ok, cleared} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     " \t ",
                     "2026-05-21T12:05:00Z"
                   )
                 )

        assert cleared.id == malformed.id
        assert cleared.click_session_id == nil
        assert cleared.public_click_id == nil
        assert cleared.network_click_ref == nil
        assert cleared.attribution_confidence == :unmatched
      end
    end

    test "preserves malformed CJ, Awin, and Rakuten evidence when the update omits the reference" do
      for %{provider: provider, ingest: ingest, reference_keys: reference_keys} <-
            adapter_click_reference_update_cases(),
          provider != :impact,
          reference_key <- reference_keys do
        conversion_ref = "#{provider}-malformed-omitted-#{System.unique_integer([:positive])}"
        malformed_reference = "malformed-#{provider}-publisher-reference"

        assert {:ok, malformed} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     malformed_reference,
                     "2026-05-20T12:05:00Z"
                   )
                 )

        assert {:ok, retained} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     :omitted,
                     "2026-05-21T12:05:00Z"
                   )
                 )

        assert retained.id == malformed.id
        assert retained.click_session_id == nil
        assert retained.public_click_id == nil
        assert retained.network_click_ref == malformed_reference
        assert retained.attribution_confidence == :unmatched
      end
    end

    test "replaces malformed CJ, Awin, and Rakuten evidence with corrected or blank references" do
      for %{provider: provider, network: network, ingest: ingest, reference_keys: reference_keys} <-
            adapter_click_reference_update_cases(),
          provider != :impact,
          reference_key <- reference_keys do
        merchant = merchant_fixture()
        commerce_link = adapter_commerce_link_fixture(merchant, network)
        click_session = click_session_fixture(commerce_link)
        conversion_ref = "#{provider}-corrected-#{System.unique_integer([:positive])}"
        malformed_reference = "malformed-#{provider}-publisher-reference"

        assert {:ok, malformed} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     malformed_reference,
                     "2026-05-20T12:05:00Z"
                   )
                 )

        assert malformed.click_session_id == nil
        assert malformed.public_click_id == nil
        assert malformed.network_click_ref == malformed_reference
        assert malformed.attribution_confidence == :unmatched

        assert {:ok, corrected} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     provider_click_reference(provider, click_session.click_id),
                     "2026-05-21T12:05:00Z"
                   )
                 )

        assert corrected.id == malformed.id
        assert corrected.click_session_id == click_session.id
        assert corrected.public_click_id == click_session.click_id
        assert corrected.network_click_ref == nil
        assert corrected.attribution_confidence == :high

        assert {:ok, cleared} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     " ",
                     "2026-05-22T12:05:00Z"
                   )
                 )

        assert cleared.id == malformed.id
        assert cleared.click_session_id == nil
        assert cleared.public_click_id == nil
        assert cleared.network_click_ref == nil
        assert cleared.attribution_confidence == :unmatched
      end
    end

    test "preserves omitted click references and clears explicitly blank or nil click references" do
      for %{provider: provider, network: network, ingest: ingest, reference_keys: reference_keys} <-
            adapter_click_reference_update_cases(),
          reference_key <- reference_keys do
        merchant = merchant_fixture()
        commerce_link = adapter_commerce_link_fixture(merchant, network)
        click_session = click_session_fixture(commerce_link)

        conversion_ref = "#{provider}-omitted-#{System.unique_integer([:positive])}"

        initial_payload =
          adapter_update_payload(
            provider,
            conversion_ref,
            reference_key,
            provider_click_reference(provider, click_session.click_id),
            "2026-05-20T12:05:00Z"
          )

        assert {:ok, inserted} = ingest.(initial_payload)
        assert inserted.click_session_id == click_session.id
        assert inserted.public_click_id == click_session.click_id

        assert {:ok, omitted_reference_update} =
                 ingest.(
                   adapter_update_payload(
                     provider,
                     conversion_ref,
                     reference_key,
                     :omitted,
                     "2026-05-21T12:05:00Z"
                   )
                 )

        assert omitted_reference_update.id == inserted.id
        assert omitted_reference_update.click_session_id == click_session.id
        assert omitted_reference_update.public_click_id == click_session.click_id

        for blank_reference <- [nil, "", " \t "] do
          conversion_ref = "#{provider}-blank-#{System.unique_integer([:positive])}"

          assert {:ok, inserted} =
                   ingest.(
                     adapter_update_payload(
                       provider,
                       conversion_ref,
                       reference_key,
                       provider_click_reference(provider, click_session.click_id),
                       "2026-05-20T12:05:00Z"
                     )
                   )

          assert {:ok, cleared_reference_update} =
                   ingest.(
                     adapter_update_payload(
                       provider,
                       conversion_ref,
                       reference_key,
                       blank_reference,
                       "2026-05-21T12:05:00Z"
                     )
                   )

          assert cleared_reference_update.id == inserted.id
          assert cleared_reference_update.click_session_id == nil
          assert cleared_reference_update.public_click_id == nil
          assert cleared_reference_update.merchant_id == nil
          assert cleared_reference_update.affiliate_program_id == nil
          assert cleared_reference_update.attribution_confidence == :unmatched

          if provider == :impact do
            assert cleared_reference_update.network_click_ref ==
                     "impact-network-click-#{conversion_ref}"
          end
        end
      end
    end
  end

  describe "focused adapter evidence boundaries" do
    test "normalizes numeric provider conversion identifiers to strings" do
      cases = [
        {&ImpactAdapter.ingest_action/1, 8_100_001,
         %{
           "ActionId" => 8_100_001,
           "Status" => "PENDING",
           "Currency" => "USD",
           "ReportingDate" => "2026-05-20T12:05:00Z"
         }},
        {&CJAdapter.ingest_transaction/1, 8_100_002,
         %{
           "commissionId" => 8_100_002,
           "actionStatus" => "NEW",
           "currency" => "USD",
           "postingDate" => "2026-05-20T12:05:00Z"
         }},
        {&AwinAdapter.ingest_transaction/1, 8_100_003,
         %{
           "id" => 8_100_003,
           "commissionStatus" => "pending",
           "commissionAmount" => %{"amount" => "2.50", "currency" => "USD"},
           "validationDate" => "2026-05-20T12:05:00Z"
         }},
        {&RakutenAdapter.ingest_transaction/1, 8_100_004,
         %{
           "transactionId" => 8_100_004,
           "status" => "pending",
           "currency" => "USD",
           "processDate" => "2026-05-20T12:05:00Z"
         }}
      ]

      for {ingest, provider_id, payload} <- cases do
        assert {:ok, conversion} = ingest.(payload)
        assert conversion.network_conversion_ref == Integer.to_string(provider_id)
      end
    end

    test "keeps unsupported provider merchant product fields out of internal attribution" do
      cases = [
        {&CJAdapter.ingest_transaction/1,
         %{
           "commissionId" => "cj-commission-#{System.unique_integer([:positive])}",
           "actionStatus" => "NEW",
           "currency" => "USD",
           "saleAmount" => "25.00",
           "commissionAmount" => "2.50",
           "eventDate" => "2026-05-20T12:00:00Z",
           "postingDate" => "2026-05-20T12:05:00Z",
           "merchantProductId" => 9_999_999
         }, "merchantProductId"},
        {&AwinAdapter.ingest_transaction/1,
         %{
           id: "awin-transaction-#{System.unique_integer([:positive])}",
           commission_status: :pending,
           sale_amount: %{amount: "25.00", currency: "USD"},
           commission_amount: %{amount: "2.50", currency: "USD"},
           transaction_date: ~U[2026-05-20 12:00:00Z],
           validation_date: ~U[2026-05-20 12:05:00Z],
           merchant_product_id: 9_999_999
         }, "merchant_product_id"},
        {&RakutenAdapter.ingest_transaction/1,
         %{
           "transactionId" => "rakuten-transaction-#{System.unique_integer([:positive])}",
           "status" => "pending",
           "currency" => "USD",
           "saleAmount" => "25.00",
           "commissionAmount" => "2.50",
           "transactionDate" => "2026-05-20T12:00:00Z",
           "processDate" => "2026-05-20T12:05:00Z",
           "MerchantProductId" => 9_999_999
         }, "MerchantProductId"}
      ]

      for {ingest, payload, raw_key} <- cases do
        assert {:ok, conversion} = ingest.(payload)
        assert conversion.merchant_product_id == nil
        assert conversion.raw_payload[raw_key] == 9_999_999
      end
    end
  end

  describe "ingest_conversion/1" do
    test "resolves a configured custom network code through affiliate_networks" do
      {:ok, network} =
        Affiliate.upsert_network(%{code: "partnerize", name: "Partnerize"})

      assert {:ok, conversion} =
               CommerceAttribution.ingest_conversion(%{
                 source_network: "  PARTNERIZE  ",
                 network_conversion_ref:
                   "partnerize-conversion-#{System.unique_integer([:positive])}",
                 status: :approved,
                 currency: "USD",
                 order_amount: Decimal.new("75.00"),
                 commission_amount: Decimal.new("7.50"),
                 reported_at: ~U[2026-05-20 12:00:00.000000Z]
               })

      assert conversion.affiliate_network_id == network.id

      assert %{
               "filters" => %{"network" => "partnerize"},
               "metrics" => %{
                 "commission_revenue" => "7.50",
                 "conversions" => 1,
                 "gross_order_value" => "75.00"
               }
             } = CommerceAttribution.network_revenue_summary(" PARTNERIZE ")
    end

    test "rejects an unconfigured affiliate network code" do
      assert {:error, changeset} =
               CommerceAttribution.ingest_conversion(%{
                 source_network: "unconfigured_network",
                 network_conversion_ref:
                   "unconfigured-conversion-#{System.unique_integer([:positive])}",
                 status: :approved,
                 currency: "USD",
                 reported_at: ~U[2026-05-20 12:00:00.000000Z]
               })

      assert "is not configured as an affiliate network" in errors_on(changeset).source_network

      assert_raise ArgumentError, "invalid revenue summary network", fn ->
        CommerceAttribution.network_revenue_summary("unconfigured_network")
      end
    end

    test "accepts string-keyed integration attributes through attribution resolution" do
      merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      attrs = %{
        "source_network" => "impact",
        "network_conversion_ref" =>
          "string-keyed-conversion-#{System.unique_integer([:positive])}",
        "public_click_id" => click_session.click_id,
        "status" => "pending",
        "currency" => "USD",
        "order_amount" => "100.00",
        "commission_amount" => "10.00",
        "reported_at" => "2026-05-20T12:00:00.000000Z"
      }

      assert {:ok, conversion} = CommerceAttribution.ingest_conversion(attrs)
      assert conversion.click_session_id == click_session.id
      assert conversion.merchant_id == merchant.id
      assert conversion.attribution_confidence == :high
    end

    test "updates status and attribution confidence back to schema defaults" do
      attrs = %{
        source_network: "impact",
        network_conversion_ref: "conversion-#{System.unique_integer([:positive])}",
        status: :approved,
        currency: "USD",
        attribution_confidence: :high,
        reported_at: ~U[2026-05-20 12:00:00.000000Z]
      }

      {:ok, inserted} = CommerceAttribution.ingest_conversion(attrs)

      {:ok, updated} =
        CommerceAttribution.ingest_conversion(%{
          attrs
          | status: :pending,
            attribution_confidence: :unmatched,
            reported_at: ~U[2026-05-21 12:00:00.000000Z]
        })

      assert updated.id == inserted.id
      assert updated.status == :pending
      assert updated.attribution_confidence == :unmatched
    end
  end

  describe "create_purchase_price_fact/1" do
    test "stores one price-paid fact per conversion" do
      conversion = conversion_fixture()

      {:ok, fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: conversion.id,
          reported_paid_price: Decimal.new("129.99"),
          shipping_amount: Decimal.new("0.00"),
          tax_amount: Decimal.new("10.40"),
          discount_amount: Decimal.new("5.00"),
          currency: "usd"
        })

      assert fact.conversion_id == conversion.id
      assert fact.currency == "USD"
      assert Decimal.equal?(fact.reported_paid_price, Decimal.new("129.99"))

      assert {:error, changeset} =
               CommerceAttribution.create_purchase_price_fact(%{
                 conversion_id: conversion.id,
                 reported_paid_price: Decimal.new("120.00"),
                 currency: "USD"
               })

      assert "has already been taken" in errors_on(changeset).conversion_id
      assert Repo.aggregate(PurchasePriceFact, :count, :id) == 1
    end
  end

  describe "revenue dashboard summaries" do
    test "returns an empty JSON-ready dashboard contract" do
      assert CommerceAttribution.dashboard_revenue_summary() == %{
               "filters" => %{
                 "currency" => nil,
                 "from" => nil,
                 "merchant_id" => nil,
                 "network" => nil,
                 "product_id" => nil,
                 "to" => nil
               },
               "metrics" => %{
                 "average_paid_price" => nil,
                 "clicks" => 0,
                 "commission_revenue" => "0.00",
                 "conversions" => 0,
                 "currency" => nil,
                 "gross_order_value" => "0.00"
               }
             }
    end

    test "aggregates approved and paid conversions for merchant product and network summaries" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)
      _unconverted_click_session = click_session_fixture(commerce_link)

      approved =
        conversion_fixture(%{
          click_session_id: click_session.id,
          public_click_id: click_session.click_id,
          source_network: "impact",
          merchant_id: merchant.id,
          product_id: product.id,
          merchant_product_id: merchant_product.id,
          status: :approved,
          order_amount: Decimal.new("120.00"),
          commission_amount: Decimal.new("12.00"),
          reported_at: ~U[2026-05-20 12:00:00.000000Z]
        })

      paid =
        conversion_fixture(%{
          source_network: "impact",
          merchant_id: merchant.id,
          product_id: product.id,
          merchant_product_id: merchant_product.id,
          status: :paid,
          order_amount: Decimal.new("180.00"),
          commission_amount: Decimal.new("18.00"),
          reported_at: ~U[2026-05-21 12:00:00.000000Z]
        })

      _pending =
        conversion_fixture(%{
          source_network: "impact",
          merchant_id: merchant.id,
          product_id: product.id,
          status: :pending,
          order_amount: Decimal.new("999.00"),
          commission_amount: Decimal.new("99.00"),
          reported_at: ~U[2026-05-21 13:00:00.000000Z]
        })

      {:ok, _fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: approved.id,
          reported_paid_price: Decimal.new("100.00"),
          currency: "USD"
        })

      {:ok, _fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: paid.id,
          reported_paid_price: Decimal.new("200.00"),
          currency: "USD"
        })

      expected_metrics = %{
        "average_paid_price" => "150.00",
        "clicks" => 2,
        "commission_revenue" => "30.00",
        "conversions" => 2,
        "currency" => "USD",
        "gross_order_value" => "300.00"
      }

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.merchant_revenue_summary(merchant.id, network: "impact")

      assert %{"metrics" => %{"clicks" => 1, "conversions" => 2}} =
               CommerceAttribution.product_revenue_summary(product.id, network: "impact")

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.network_revenue_summary("impact", merchant_id: merchant.id)
    end

    test "uses merchant product dimensions for adapter-ingested conversions" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      {:ok, conversion} =
        ImpactAdapter.ingest_action(%{
          "ActionId" => "impact-summary-#{System.unique_integer([:positive])}",
          "SubId1" => click_session.click_id,
          "Status" => "APPROVED",
          "Currency" => "USD",
          "SaleAmount" => "75.00",
          "Payout" => "7.50",
          "ReportingDate" => "2026-05-21T12:00:00Z",
          "MerchantProductId" => merchant_product.id
        })

      {:ok, _fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: conversion.id,
          reported_paid_price: Decimal.new("72.00"),
          currency: "USD"
        })

      expected_metrics = %{
        "average_paid_price" => "72.00",
        "clicks" => 1,
        "commission_revenue" => "7.50",
        "conversions" => 1,
        "currency" => "USD",
        "gross_order_value" => "75.00"
      }

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.merchant_revenue_summary(merchant.id)

      assert %{"metrics" => ^expected_metrics} =
               CommerceAttribution.product_revenue_summary(product.id)
    end

    test "counts tracked merchant-product clicks before conversion attribution exists" do
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{product: product})

      assert {:ok, tracked_click} =
               CommerceAttribution.track_outbound_click(%{
                 merchant_product_id: merchant_product.id
               })

      assert tracked_click.click_session.merchant_product_id == merchant_product.id

      assert %{
               "metrics" => %{
                 "clicks" => 1,
                 "conversions" => 0,
                 "currency" => nil,
                 "gross_order_value" => "0.00"
               }
             } = CommerceAttribution.product_revenue_summary(product.id)
    end

    test "requires a currency filter before aggregating mixed-currency money" do
      conversion_fixture(%{
        status: :approved,
        currency: "USD",
        order_amount: Decimal.new("100.00"),
        commission_amount: Decimal.new("10.00"),
        reported_at: ~U[2026-05-20 12:00:00.000000Z]
      })

      conversion_fixture(%{
        status: :approved,
        currency: "EUR",
        order_amount: Decimal.new("90.00"),
        commission_amount: Decimal.new("9.00"),
        reported_at: ~U[2026-05-20 13:00:00.000000Z]
      })

      {_error, queries} =
        capture_select_queries(fn ->
          assert_raise ArgumentError,
                       "revenue summary currency filter is required for mixed currencies",
                       fn -> CommerceAttribution.dashboard_revenue_summary() end
        end)

      currency_probe_query = Enum.find(queries, &currency_probe_query?/1)
      assert currency_probe_query
      assert String.contains?(String.upcase(currency_probe_query), "LIMIT")

      assert %{
               "filters" => %{"currency" => "USD"},
               "metrics" => %{
                 "commission_revenue" => "10.00",
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "100.00"
               }
             } = CommerceAttribution.dashboard_revenue_summary(currency: "usd")
    end

    test "counts network clicks from conversion source for a non-affiliate link" do
      merchant = merchant_fixture()

      commerce_link =
        commerce_link_fixture(%{merchant: merchant, link_type: :non_affiliate, network: nil})

      click_session = click_session_fixture(commerce_link)

      conversion_fixture(%{
        click_session_id: click_session.id,
        public_click_id: click_session.click_id,
        source_network: "impact",
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("80.00"),
        commission_amount: Decimal.new("8.00"),
        reported_at: ~U[2026-05-21 12:00:00.000000Z]
      })

      assert %{
               "metrics" => %{
                 "clicks" => 1,
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "80.00"
               }
             } = CommerceAttribution.network_revenue_summary("impact", merchant_id: merchant.id)
    end

    test "rejects a conversion network that conflicts with the link's affiliate program" do
      merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      assert {:error, changeset} =
               CommerceAttribution.ingest_conversion(%{
                 click_session_id: click_session.id,
                 public_click_id: click_session.click_id,
                 source_network: "awin",
                 network_conversion_ref: "conversion-#{System.unique_integer([:positive])}",
                 merchant_id: merchant.id,
                 status: :pending,
                 currency: "USD",
                 order_amount: Decimal.new("100.00"),
                 commission_amount: Decimal.new("10.00"),
                 attribution_confidence: :unmatched,
                 reported_at: ~U[2026-05-21 12:00:00.000000Z]
               })

      assert "does not match resolved click" in errors_on(changeset).affiliate_network_id

      assert %{"metrics" => %{"clicks" => 1, "conversions" => 0, "currency" => nil}} =
               CommerceAttribution.network_revenue_summary("impact", merchant_id: merchant.id)

      assert %{"metrics" => %{"clicks" => 0, "conversions" => 0, "currency" => nil}} =
               CommerceAttribution.network_revenue_summary("awin", merchant_id: merchant.id)
    end

    test "counts attributed clicks even when conversions are not revenue-statused" do
      merchant = merchant_fixture()
      product = SpecsFixtures.product_fixture()
      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

      commerce_link =
        commerce_link_fixture(%{merchant: merchant, link_type: :non_affiliate, network: nil})

      click_session = click_session_fixture(commerce_link)

      conversion_fixture(%{
        click_session_id: click_session.id,
        public_click_id: click_session.click_id,
        source_network: "impact",
        merchant_id: merchant.id,
        merchant_product_id: merchant_product.id,
        status: :pending,
        reported_at: ~U[2026-05-21 12:00:00.000000Z]
      })

      assert %{"metrics" => %{"clicks" => 1, "conversions" => 0, "currency" => nil}} =
               CommerceAttribution.network_revenue_summary("impact", merchant_id: merchant.id)

      assert %{"metrics" => %{"clicks" => 1, "conversions" => 0, "currency" => nil}} =
               CommerceAttribution.product_revenue_summary(product.id)
    end

    test "filters conversion date ranges with inclusive UTC calendar boundaries" do
      merchant = merchant_fixture()

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("42.00"),
        commission_amount: Decimal.new("4.20"),
        reported_at: ~U[2026-05-21 23:59:59.000000Z]
      })

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("999.00"),
        commission_amount: Decimal.new("99.90"),
        reported_at: ~U[2026-05-22 00:00:00.000000Z]
      })

      assert %{
               "filters" => %{"from" => "2026-05-21", "to" => "2026-05-21"},
               "metrics" => %{
                 "commission_revenue" => "4.20",
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "42.00"
               }
             } =
               CommerceAttribution.dashboard_revenue_summary(%{
                 merchant_id: merchant.id,
                 from: ~D[2026-05-21],
                 to: ~D[2026-05-21]
               })
    end

    test "normalizes DateTime filters to UTC before extracting calendar dates" do
      merchant = merchant_fixture()

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("31.00"),
        commission_amount: Decimal.new("3.10"),
        reported_at: ~U[2026-05-20 12:00:00.000000Z]
      })

      conversion_fixture(%{
        merchant_id: merchant.id,
        status: :approved,
        order_amount: Decimal.new("44.00"),
        commission_amount: Decimal.new("4.40"),
        reported_at: ~U[2026-05-21 04:00:00.000000Z]
      })

      assert %{
               "filters" => %{"from" => "2026-05-21"},
               "metrics" => %{
                 "commission_revenue" => "4.40",
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "44.00"
               }
             } =
               CommerceAttribution.dashboard_revenue_summary(%{
                 merchant_id: merchant.id,
                 from: pacific_datetime(2026, 5, 20, 20, 30, 0)
               })
    end

    test "rejects invalid summary identifiers, networks, and currencies" do
      oversized_id = 9_223_372_036_854_775_808

      assert_raise ArgumentError, "invalid revenue summary merchant_id", fn ->
        CommerceAttribution.dashboard_revenue_summary(merchant_id: 0)
      end

      assert_raise ArgumentError, "invalid revenue summary merchant_id", fn ->
        CommerceAttribution.dashboard_revenue_summary(merchant_id: oversized_id)
      end

      assert_raise ArgumentError, "invalid revenue summary product_id", fn ->
        CommerceAttribution.dashboard_revenue_summary(product_id: "not-an-id")
      end

      assert_raise ArgumentError, "invalid revenue summary network", fn ->
        CommerceAttribution.network_revenue_summary("unknown_network")
      end

      assert_raise ArgumentError, "invalid revenue summary currency", fn ->
        CommerceAttribution.dashboard_revenue_summary(currency: "US")
      end
    end

    test "returns one-conversion dashboard metrics without suppression" do
      merchant = merchant_fixture()
      commerce_link = commerce_link_fixture(%{merchant: merchant, network: "impact"})
      click_session = click_session_fixture(commerce_link)

      conversion =
        conversion_fixture(%{
          source_network: "impact",
          click_session_id: click_session.id,
          public_click_id: click_session.click_id,
          merchant_id: merchant.id,
          status: :approved,
          order_amount: Decimal.new("90.00"),
          commission_amount: Decimal.new("9.00"),
          reported_at: ~U[2026-05-21 12:00:00.000000Z]
        })

      {:ok, _fact} =
        CommerceAttribution.create_purchase_price_fact(%{
          conversion_id: conversion.id,
          reported_paid_price: Decimal.new("90.00"),
          currency: "USD"
        })

      assert CommerceAttribution.dashboard_revenue_summary(%{
               merchant_id: merchant.id
             }) == %{
               "filters" => %{
                 "currency" => nil,
                 "from" => nil,
                 "merchant_id" => merchant.id,
                 "network" => nil,
                 "product_id" => nil,
                 "to" => nil
               },
               "metrics" => %{
                 "average_paid_price" => "90.00",
                 "clicks" => 1,
                 "commission_revenue" => "9.00",
                 "conversions" => 1,
                 "currency" => "USD",
                 "gross_order_value" => "90.00"
               }
             }
    end
  end

  defp adapter_click_reference_update_cases do
    [
      %{
        provider: :cj,
        network: "cj",
        ingest: &CJAdapter.ingest_transaction/1,
        reference_keys: [:sid, "SID", "sid"]
      },
      %{
        provider: :impact,
        network: "impact",
        ingest: &ImpactAdapter.ingest_action/1,
        reference_keys: [:sub_id1, "SubId1", "subId1"]
      },
      %{
        provider: :awin,
        network: "awin",
        ingest: &AwinAdapter.ingest_transaction/1,
        reference_keys: [:click_ref, "clickRef", "ClickRef"]
      },
      %{
        provider: :rakuten,
        network: "rakuten",
        ingest: &RakutenAdapter.ingest_transaction/1,
        reference_keys: [:member_id, "member ID", "Member ID", :u1, "u1"]
      }
    ]
  end

  defp adapter_commerce_link_fixture(merchant, "cj") do
    affiliate_program =
      affiliate_program_fixture(%{
        affiliate_network: Repo.get_by!(AffiliateNetwork, code: "cj"),
        merchant: merchant
      })

    commerce_link_fixture(%{merchant: merchant, affiliate_program_id: affiliate_program.id})
  end

  defp adapter_commerce_link_fixture(merchant, network),
    do: commerce_link_fixture(%{merchant: merchant, network: network})

  defp adapter_update_payload(:cj, conversion_ref, reference_key, reference, reported_at) do
    %{
      "commissionId" => conversion_ref,
      "actionStatus" => "APPROVED",
      "currency" => "USD",
      "postingDate" => reported_at
    }
    |> put_publisher_reference(reference_key, reference)
  end

  defp adapter_update_payload(:impact, conversion_ref, reference_key, reference, reported_at) do
    %{
      "ActionId" => conversion_ref,
      "ClickId" => "impact-network-click-#{conversion_ref}",
      "Status" => "APPROVED",
      "Currency" => "USD",
      "ReportingDate" => reported_at
    }
    |> put_publisher_reference(reference_key, reference)
  end

  defp adapter_update_payload(:awin, conversion_ref, reference_key, reference, reported_at) do
    %{
      "id" => conversion_ref,
      "commissionStatus" => "approved",
      "saleAmount" => %{"amount" => "92.50", "currency" => "USD"},
      "commissionAmount" => %{"amount" => "9.25", "currency" => "USD"},
      "validationDate" => reported_at
    }
    |> put_publisher_reference(reference_key, reference)
  end

  defp adapter_update_payload(:rakuten, conversion_ref, reference_key, reference, reported_at) do
    %{
      "transactionId" => conversion_ref,
      "status" => "approved",
      "currency" => "USD",
      "processDate" => reported_at
    }
    |> put_publisher_reference(reference_key, reference)
  end

  defp put_publisher_reference(payload, _reference_key, :omitted), do: payload

  defp put_publisher_reference(payload, reference_key, reference),
    do: Map.put(payload, reference_key, reference)

  defp provider_click_reference(:rakuten, click_id), do: String.replace(click_id, "-", "")
  defp provider_click_reference(_provider, click_id), do: click_id

  defp conversion_fixture(attrs \\ %{}) do
    {:ok, conversion} =
      attrs
      |> Map.put_new(:source_network, "impact")
      |> Map.put_new(:network_conversion_ref, "conversion-#{System.unique_integer([:positive])}")
      |> Map.put_new(:status, :pending)
      |> Map.put_new(:currency, "USD")
      |> Map.put_new(:order_amount, Decimal.new("100.00"))
      |> Map.put_new(:commission_amount, Decimal.new("10.00"))
      |> Map.put_new(:attribution_confidence, :unmatched)
      |> Map.put_new(:reported_at, ~U[2026-05-20 12:00:00.000000Z])
      |> CommerceAttribution.ingest_conversion()

    conversion
  end

  defp click_session_fixture(commerce_link) do
    {:ok, click_session} =
      CommerceAttribution.create_click_session(%{
        commerce_link_id: commerce_link.id,
        click_id: Ecto.UUID.generate(),
        anonymous_id: "anon-#{System.unique_integer([:positive])}",
        source_surface: :web
      })

    click_session
  end

  defp commerce_link_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])
    merchant_id = commerce_link_merchant_id(attrs)
    link_type = Map.get(attrs, :link_type, :affiliate)

    {:ok, commerce_link} =
      attrs
      |> Map.drop([:merchant, :network])
      |> Map.put_new(:merchant_id, merchant_id)
      |> Map.put_new(:destination_url, "https://merchant.example.com/products/#{suffix}")
      |> Map.put_new(:link_type, link_type)
      |> put_fixture_affiliate_program(link_type, merchant_id, Map.get(attrs, :network, "impact"))
      |> CommerceAttribution.upsert_commerce_link()

    commerce_link
  end

  defp commerce_link_merchant_id(attrs) do
    case Map.fetch(attrs, :merchant_id) do
      {:ok, merchant_id} -> merchant_id
      :error -> attrs |> Map.get_lazy(:merchant, &merchant_fixture/0) |> Map.fetch!(:id)
    end
  end

  defp put_fixture_affiliate_program(attrs, :affiliate, merchant_id, network)
       when not is_nil(network) do
    if Map.has_key?(attrs, :affiliate_program_id) do
      attrs
    else
      network_name =
        network
        |> String.replace("_", " ")
        |> String.split()
        |> Enum.map_join(" ", &String.capitalize/1)

      {:ok, affiliate_network} = Affiliate.upsert_network(%{name: network_name})

      {:ok, affiliate_program} =
        Affiliate.upsert_program(%{
          affiliate_network_id: affiliate_network.id,
          merchant_id: merchant_id
        })

      Map.put(attrs, :affiliate_program_id, affiliate_program.id)
    end
  end

  defp put_fixture_affiliate_program(attrs, _link_type, _merchant_id, _network), do: attrs

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

  defp affiliate_network_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    {:ok, affiliate_network} =
      attrs
      |> Map.put_new(:name, "Affiliate Network #{suffix}")
      |> Affiliate.upsert_network()

    affiliate_network
  end

  defp affiliate_program_fixture(attrs) do
    affiliate_network =
      Map.get_lazy(attrs, :affiliate_network, fn -> affiliate_network_fixture() end)

    merchant = Map.get_lazy(attrs, :merchant, fn -> merchant_fixture() end)

    {:ok, affiliate_program} =
      attrs
      |> Map.drop([:affiliate_network, :merchant])
      |> Map.put_new(:affiliate_network_id, affiliate_network.id)
      |> Map.put_new(:merchant_id, merchant.id)
      |> Affiliate.upsert_program()

    affiliate_program
  end

  defp pacific_datetime(year, month, day, hour, minute, second) do
    DateTime.new!(
      Date.new!(year, month, day),
      Time.new!(hour, minute, second),
      "America/Los_Angeles",
      PacificTimeZoneDatabase
    )
  end

  defp currency_probe_query?(query) when is_binary(query) do
    String.contains?(query, "DISTINCT") and
      String.contains?(query, ~s("currency_id")) and
      String.contains?(query, ~s(FROM "commerce_conversions"))
  end
end
