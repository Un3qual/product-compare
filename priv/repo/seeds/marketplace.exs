defmodule ProductCompare.DevSeeds.Marketplace do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Affiliate
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.Coupon
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  @source_name "Development Marketplace Evidence"
  @artifact_hash "development-marketplace-offers-v1"

  @spec seed!(map(), DateTime.t()) :: map()
  def seed!(catalog, %DateTime{} = anchor) do
    {source, artifact} = seed_source_evidence!(anchor)
    merchants = seed_merchants!()
    offers = seed_offers!(catalog.products, merchants, anchor)
    restore_unobserved_offer!(offers.unobserved)
    price_history = seed_price_points!(offers, source, anchor)
    affiliate = seed_affiliate!(merchants, offers, anchor)
    coupons = seed_coupons!(merchants.example_mart, affiliate.network, artifact, anchor)

    %{
      source: source,
      artifact: artifact,
      merchants: merchants,
      offers: offers,
      price_points: price_history.points,
      price_artifacts: price_history.artifacts,
      affiliate: affiliate,
      coupons: coupons
    }
  end

  defp seed_source_evidence!(anchor) do
    source_attrs = %{
      kind: "web",
      name: @source_name,
      domain: "marketplace.example"
    }

    source =
      (Repo.get_by(Source, kind: "web", name: @source_name) || %Source{})
      |> Source.changeset(source_attrs)
      |> Repo.insert_or_update()
      |> Support.expect!("marketplace evidence source")

    artifact =
      seed_artifact!(
        source,
        @artifact_hash,
        "https://marketplace.example/development/offers",
        %{"purpose" => "development offer and coupon testing"},
        anchor
      )

    {source, artifact}
  end

  defp seed_merchants! do
    %{
      example_mart:
        Pricing.upsert_merchant(%{name: "ExampleMart", domain: "examplemart.test"})
        |> Support.expect!("ExampleMart merchant"),
      value_vision:
        Pricing.upsert_merchant(%{name: "ValueVision", domain: "valuevision.test"})
        |> Support.expect!("ValueVision merchant")
    }
  end

  defp seed_offers!(products, merchants, anchor) do
    [
      {:fresh, merchants.example_mart, products.monitor_16_9, "EXM-AV27G",
       "https://examplemart.test/products/acme-vision-27g", true, hours(anchor, -1)},
      {:aging, merchants.value_vision, products.monitor_16_9, "VAL-AV27G",
       "https://valuevision.test/products/acme-vision-27g", true, hours(anchor, -48)},
      {:stale, merchants.example_mart, products.monitor_ultrawide, "EXM-AV27UW",
       "https://examplemart.test/products/acme-vision-27uw", true, hours(anchor, -120)},
      {:out_of_stock, merchants.example_mart, products.tv, "EXM-AC55O",
       "https://examplemart.test/products/acme-cinema-55o", true, hours(anchor, -1)},
      {:inactive, merchants.value_vision, products.tv, "VAL-AC55O",
       "https://valuevision.test/products/acme-cinema-55o", false, hours(anchor, -1)},
      {:unobserved, merchants.example_mart, products.projector, "EXM-AB4K",
       "https://examplemart.test/products/acme-beam-4k", true, hours(anchor, -1)}
    ]
    |> Map.new(fn {key, merchant, product, sku, url, active?, last_seen_at} ->
      offer =
        Pricing.upsert_merchant_product(%{
          merchant_id: merchant.id,
          product_id: product.id,
          external_sku: sku,
          url: url,
          currency: "USD",
          last_seen_at: last_seen_at,
          is_active: active?
        })
        |> Support.expect!("offer #{sku}")

      {key, offer}
    end)
  end

  defp restore_unobserved_offer!(offer) do
    price_point_ids =
      PricePoint
      |> where([point], point.merchant_product_id == ^offer.id)
      |> select([point], point.id)
      |> Repo.all()

    delete_alert_evaluation_jobs!(price_point_ids)

    AlertEvent
    |> where([event], event.triggering_price_point_id in ^price_point_ids)
    |> Repo.delete_all()

    PricePoint
    |> where([point], point.id in ^price_point_ids)
    |> Repo.delete_all()
  end

  defp seed_price_points!(offers, source, anchor) do
    scenarios = [
      {:fresh_old, offers.fresh, hours(anchor, -24 * 30), "699.99", "0.00", true},
      {:fresh_middle, offers.fresh, hours(anchor, -24 * 7), "669.99", "0.00", true},
      {:fresh, offers.fresh, hours(anchor, -1), "649.99", "0.00", true},
      {:aging_old, offers.aging, hours(anchor, -24 * 14), "659.99", "9.99", true},
      {:aging, offers.aging, hours(anchor, -48), "629.99", "9.99", true},
      {:stale_old, offers.stale, hours(anchor, -24 * 20), "899.99", "0.00", true},
      {:stale, offers.stale, hours(anchor, -120), "849.99", "0.00", true},
      {:out_of_stock, offers.out_of_stock, hours(anchor, -1), "1199.99", "0.00", false},
      {:inactive, offers.inactive, hours(anchor, -1), "1149.99", "0.00", true}
    ]

    {points, artifacts} =
      scenarios
      |> Enum.map(fn {key, offer, observed_at, price, shipping, in_stock} ->
        artifact =
          seed_artifact!(
            source,
            "development-marketplace-price-#{key}-v1",
            "https://marketplace.example/development/prices/#{key}",
            %{"purpose" => "development price observation", "scenario" => to_string(key)},
            anchor
          )

        attrs = %{
          merchant_product_id: offer.id,
          artifact_id: artifact.id,
          observed_at: observed_at,
          price: Decimal.new(price),
          shipping: Decimal.new(shipping),
          in_stock: in_stock
        }

        price_point =
          case Repo.get_by(PricePoint,
                 merchant_product_id: offer.id,
                 artifact_id: artifact.id
               ) do
            nil ->
              # Seed observations are evaluated synchronously after watches exist; the public
              # pricing path would also enqueue background alert work for these local fixtures.
              %PricePoint{}
              |> PricePoint.changeset(attrs)
              |> Repo.insert()

            price_point ->
              price_point
              |> PricePoint.changeset(attrs)
              |> Repo.update()
          end
          |> Support.expect!("price point #{offer.external_sku}/#{key}")

        {key, price_point, artifact}
      end)
      |> Enum.reduce({%{}, %{}}, fn {key, point, artifact}, {points, artifacts} ->
        {Map.put(points, key, point), Map.put(artifacts, key, artifact)}
      end)

    points
    |> Map.values()
    |> Enum.map(& &1.id)
    |> delete_alert_evaluation_jobs!()

    %{points: points, artifacts: artifacts}
  end

  defp delete_alert_evaluation_jobs!([]), do: :ok

  defp delete_alert_evaluation_jobs!(price_point_ids) do
    price_point_ids = Enum.map(price_point_ids, &Integer.to_string/1)

    Oban.Job
    |> where(
      [job],
      job.worker == "ProductCompare.Alerts.Jobs.AlertEvaluationWorker" and
        fragment("?->>'price_point_id'", job.args) in ^price_point_ids
    )
    |> Repo.delete_all()

    :ok
  end

  defp seed_affiliate!(merchants, offers, anchor) do
    network =
      Affiliate.upsert_network(%{
        code: "development_affiliate",
        name: "Development Affiliate Network"
      })
      |> Support.expect!("development affiliate network")

    active_program =
      Affiliate.upsert_program(%{
        affiliate_network_id: network.id,
        merchant_id: merchants.example_mart.id,
        program_code: "DEV-EXAMPLEMART",
        status: "active"
      })
      |> Support.expect!("active development affiliate program")

    paused_program =
      Affiliate.upsert_program(%{
        affiliate_network_id: network.id,
        merchant_id: merchants.value_vision.id,
        program_code: "DEV-VALUEVISION",
        status: "paused"
      })
      |> Support.expect!("paused development affiliate program")

    links =
      [offers.fresh, offers.aging, offers.out_of_stock]
      |> Map.new(fn offer ->
        link =
          Affiliate.upsert_link(%{
            merchant_product_id: offer.id,
            affiliate_network_id: network.id,
            original_url: offer.url,
            affiliate_url:
              "https://affiliate.example/click?sku=#{URI.encode_www_form(offer.external_sku)}",
            last_verified_at: anchor
          })
          |> Support.expect!("affiliate link #{offer.external_sku}")

        {offer.external_sku, link}
      end)

    %{
      network: network,
      active_program: active_program,
      paused_program: paused_program,
      links: links
    }
  end

  defp seed_coupons!(merchant, network, artifact, anchor) do
    [
      {:active, "DEV-ACTIVE-10", "Active synthetic development discount", :percent, "10", nil,
       days(anchor, -1), days(anchor, 7)},
      {:future, "DEV-FUTURE-15", "Future synthetic development discount", :percent, "15", nil,
       days(anchor, 1), days(anchor, 14)},
      {:expired, "DEV-EXPIRED-5", "Expired synthetic development discount", :amount, "5.00",
       "USD", days(anchor, -14), days(anchor, -1)}
    ]
    |> Map.new(fn {key, code, description, type, value, currency, valid_from, valid_to} ->
      attrs = %{
        merchant_id: merchant.id,
        affiliate_network_id: network.id,
        artifact_id: artifact.id,
        code: code,
        description: description,
        discount_type: type,
        discount_value: Decimal.new(value),
        currency: currency,
        valid_from: valid_from,
        valid_to: valid_to,
        terms: "Synthetic coupon for local development testing only"
      }

      coupon =
        (Repo.get_by(Coupon,
           merchant_id: merchant.id,
           artifact_id: artifact.id,
           code: code
         ) || %Coupon{})
        |> Coupon.changeset(attrs)
        |> Repo.insert_or_update()
        |> Support.expect!("coupon #{code}")

      {key, coupon}
    end)
  end

  defp seed_artifact!(source, content_hash, url, raw_json, anchor) do
    attrs = %{
      source_id: source.id,
      url: url,
      fetched_at: anchor,
      content_hash: content_hash,
      raw_json: Map.put(raw_json, "synthetic", true)
    }

    (Repo.get_by(SourceArtifact, source_id: source.id, content_hash: content_hash) ||
       %SourceArtifact{})
    |> SourceArtifact.changeset(attrs)
    |> Repo.insert_or_update()
    |> Support.expect!("marketplace artifact #{content_hash}")
  end

  defp hours(anchor, count), do: DateTime.add(anchor, count * 3_600, :second)
  defp days(anchor, count), do: DateTime.add(anchor, count * 86_400, :second)
end
