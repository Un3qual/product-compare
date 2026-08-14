defmodule ProductCompare.DevSeeds.GeneratedOperations do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.CommerceAttribution
  alias ProductCompare.CommerceAttribution.Visitors
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceLink
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Ingestion.CJProgram
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate

  @targets %{
    bounded: %{feeds: 70, imports: 40, clicks: 120, conversions: 80},
    full: %{feeds: 210, imports: 120, clicks: 600, conversions: 400}
  }
  @commerce_offer_skus %{
    "CAD" => "DEV-004-19",
    "EUR" => "DEV-012-17",
    "GBP" => "DEV-016-21"
  }

  @spec seed!(map(), map(), map(), struct(), DateTime.t(), map(), map()) :: map()
  def seed!(accounts, catalog, marketplace, source, anchor, profile, named) do
    targets = Map.fetch!(@targets, profile.density)

    feeds =
      seed_feeds!(source, anchor, targets.feeds - length(named.feeds))

    imports =
      seed_imports!(source, anchor, targets.imports - length(named.imports))

    commerce =
      seed_commerce!(
        accounts,
        catalog,
        marketplace,
        anchor,
        named.commerce,
        targets.clicks - map_size(named.commerce.clicks),
        targets.conversions - map_size(named.commerce.conversions)
      )

    %{
      feeds: feeds,
      imports: imports,
      clicks: commerce.clicks,
      conversions: commerce.conversions,
      purchase_facts: commerce.purchase_facts
    }
  end

  defp seed_feeds!(source, anchor, selected_count) do
    full_count = @targets.full.feeds - 8
    reconcile_feeds!(source, selected_count, full_count)

    Enum.map(1..selected_count, fn index ->
      provider_feed_id = feed_id(index)
      entropy_id = feed_entropy_id(index)
      unmatched? = rem(index, 5) == 0
      advertiser_id = if unmatched?, do: "", else: advertiser_id(index)

      case Repo.get_by(MerchantFeedCandidate,
             source_id: source.id,
             provider_feed_id: provider_feed_id
           ) do
        nil ->
          :ok

        %MerchantFeedCandidate{entropy_id: ^entropy_id} ->
          :ok

        %MerchantFeedCandidate{} ->
          raise "Generated CJ feed #{provider_feed_id} has an unexpected owner"
      end

      feed =
        Ingestion.upsert_merchant_feed_candidate(source, %{
          provider: "cj",
          provider_feed_id: provider_feed_id,
          advertiser_id: advertiser_id,
          advertiser_name:
            "Generated advertiser #{String.pad_leading(Integer.to_string(index), 3, "0")}",
          advertiser_country: if(rem(index, 9) == 0, do: "CA", else: "US"),
          source_feed_type: if(rem(index, 3) == 0, do: "PRODUCT", else: "SHOPPING"),
          currency: Enum.at(["USD", "CAD", "EUR", "GBP"], rem(index - 1, 4)),
          language: if(rem(index, 8) == 0, do: "FR", else: "EN"),
          feed_name: "Generated development product feed #{index}",
          product_count: 250 + rem(index * 37, 5_000),
          provider_last_updated_at: DateTime.add(anchor, -index * 3_600, :second),
          last_seen_at: anchor,
          raw_metadata: %{
            "synthetic" => true,
            "seedScenario" => "development-generated-feed-#{index}"
          }
        })
        |> Support.expect!("generated CJ feed #{index}")

      feed =
        feed
        |> Ecto.Changeset.change(entropy_id: entropy_id)
        |> Repo.update()
        |> Support.expect!("reserve generated CJ feed #{index}")

      if unmatched? do
        feed
        |> MerchantFeedCandidate.changeset(%{advertiser_id: nil, cj_program_id: nil})
        |> Repo.update()
        |> Support.expect!("restore generated unmatched feed #{index}")
      else
        program = Repo.get!(CJProgram, feed.cj_program_id)
        stage = Enum.at(CJProgram.stages(), rem(index - 1, length(CJProgram.stages())))

        if program.stage == stage do
          program
        else
          Ingestion.update_cj_program_lifecycle(
            program.entropy_id,
            %{stage: stage, note: "Generated development lifecycle #{stage}"},
            DateTime.add(anchor, -index * 1_800, :second)
          )
          |> Support.expect!("generated CJ program #{index}")
        end

        Repo.get!(MerchantFeedCandidate, feed.id)
      end
    end)
  end

  defp reconcile_feeds!(source, selected_count, full_count) do
    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        case Repo.get_by(MerchantFeedCandidate,
               source_id: source.id,
               provider_feed_id: feed_id(index)
             ) do
          nil ->
            :ok

          %MerchantFeedCandidate{} = feed ->
            if feed.entropy_id != feed_entropy_id(index) do
              raise "Full-only CJ feed #{feed_id(index)} has an unexpected owner"
            end

            Repo.delete!(feed)

            case Repo.get_by(CJProgram,
                   source_id: source.id,
                   advertiser_id: advertiser_id(index)
                 ) do
              nil -> :ok
              program -> Repo.delete!(program)
            end
        end
      end)
    end
  end

  defp feed_id(index),
    do: "DEV-CJ-GEN-FEED-#{String.pad_leading(Integer.to_string(index), 3, "0")}"

  defp advertiser_id(index),
    do: "DEV-CJ-GEN-ADV-#{String.pad_leading(Integer.to_string(index), 3, "0")}"

  defp feed_entropy_id(index),
    do: Support.stable_uuid("development-generated-cj-feed", Integer.to_string(index))

  defp seed_imports!(source, anchor, selected_count) do
    full_count = @targets.full.imports - 4
    reconcile_imports!(source, selected_count, full_count)

    Enum.map(1..selected_count, fn index ->
      started_at = DateTime.add(anchor, -index * 3_600, :second)
      surface = if(rem(index, 2) == 0, do: "shoppingProducts", else: "shoppingProductFeeds")
      entropy_id = import_entropy_id(index)

      attrs = %{
        source_id: source.id,
        provider: "cj",
        surface: surface,
        query: %{
          "seedScenario" => import_scenario(index),
          "synthetic" => true,
          "generated" => true
        },
        status: :running,
        started_at: started_at,
        finished_at: nil,
        cursor_start: 0,
        cursor_end: nil,
        page_size: 100,
        pages_requested: 1 + rem(index, 4),
        pages_fetched: 0,
        records_fetched: 0,
        records_normalized: 0,
        records_persisted: 0,
        records_failed: 0,
        error_summary: nil
      }

      run =
        case generated_import_run(source, index) do
          nil ->
            Ingestion.start_import_run(attrs)
            |> Support.expect!("start generated import #{index}")
            |> Ecto.Changeset.change(entropy_id: entropy_id)
            |> Repo.update()
            |> Support.expect!("reserve generated import #{index}")

          %ImportRun{entropy_id: ^entropy_id} = run ->
            run

          %ImportRun{} ->
            raise "Generated import #{import_scenario(index)} has an unexpected owner"
        end

      final_attrs =
        case rem(index, 3) do
          0 ->
            attrs

          1 ->
            Map.merge(attrs, %{
              status: :succeeded,
              finished_at: DateTime.add(started_at, 60 + index, :second),
              cursor_end: 100,
              pages_fetched: 1,
              records_fetched: 30 + index,
              records_normalized: 29 + index,
              records_persisted: 28 + index,
              records_failed: 1
            })

          2 ->
            Map.merge(attrs, %{
              status: :failed,
              finished_at: DateTime.add(started_at, 30 + index, :second),
              cursor_end: 0,
              records_failed: 1,
              error_summary: "Synthetic generated import failure; no provider request was made."
            })
        end

      run
      |> ImportRun.changeset(final_attrs)
      |> Repo.update()
      |> Support.expect!("restore generated import #{index}")
    end)
  end

  defp reconcile_imports!(source, selected_count, full_count) do
    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        case generated_import_run(source, index) do
          nil ->
            :ok

          %ImportRun{} = run ->
            if run.entropy_id != import_entropy_id(index) do
              raise "Full-only import #{import_scenario(index)} has an unexpected owner"
            end

            Repo.delete!(run)
        end
      end)
    end
  end

  defp generated_import_run(source, index) do
    ImportRun
    |> where([run], run.source_id == ^source.id)
    |> where([run], fragment("?->>'seedScenario'", run.query) == ^import_scenario(index))
    |> Repo.one()
  end

  defp import_scenario(index),
    do: "development-generated-import-#{String.pad_leading(Integer.to_string(index), 3, "0")}"

  defp import_entropy_id(index),
    do: Support.stable_uuid("development-generated-import", Integer.to_string(index))

  defp seed_commerce!(
         accounts,
         _catalog,
         marketplace,
         anchor,
         named,
         click_count,
         conversion_count
       ) do
    reconcile_commerce!(marketplace.affiliate, click_count, conversion_count)

    offers = non_usd_offers!(marketplace.all_offers)
    links = seed_commerce_links!(offers)

    visitor =
      Support.stable_uuid("development-generated-anonymous-visitor", "shared")
      |> Visitors.get_or_create()
      |> Support.expect!("generated anonymous visitor")

    clicks = seed_clicks!(accounts, offers, links, visitor, click_count)
    currencies_by_offer_id = Map.new(offers, fn {currency, offer} -> {offer.id, currency} end)

    conversions =
      seed_conversions!(
        marketplace.affiliate,
        clicks,
        anchor,
        conversion_count,
        currencies_by_offer_id
      )

    purchase_facts = seed_purchase_facts!(conversions, marketplace.all_price_points)

    %{
      links: Map.merge(named.links, links),
      clicks: clicks,
      conversions: conversions,
      purchase_facts: purchase_facts
    }
  end

  defp non_usd_offers!(offers) do
    Map.new(@commerce_offer_skus, fn {currency, external_sku} ->
      offer =
        Enum.find(offers, fn offer ->
          offer.external_sku == external_sku and offer.currency == currency and offer.is_active
        end) || raise "Generated marketplace has no active #{currency} offer #{external_sku}"

      {currency, offer}
    end)
  end

  defp seed_commerce_links!(offers) do
    Map.new(offers, fn {currency, offer} ->
      destination_url = "#{offer.url}?development-commerce=#{String.downcase(currency)}"
      entropy_id = Support.stable_uuid("development-generated-commerce-link", currency)

      existing_link =
        CommerceLink
        |> where(
          [link],
          link.merchant_id == ^offer.merchant_id and is_nil(link.affiliate_program_id) and
            link.destination_url == ^destination_url and link.link_type == :non_affiliate
        )
        |> Repo.one()

      case existing_link do
        nil ->
          :ok

        %CommerceLink{entropy_id: ^entropy_id} ->
          :ok

        %CommerceLink{} ->
          raise "Generated #{currency} commerce link has an unexpected owner"
      end

      link =
        CommerceAttribution.upsert_commerce_link(%{
          merchant_id: offer.merchant_id,
          destination_url: destination_url,
          link_type: :non_affiliate,
          campaign_params: %{
            "campaign" => "development-generated",
            "currency" => currency
          },
          is_active: true
        })
        |> Support.expect!("generated #{currency} commerce link")

      link =
        link
        |> Ecto.Changeset.change(entropy_id: entropy_id)
        |> Repo.update()
        |> Support.expect!("reserve generated #{currency} commerce link")

      {currency, link}
    end)
  end

  defp seed_clicks!(accounts, offers, links, visitor, selected_count) do
    currencies = ["CAD", "EUR", "GBP"]
    surfaces = [:web, :api, :extension]

    Enum.map(1..selected_count, fn index ->
      currency = Enum.at(currencies, rem(index - 1, length(currencies)))
      offer = Map.fetch!(offers, currency)
      link = Map.fetch!(links, currency)

      actor =
        if rem(index, 2) == 0 do
          %{user_id: accounts.shopper.id}
        else
          %{anonymous_visitor_id: visitor.id}
        end

      attrs =
        Map.merge(actor, %{
          click_id: click_id(index),
          commerce_link_id: link.id,
          merchant_product_id: offer.id,
          source_surface: Enum.at(surfaces, rem(index - 1, length(surfaces))),
          referrer: "http://localhost:4000/products/#{offer.product_id}",
          user_agent: "synthetic-generated-development-agent/#{index}",
          ip_address: "127.0.0.#{1 + rem(index, 200)}"
        })

      entropy_id = click_entropy_id(index)

      case Repo.get_by(CommerceClickSession, click_id: click_id(index)) do
        nil ->
          CommerceAttribution.create_click_session(attrs)
          |> Support.expect!("generated commerce click #{index}")
          |> Ecto.Changeset.change(entropy_id: entropy_id)
          |> Repo.update()
          |> Support.expect!("reserve generated commerce click #{index}")

        %CommerceClickSession{entropy_id: ^entropy_id} = click ->
          click
          |> CommerceClickSession.changeset(attrs)
          |> Repo.update()
          |> Support.expect!("restore generated commerce click #{index}")

        %CommerceClickSession{} ->
          raise "Generated click #{click_id(index)} has an unexpected owner"
      end
    end)
  end

  defp seed_conversions!(affiliate, clicks, anchor, selected_count, currencies_by_offer_id) do
    statuses = [:pending, :approved, :reversed, :paid]

    Enum.map(1..selected_count, fn index ->
      click = Enum.at(clicks, rem(index - 1, length(clicks)))
      unmatched? = rem(index, 5) == 0
      status = Enum.at(statuses, rem(index - 1, length(statuses)))
      reported_at = DateTime.add(anchor, -index * 900, :second)
      order_amount = Decimal.new(50 + rem(index * 37, 1_500))
      commission_amount = Decimal.mult(order_amount, Decimal.new("0.10"))

      attribution_attrs =
        if unmatched? do
          %{attribution_confidence: :unmatched}
        else
          %{
            click_session_id: click.id,
            public_click_id: click.click_id,
            network_click_ref: "DEV-GEN-CLICK-#{padded(index)}",
            attribution_confidence: if(rem(index, 7) == 0, do: :low, else: :high)
          }
        end

      attrs =
        Map.merge(attribution_attrs, %{
          source_network: affiliate.network.code,
          affiliate_network_id: affiliate.network.id,
          network_conversion_ref: conversion_ref(index),
          status: status,
          currency: Map.fetch!(currencies_by_offer_id, click.merchant_product_id),
          order_amount: order_amount,
          commission_amount: commission_amount,
          commission_rate: Decimal.new("0.10"),
          data_freshness_at: reported_at,
          purchased_at: DateTime.add(reported_at, -1_800, :second),
          reported_at: reported_at,
          raw_payload: %{
            "synthetic" => true,
            "generated" => true,
            "seedScenario" => "development-generated-conversion-#{padded(index)}"
          }
        })

      entropy_id = conversion_entropy_id(index)

      case Repo.get_by(CommerceConversion,
             affiliate_network_id: affiliate.network.id,
             network_conversion_ref: conversion_ref(index)
           ) do
        nil ->
          :ok

        %CommerceConversion{entropy_id: ^entropy_id} ->
          :ok

        %CommerceConversion{} ->
          raise "Generated conversion #{conversion_ref(index)} has an unexpected owner"
      end

      CommerceAttribution.ingest_conversion(attrs)
      |> Support.expect!("generated commerce conversion #{index}")
      |> Ecto.Changeset.change(entropy_id: entropy_id)
      |> Repo.update()
      |> Support.expect!("reserve generated commerce conversion #{index}")
    end)
  end

  defp seed_purchase_facts!(conversions, price_points) do
    latest_points =
      price_points
      |> Enum.group_by(& &1.merchant_product_id)
      |> Map.new(fn {merchant_product_id, points} ->
        {merchant_product_id, Enum.max_by(points, & &1.observed_at, DateTime)}
      end)

    conversions
    |> Enum.with_index(1)
    |> Enum.reject(fn {conversion, index} ->
      is_nil(conversion.merchant_product_id) or rem(index, 3) == 0
    end)
    |> Enum.map(fn {conversion, index} ->
      point =
        Map.get(latest_points, conversion.merchant_product_id) ||
          raise "Generated purchase fact #{index}: offer #{conversion.merchant_product_id} has no price point"

      paid = conversion.order_amount
      observed = point.price

      attrs = %{
        conversion_id: conversion.id,
        listed_price_at_click: observed,
        reported_paid_price: paid,
        shipping_amount: point.shipping || Decimal.new("0.00"),
        tax_amount: Decimal.new("0.00"),
        discount_amount: Decimal.max(Decimal.sub(observed, paid), Decimal.new("0.00")),
        currency: conversion.currency,
        price_observation_id: point.id,
        observed_at: point.observed_at,
        observed_price: observed,
        price_delta: Decimal.sub(paid, observed)
      }

      entropy_id = purchase_fact_entropy_id(index)

      case Repo.get_by(PurchasePriceFact, conversion_id: conversion.id) do
        nil ->
          CommerceAttribution.create_purchase_price_fact(attrs)
          |> Support.expect!("generated purchase price fact #{index}")
          |> Ecto.Changeset.change(entropy_id: entropy_id)
          |> Repo.update()
          |> Support.expect!("reserve generated purchase price fact #{index}")

        %PurchasePriceFact{entropy_id: ^entropy_id} = fact ->
          fact
          |> PurchasePriceFact.changeset(attrs)
          |> Repo.update()
          |> Support.expect!("restore generated purchase price fact #{index}")

        %PurchasePriceFact{} ->
          raise "Generated conversion #{conversion.network_conversion_ref} has an unexpected purchase fact"
      end
    end)
  end

  defp reconcile_commerce!(affiliate, selected_clicks, selected_conversions) do
    reconcile_conversions!(affiliate.network.id, selected_conversions)
    reconcile_clicks!(selected_clicks)
  end

  defp reconcile_conversions!(network_id, selected_count) do
    full_count = @targets.full.conversions - 4

    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        case Repo.get_by(CommerceConversion,
               affiliate_network_id: network_id,
               network_conversion_ref: conversion_ref(index)
             ) do
          nil ->
            :ok

          %CommerceConversion{} = conversion ->
            if conversion.entropy_id != conversion_entropy_id(index) do
              raise "Full-only conversion #{conversion_ref(index)} has an unexpected owner"
            end

            case Repo.get_by(PurchasePriceFact, conversion_id: conversion.id) do
              nil ->
                :ok

              %PurchasePriceFact{} = fact ->
                if fact.entropy_id != purchase_fact_entropy_id(index) do
                  raise "Full-only conversion #{conversion_ref(index)} has an unexpected purchase fact"
                end

                Repo.delete!(fact)
            end

            Repo.delete!(conversion)
        end
      end)
    end
  end

  defp reconcile_clicks!(selected_count) do
    full_count = @targets.full.clicks - 4

    if selected_count < full_count do
      Enum.each((selected_count + 1)..full_count, fn index ->
        case Repo.get_by(CommerceClickSession, click_id: click_id(index)) do
          nil ->
            :ok

          %CommerceClickSession{} = click ->
            if click.entropy_id != click_entropy_id(index) do
              raise "Full-only click #{click.click_id} has an unexpected owner"
            end

            unrelated_conversion? =
              CommerceConversion
              |> where([conversion], conversion.click_session_id == ^click.id)
              |> Repo.exists?()

            if unrelated_conversion? do
              raise "Full-only click #{click.click_id} is referenced by an unrelated conversion"
            end

            Repo.delete!(click)
        end
      end)
    end
  end

  defp click_id(index),
    do: Support.stable_uuid("development-generated-public-click", Integer.to_string(index))

  defp click_entropy_id(index),
    do: Support.stable_uuid("development-generated-click", Integer.to_string(index))

  defp conversion_ref(index), do: "DEV-GEN-CONV-#{padded(index)}"

  defp conversion_entropy_id(index),
    do: Support.stable_uuid("development-generated-conversion", Integer.to_string(index))

  defp purchase_fact_entropy_id(index),
    do: Support.stable_uuid("development-generated-purchase-fact", Integer.to_string(index))

  defp padded(index), do: String.pad_leading(Integer.to_string(index), 3, "0")
end
