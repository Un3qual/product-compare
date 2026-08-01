defmodule ProductCompare.DevSeeds.Operations do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  @cj_source_attrs %{
    kind: "affiliate_feed",
    provider: "cj",
    name: "CJ",
    domain: "cj.com"
  }

  @cj_stage_scenarios [
    {:new, "New advertiser"},
    {:considering, "Considering advertiser"},
    {:selected, "Selected advertiser"},
    {:applied, "Applied advertiser"},
    {:accepted, "Accepted advertiser"},
    {:not_pursuing, "Not-pursuing advertiser"},
    {:declined, "Declined advertiser"}
  ]
  @cj_stage_indexes @cj_stage_scenarios
                    |> Enum.with_index(1)
                    |> Map.new(fn {{stage, _label}, index} -> {stage, index} end)

  @spec seed!(map(), map(), map(), DateTime.t()) :: map()
  def seed!(accounts, catalog, marketplace, %DateTime{} = anchor) do
    source = seed_cj_source!()
    {programs, feeds} = seed_cj_programs_and_feeds!(source, anchor)
    runs = seed_import_runs!(source, anchor)
    commerce = seed_commerce!(accounts, catalog, marketplace, anchor)

    %{
      cj_source: source,
      cj_programs: programs,
      cj_feeds: feeds,
      import_runs: runs,
      commerce: commerce
    }
  end

  defp seed_cj_source! do
    source =
      Repo.get_by(Source, kind: @cj_source_attrs.kind, name: @cj_source_attrs.name) || %Source{}

    source
    |> Source.changeset(@cj_source_attrs)
    |> Repo.insert_or_update()
    |> Support.expect!("synthetic CJ source")
  end

  defp seed_cj_programs_and_feeds!(source, anchor) do
    {programs, feeds} =
      @cj_stage_scenarios
      |> Enum.map(fn {stage, label} ->
        suffix = stage |> Atom.to_string() |> String.upcase()

        feed =
          Ingestion.upsert_merchant_feed_candidate(source, %{
            provider: "cj",
            provider_feed_id: "DEV-CJ-FEED-#{suffix}",
            advertiser_id: "DEV-CJ-ADV-#{suffix}",
            advertiser_name: "Development #{label}",
            advertiser_country: "US",
            source_feed_type: "SHOPPING",
            currency: "USD",
            language: "EN",
            feed_name: "Development #{label} product feed",
            product_count: 100 + stage_index(stage),
            provider_last_updated_at: hours(anchor, -stage_index(stage)),
            last_seen_at: anchor,
            raw_metadata: %{
              "synthetic" => true,
              "seedScenario" => "development-#{stage}"
            }
          })
          |> Support.expect!("synthetic CJ feed #{stage}")

        program = Repo.get!(CJProgram, feed.cj_program_id)

        note = "Synthetic development lifecycle example: #{stage}"

        program =
          if program.stage == stage and program.note == note do
            program
          else
            Ingestion.update_cj_program_lifecycle(
              program.entropy_id,
              %{stage: stage, note: note},
              hours(anchor, -stage_index(stage))
            )
            |> Support.expect!("synthetic CJ program #{stage}")
          end

        {stage, program, feed}
      end)
      |> Enum.reduce({%{}, %{}}, fn {stage, program, feed}, {programs, feeds} ->
        {Map.put(programs, stage, program), Map.put(feeds, stage, feed)}
      end)

    unmatched =
      Ingestion.upsert_merchant_feed_candidate(source, %{
        provider: "cj",
        provider_feed_id: "DEV-CJ-FEED-UNMATCHED",
        advertiser_id: "",
        advertiser_name: "Development unmatched advertiser",
        advertiser_country: "US",
        source_feed_type: "SHOPPING",
        currency: "USD",
        language: "EN",
        feed_name: "Development unmatched product feed",
        product_count: 12,
        provider_last_updated_at: hours(anchor, -8),
        last_seen_at: anchor,
        raw_metadata: %{
          "synthetic" => true,
          "seedScenario" => "development-unmatched"
        }
      })
      |> Support.expect!("synthetic unmatched CJ feed")

    unmatched =
      unmatched
      |> MerchantFeedCandidate.changeset(%{advertiser_id: nil, cj_program_id: nil})
      |> Repo.update()
      |> Support.expect!("restore synthetic unmatched CJ feed identity")

    {programs, Map.put(feeds, :unmatched, unmatched)}
  end

  defp seed_import_runs!(source, anchor) do
    scenarios = [
      {:products_succeeded, "shoppingProducts", :succeeded, "development-products-succeeded"},
      {:products_failed, "shoppingProducts", :failed, "development-products-failed"},
      {:feeds_succeeded, "shoppingProductFeeds", :succeeded, "development-feeds-succeeded"},
      {:feeds_failed, "shoppingProductFeeds", :failed, "development-feeds-failed"}
    ]

    scenario_names = Enum.map(scenarios, fn {_key, _surface, _status, name} -> name end)

    ImportRun
    |> where([run], run.source_id == ^source.id)
    |> where([run], fragment("?->>'seedScenario'", run.query) in ^scenario_names)
    |> Repo.all()
    |> Enum.each(fn run ->
      Repo.delete(run)
      |> Support.expect!("delete synthetic import run #{run.query["seedScenario"]}")
    end)

    scenarios
    |> Enum.with_index(1)
    |> Map.new(fn {{key, surface, status, scenario}, index} ->
      started_at = hours(anchor, -(index * 6))

      run =
        Ingestion.start_import_run(%{
          source_id: source.id,
          provider: "cj",
          surface: surface,
          query: %{
            "seedScenario" => scenario,
            "synthetic" => true,
            "advertiserCountry" => "US"
          },
          started_at: started_at,
          cursor_start: 0,
          page_size: 100,
          pages_requested: 1
        })
        |> Support.expect!("start synthetic import run #{scenario}")

      completion_attrs =
        case status do
          :succeeded ->
            %{
              status: :succeeded,
              finished_at: DateTime.add(started_at, 120, :second),
              cursor_end: 100,
              pages_fetched: 1,
              records_fetched: 24,
              records_normalized: 24,
              records_persisted: 23,
              records_failed: 1
            }

          :failed ->
            %{
              status: :failed,
              finished_at: DateTime.add(started_at, 45, :second),
              cursor_end: 0,
              pages_fetched: 0,
              records_fetched: 0,
              records_normalized: 0,
              records_persisted: 0,
              records_failed: 1,
              error_summary:
                "Synthetic development failure; no provider request was made and no credential was used."
            }
        end

      completed =
        Ingestion.complete_import_run(run, completion_attrs)
        |> Support.expect!("complete synthetic import run #{scenario}")

      {key, completed}
    end)
  end

  defp seed_commerce!(accounts, catalog, marketplace, anchor) do
    affiliate = marketplace.affiliate
    merchants = marketplace.merchants
    offers = marketplace.offers

    links = %{
      example_mart:
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchants.example_mart.id,
          affiliate_program_id: affiliate.active_program.id,
          destination_url: "https://examplemart.test/development/checkout",
          link_type: :affiliate,
          campaign_params: %{"campaign" => "development-seed"},
          is_active: true
        })
        |> Support.expect!("ExampleMart commerce link"),
      value_vision:
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: merchants.value_vision.id,
          affiliate_program_id: affiliate.paused_program.id,
          destination_url: "https://valuevision.test/development/checkout",
          link_type: :affiliate,
          campaign_params: %{"campaign" => "development-seed"},
          is_active: true
        })
        |> Support.expect!("ValueVision commerce link")
    }

    click_scenarios = [
      {:approved, "00000000-0000-4000-8000-000000000001", links.example_mart, offers.fresh},
      {:pending, "00000000-0000-4000-8000-000000000002", links.example_mart, offers.out_of_stock},
      {:reversed, "00000000-0000-4000-8000-000000000003", links.example_mart, offers.stale},
      {:paid, "00000000-0000-4000-8000-000000000004", links.value_vision, offers.inactive}
    ]

    clicks =
      Map.new(click_scenarios, fn {status, click_id, link, offer} ->
        attrs = %{
          click_id: click_id,
          commerce_link_id: link.id,
          merchant_product_id: offer.id,
          user_id: accounts.shopper.id,
          anonymous_id: "development-shopper-#{status}",
          source_surface: :web,
          referrer: "http://localhost:4000/offers",
          user_agent_hash: "synthetic-development-agent",
          ip_hash: "synthetic-development-ip"
        }

        click =
          case Repo.get_by(CommerceClickSession, click_id: click_id) do
            nil ->
              CommerceAttribution.create_click_session(attrs)

            click ->
              click
              |> CommerceClickSession.changeset(attrs)
              |> Repo.update()
          end
          |> Support.expect!("commerce click #{status}")

        {status, click}
      end)

    attribution_dimensions =
      Map.new(click_scenarios, fn {status, _click_id, link, offer} ->
        {status, {link, offer}}
      end)

    conversion_scenarios = [
      {:approved, "DEV-CONV-APPROVED", "649.99", "65.00", days(anchor, -4)},
      {:pending, "DEV-CONV-PENDING", "1199.99", "120.00", days(anchor, -3)},
      {:reversed, "DEV-CONV-REVERSED", "849.99", "85.00", days(anchor, -2)},
      {:paid, "DEV-CONV-PAID", "1149.99", "80.00", days(anchor, -1)}
    ]

    conversions =
      Map.new(conversion_scenarios, fn {status, reference, order, commission, reported_at} ->
        click = Map.fetch!(clicks, status)
        {link, offer} = Map.fetch!(attribution_dimensions, status)

        attrs = %{
          source_network: affiliate.network.code,
          affiliate_network_id: affiliate.network.id,
          network_conversion_ref: reference,
          click_session_id: click.id,
          public_click_id: click.click_id,
          network_click_ref: "DEV-CLICK-#{status |> Atom.to_string() |> String.upcase()}",
          merchant_id: link.merchant_id,
          affiliate_program_id: link.affiliate_program_id,
          product_id: offer.product_id,
          merchant_product_id: offer.id,
          status: status,
          currency: "USD",
          order_amount: Decimal.new(order),
          commission_amount: Decimal.new(commission),
          commission_rate: Decimal.new("0.10"),
          attribution_confidence: :high,
          data_freshness_at: reported_at,
          purchased_at: DateTime.add(reported_at, -3_600, :second),
          reported_at: reported_at,
          raw_payload: %{
            "synthetic" => true,
            "seedScenario" => "development-#{status}"
          }
        }

        conversion =
          attrs
          |> CommerceAttribution.ingest_conversion()
          |> Support.expect!("commerce conversion #{status}")
          |> restore_seed_conversion!(attrs, status)

        {status, conversion}
      end)

    facts =
      [
        {:approved, marketplace.price_points.fresh, "639.99"},
        {:pending, marketplace.price_points.out_of_stock, "1179.99"},
        {:reversed, marketplace.price_points.stale, "829.99"},
        {:paid, marketplace.price_points.inactive, "1129.99"}
      ]
      |> Map.new(fn {status, price_point, paid_price} ->
        conversion = Map.fetch!(conversions, status)
        paid = Decimal.new(paid_price)
        observed = price_point.price
        shipping = price_point.shipping || Decimal.new("0.00")

        attrs = %{
          conversion_id: conversion.id,
          listed_price_at_click: observed,
          reported_paid_price: paid,
          shipping_amount: shipping,
          tax_amount: Decimal.new("0.00"),
          discount_amount: Decimal.max(Decimal.sub(observed, paid), Decimal.new("0.00")),
          currency: "USD",
          price_observation_id: price_point.id,
          observed_at: price_point.observed_at,
          observed_price: observed,
          price_delta: Decimal.sub(paid, observed)
        }

        fact =
          case Repo.get_by(PurchasePriceFact, conversion_id: conversion.id) do
            nil ->
              CommerceAttribution.create_purchase_price_fact(attrs)

            fact ->
              fact
              |> PurchasePriceFact.changeset(attrs)
              |> Repo.update()
          end
          |> Support.expect!("purchase price fact #{status}")

        {status, fact}
      end)

    %{
      links: links,
      clicks: clicks,
      conversions: conversions,
      purchase_price_facts: facts,
      featured_product: catalog.products.monitor_16_9
    }
  end

  defp restore_seed_conversion!(conversion, attrs, status) do
    # Provider ingestion correctly preserves newer reports. Reserved seed references instead
    # need their backdated lifecycle examples restored after a developer exercises that path.
    conversion
    |> CommerceConversion.changeset(attrs)
    |> Repo.update()
    |> Support.expect!("restore commerce conversion #{status}")
  end

  defp stage_index(stage), do: Map.fetch!(@cj_stage_indexes, stage)

  defp hours(anchor, count), do: DateTime.add(anchor, count * 3_600, :second)
  defp days(anchor, count), do: DateTime.add(anchor, count * 86_400, :second)
end
