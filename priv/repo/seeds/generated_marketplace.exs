defmodule ProductCompare.DevSeeds.GeneratedMarketplace do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.DevSeeds.Dictionary
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Pricing
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Affiliate.AffiliateLink
  alias ProductCompareSchemas.Affiliate.Coupon
  alias ProductCompareSchemas.Alerts.AlertEvent
  alias ProductCompareSchemas.Alerts.PriceWatchRule
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.CommerceAttribution.CommerceClickSession
  alias ProductCompareSchemas.CommerceAttribution.CommerceConversion
  alias ProductCompareSchemas.CommerceAttribution.PurchasePriceFact
  alias ProductCompareSchemas.Discussions.ProductReview
  alias ProductCompareSchemas.Ingestion.ImportObservation
  alias ProductCompareSchemas.Pricing.Merchant
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.SourceArtifact

  @current_hash Support.sha256("development-marketplace-generated-current-v1")
  @weekly_hash Support.sha256("development-marketplace-generated-weekly-v1")
  @monthly_hash Support.sha256("development-marketplace-generated-full-monthly-v1")
  @generated_watch_entropy_ids Enum.map(1..156, fn index ->
                                 Support.stable_uuid(
                                   "development-generated-watch",
                                   Integer.to_string(index)
                                 )
                               end)
  @seed_watch_entropy_ids [
                            "d3ca0000-0000-4000-8000-000000000001",
                            "d3ca0000-0000-4000-8000-000000000002",
                            "d3ca0000-0000-4000-8000-000000000003",
                            Support.unobserved_watch_entropy_id()
                          ] ++ @generated_watch_entropy_ids

  @spec seed!(map(), map(), map(), struct(), DateTime.t(), map()) :: map()
  def seed!(catalog, named_merchants, named_offers, source, anchor, profile) do
    generated_merchants = seed_generated_merchants!(profile)

    all_merchants =
      [named_merchants.example_mart, named_merchants.value_vision] ++ generated_merchants

    selected_fixtures = offer_fixtures(catalog, generated_merchants, named_offers, profile)
    full_fixtures = offer_fixtures(catalog, generated_merchants, named_offers, %{density: :full})
    generated_entries = seed_generated_offers!(selected_fixtures, anchor)
    named_entries = named_offer_entries(named_offers)
    selected_entries = named_entries ++ generated_entries
    full_entries = named_entries ++ fixture_entries(full_fixtures)
    artifacts = seed_history_artifacts!(source, anchor)

    selected_rows = price_rows(selected_entries, artifacts, anchor, profile.density)
    full_owned_entropy_ids = full_entries |> owned_price_entropy_ids() |> MapSet.new()
    selected_offer_entropy_ids = MapSet.new(selected_fixtures, & &1.entropy_id)
    full_offer_entropy_ids = MapSet.new(full_fixtures, & &1.entropy_id)

    ensure_no_unowned_offer_watches!(selected_offer_entropy_ids, full_offer_entropy_ids)

    reconcile_price_points!(
      artifacts,
      MapSet.new(selected_rows, & &1.entropy_id),
      full_owned_entropy_ids,
      profile.density
    )

    price_points = seed_price_rows!(selected_rows)

    reconcile_offers!(selected_offer_entropy_ids, full_offer_entropy_ids)

    %{
      all_merchants: all_merchants,
      all_offers: named_offer_inventory(named_offers) ++ Enum.map(generated_entries, & &1.offer),
      price_points: price_points,
      artifacts: artifacts
    }
  end

  defp seed_generated_merchants!(profile) do
    profile
    |> Dictionary.merchant_fixtures()
    |> Enum.map(fn fixture ->
      entropy_id = Support.stable_uuid("development-merchant", fixture.key)

      existing =
        Repo.get_by(Merchant, domain: fixture.domain) || Repo.get_by(Merchant, name: fixture.name)

      merchant =
        case existing do
          nil ->
            fixture
            |> Pricing.upsert_merchant()
            |> Support.expect!("merchant #{fixture.domain}")
            |> Ecto.Changeset.change(entropy_id: entropy_id)
            |> Repo.update()
            |> Support.expect!("merchant entropy #{fixture.domain}")

          %Merchant{entropy_id: ^entropy_id, domain: domain, name: name}
          when domain == fixture.domain and name == fixture.name ->
            Pricing.upsert_merchant(fixture)
            |> Support.expect!("merchant #{fixture.domain}")

          %Merchant{} ->
            raise "Refusing to adopt generated merchant #{fixture.domain}"
        end

      Repo.get!(Merchant, merchant.id)
    end)
  end

  defp offer_fixtures(catalog, generated_merchants, named_offers, profile) do
    existing_counts =
      named_offer_inventory(named_offers)
      |> Enum.frequencies_by(& &1.product_id)

    catalog.all_products
    |> Enum.with_index(1)
    |> Enum.flat_map(fn {product, product_index} ->
      existing_count = Map.get(existing_counts, product.id, 0)
      target = offer_target(profile.density, product_index)
      bounded_additional = offer_target(:bounded, product_index) - existing_count

      Enum.map(1..(target - existing_count), fn slot ->
        merchant_offset = rem(product_index + slot - 2, length(generated_merchants))
        merchant = Enum.at(generated_merchants, merchant_offset)
        merchant_index = merchant_offset + 3
        shared? = slot <= bounded_additional
        namespace = if shared?, do: "development-offer-shared", else: "development-offer-full"
        key = "#{product.entropy_id}:#{merchant.entropy_id}"

        %{
          key: key,
          entropy_id: Support.stable_uuid(namespace, key),
          product: product,
          product_index: product_index,
          merchant: merchant,
          merchant_index: merchant_index,
          rank: existing_count + slot,
          observed?: true,
          external_sku:
            "DEV-#{String.pad_leading(Integer.to_string(product_index), 3, "0")}-#{String.pad_leading(Integer.to_string(merchant_index), 2, "0")}",
          url: "https://#{merchant.domain}/products/#{product.slug}",
          currency: currency_for(product_index, merchant_index),
          last_seen_at: nil,
          is_active: rem(product_index + merchant_index, 19) != 0
        }
      end)
    end)
  end

  defp offer_target(:bounded, product_index) when product_index <= 5,
    do: 12 + rem(product_index, 14)

  defp offer_target(:bounded, product_index), do: 4 + rem(product_index, 5)

  defp offer_target(:full, product_index) when product_index <= 5,
    do: 20 + rem(product_index, 11)

  defp offer_target(:full, product_index), do: 8 + rem(product_index, 5)

  defp currency_for(product_index, merchant_index) do
    cond do
      rem(product_index + merchant_index, 37) == 0 -> "GBP"
      rem(product_index + merchant_index, 29) == 0 -> "EUR"
      rem(product_index + merchant_index, 23) == 0 -> "CAD"
      true -> "USD"
    end
  end

  defp seed_generated_offers!(fixtures, anchor) do
    inserted_at = anchor

    rows =
      Enum.map(fixtures, fn fixture ->
        last_seen_at =
          DateTime.add(anchor, -rem(fixture.merchant_index, 6) * 3_600, :second)

        %{
          entropy_id: fixture.entropy_id,
          merchant_id: fixture.merchant.id,
          product_id: fixture.product.id,
          external_sku: fixture.external_sku,
          url: fixture.url,
          currency: fixture.currency,
          last_seen_at: last_seen_at,
          is_active: fixture.is_active,
          inserted_at: inserted_at,
          updated_at: inserted_at
        }
      end)

    verify_offer_ownership!(rows)

    offers_by_entropy_id =
      Support.sync_owned_rows!(
        MerchantProduct,
        rows,
        [
          :merchant_id,
          :product_id,
          :external_sku,
          :url,
          :currency,
          :last_seen_at,
          :is_active
        ],
        stage: "generated offers",
        chunk_size: 3_000
      )
      |> Map.new(&{&1.entropy_id, &1})

    Enum.zip(fixtures, rows)
    |> Enum.map(fn {fixture, row} ->
      fixture
      |> Map.put(:offer, Map.fetch!(offers_by_entropy_id, row.entropy_id))
      |> Map.put(:last_seen_at, row.last_seen_at)
    end)
  end

  defp verify_offer_ownership!(rows) do
    expected = Map.new(rows, &{&1.entropy_id, {&1.merchant_id, &1.product_id, &1.url}})

    expected
    |> Map.keys()
    |> fetch_by_entropy_ids(MerchantProduct)
    |> Enum.each(fn offer ->
      if Map.fetch!(expected, offer.entropy_id) !=
           {offer.merchant_id, offer.product_id, offer.url} do
        raise "Refusing to adopt generated offer #{offer.entropy_id}"
      end
    end)

    rows
    |> Enum.chunk_every(5_000)
    |> Enum.each(fn chunk ->
      expected_pairs = Map.new(chunk, &{{&1.merchant_id, &1.url}, &1.entropy_id})
      merchant_ids = chunk |> Enum.map(& &1.merchant_id) |> Enum.uniq()
      urls = Enum.map(chunk, & &1.url)

      MerchantProduct
      |> where([offer], offer.merchant_id in ^merchant_ids and offer.url in ^urls)
      |> Repo.all()
      |> Enum.each(fn offer ->
        expected_entropy_id = Map.get(expected_pairs, {offer.merchant_id, offer.url})

        if expected_entropy_id && expected_entropy_id != offer.entropy_id do
          raise "Refusing to adopt offer URL #{offer.url}"
        end
      end)
    end)
  end

  defp named_offer_entries(offers) do
    [
      %{
        offer: offers.fresh,
        key: "named:fresh",
        product_index: 1,
        merchant_index: 1,
        rank: 1,
        observed?: true
      },
      %{
        offer: offers.aging,
        key: "named:aging",
        product_index: 1,
        merchant_index: 2,
        rank: 2,
        observed?: true
      },
      %{
        offer: offers.stale,
        key: "named:stale",
        product_index: 2,
        merchant_index: 1,
        rank: 1,
        observed?: true
      },
      %{
        offer: offers.out_of_stock,
        key: "named:out-of-stock",
        product_index: 4,
        merchant_index: 1,
        rank: 1,
        observed?: true
      },
      %{
        offer: offers.inactive,
        key: "named:inactive",
        product_index: 4,
        merchant_index: 2,
        rank: 2,
        observed?: true
      },
      %{
        offer: offers.unobserved,
        key: "named:unobserved",
        product_index: 5,
        merchant_index: 1,
        rank: 1,
        observed?: false
      }
    ]
  end

  defp fixture_entries(fixtures) do
    Enum.map(fixtures, fn fixture ->
      %{
        offer: %{entropy_id: fixture.entropy_id},
        key: fixture.key,
        product_index: fixture.product_index,
        merchant_index: fixture.merchant_index,
        rank: fixture.rank,
        observed?: true
      }
    end)
  end

  defp seed_history_artifacts!(source, anchor) do
    %{
      current: seed_artifact!(source, @current_hash, "generated-current", "current", anchor),
      weekly: seed_artifact!(source, @weekly_hash, "generated-weekly", "weekly", anchor),
      monthly: seed_artifact!(source, @monthly_hash, "generated-full-monthly", "monthly", anchor)
    }
  end

  defp seed_artifact!(source, hash, path, cadence, anchor) do
    attrs = %{
      source_id: source.id,
      url: "https://marketplace.example/development/prices/#{path}",
      fetched_at: anchor,
      content_hash: hash,
      raw_json: %{"purpose" => "development price history", "cadence" => cadence}
    }

    (Repo.get_by(SourceArtifact, source_id: source.id, content_hash: hash) || %SourceArtifact{})
    |> SourceArtifact.changeset(attrs)
    |> Repo.insert_or_update()
    |> Support.expect!("#{cadence} price history artifact")
  end

  defp price_rows(entries, artifacts, anchor, density) do
    Enum.flat_map(entries, fn entry ->
      if entry.observed? do
        current =
          if Map.has_key?(entry.offer, :id) and String.starts_with?(entry.key, "named:") do
            []
          else
            [price_row(entry, artifacts.current, anchor, :current, 0)]
          end

        dense? = String.starts_with?(entry.key, "named:") or entry.rank <= dense_rank(density)

        history =
          cond do
            dense? ->
              Enum.map(1..52, &price_row(entry, artifacts.weekly, anchor, :weekly, &1))

            density == :full ->
              Enum.map(1..12, &price_row(entry, artifacts.monthly, anchor, :monthly, &1))

            true ->
              []
          end

        current ++ history
      else
        []
      end
    end)
  end

  defp dense_rank(:bounded), do: 1
  defp dense_rank(:full), do: 3

  defp price_row(entry, artifact, anchor, cadence, period_index) do
    observed_at =
      case cadence do
        :current -> Map.get(entry, :last_seen_at, anchor)
        :weekly -> DateTime.add(anchor, -period_index * 7 * 86_400, :second)
        :monthly -> DateTime.add(anchor, -period_index * 30 * 86_400, :second)
      end

    base = Decimal.new(Integer.to_string(120 + rem(entry.product_index * 37, 1_800)))
    merchant_delta = Decimal.new(Integer.to_string(rem(entry.merchant_index * 11, 90)))
    time_delta = Decimal.new(Integer.to_string(rem(period_index * 7, 55)))
    price = base |> Decimal.add(merchant_delta) |> Decimal.sub(time_delta)
    point_key = "#{entry.key}:#{cadence}:#{period_index}"

    %{
      entropy_id: Support.stable_uuid("development-price-point", point_key),
      merchant_product_id: Map.get(entry.offer, :id),
      observed_at: observed_at,
      price: price,
      shipping: Decimal.new(Integer.to_string(rem(entry.merchant_index, 4) * 3)),
      in_stock: rem(entry.product_index + entry.merchant_index + period_index, 13) != 0,
      artifact_id: artifact.id,
      inserted_at: anchor
    }
  end

  defp owned_price_entropy_ids(entries) do
    placeholder_artifacts = %{
      current: %{id: nil},
      weekly: %{id: nil},
      monthly: %{id: nil}
    }

    entries
    |> price_rows(placeholder_artifacts, ~U[2000-01-01 00:00:00.000000Z], :full)
    |> Enum.map(& &1.entropy_id)
  end

  defp reconcile_price_points!(artifacts, selected_entropy_ids, full_entropy_ids, density) do
    artifact_ids = artifacts |> Map.values() |> Enum.map(& &1.id)

    obsolete_ids =
      PricePoint
      |> where([point], point.artifact_id in ^artifact_ids)
      |> select([point], {point.id, point.entropy_id})
      |> Repo.all()
      |> Enum.flat_map(fn {id, entropy_id} ->
        if MapSet.member?(full_entropy_ids, entropy_id) and
             not MapSet.member?(selected_entropy_ids, entropy_id),
           do: [id],
           else: []
      end)

    ensure_no_purchase_fact_references!(obsolete_ids)
    ensure_no_unowned_watch_references!(obsolete_ids)

    obsolete_ids
    |> Enum.chunk_every(5_000)
    |> Enum.each(fn ids ->
      AlertEvent
      |> join(:inner, [event], watch in PriceWatchRule, on: watch.id == event.watch_rule_id)
      |> where(
        [event, watch],
        event.triggering_price_point_id in ^ids and
          watch.entropy_id in ^@seed_watch_entropy_ids
      )
      |> Repo.delete_all()

      PricePoint |> where([point], point.id in ^ids) |> Repo.delete_all()
    end)

    if density == :bounded and not artifact_referenced?(artifacts.monthly.id) do
      Repo.delete!(artifacts.monthly)
    end
  end

  defp ensure_no_purchase_fact_references!([]), do: :ok

  defp ensure_no_purchase_fact_references!(price_point_ids) do
    if Repo.exists?(
         from fact in PurchasePriceFact,
           where: fact.price_observation_id in ^price_point_ids
       ) do
      raise "Refusing to delete full-only price observations referenced by purchase facts"
    end
  end

  defp ensure_no_unowned_watch_references!([]), do: :ok

  defp ensure_no_unowned_watch_references!(price_point_ids) do
    if Repo.exists?(
         from watch in PriceWatchRule,
           where:
             (watch.baseline_price_point_id in ^price_point_ids or
                watch.last_evaluated_price_point_id in ^price_point_ids) and
               (is_nil(watch.entropy_id) or watch.entropy_id not in ^@seed_watch_entropy_ids)
       ) do
      raise "Refusing to delete full-only price observations referenced by unowned watches"
    end
  end

  defp artifact_referenced?(artifact_id) do
    Enum.any?(
      [
        {PricePoint, :artifact_id},
        {Coupon, :artifact_id},
        {ClaimEvidence, :artifact_id},
        {ProductIdentifier, :source_artifact_id},
        {ProductMedia, :source_artifact_id}
      ],
      fn {schema, field_name} ->
        Repo.exists?(from record in schema, where: field(record, ^field_name) == ^artifact_id)
      end
    )
  end

  defp seed_price_rows!(rows) do
    existing_by_entropy_id = verify_price_point_ownership!(rows)

    changed_rows =
      Enum.reject(rows, fn row ->
        case Map.get(existing_by_entropy_id, row.entropy_id) do
          nil -> false
          point -> PricePoint.changeset(point, row).changes == %{}
        end
      end)

    referenced_price_point_ids =
      changed_rows
      |> Enum.flat_map(fn row ->
        case Map.get(existing_by_entropy_id, row.entropy_id) do
          nil -> []
          point -> [point.id]
        end
      end)
      |> price_point_ids_referenced_by_purchase_facts()

    changed_rows =
      Enum.reject(changed_rows, fn row ->
        case Map.get(existing_by_entropy_id, row.entropy_id) do
          nil -> false
          point -> MapSet.member?(referenced_price_point_ids, point.id)
        end
      end)

    changed_rows
    |> Enum.chunk_every(3_000)
    |> Enum.each(fn chunk ->
      Repo.insert_all(PricePoint, chunk,
        on_conflict:
          {:replace,
           [:merchant_product_id, :observed_at, :price, :shipping, :in_stock, :artifact_id]},
        conflict_target: [:entropy_id]
      )
    end)

    persisted_by_entropy_id = fetch_expected_price_point_metadata(rows)
    Enum.map(rows, &Map.fetch!(persisted_by_entropy_id, &1.entropy_id))
  end

  defp price_point_ids_referenced_by_purchase_facts([]), do: MapSet.new()

  defp price_point_ids_referenced_by_purchase_facts(price_point_ids) do
    PurchasePriceFact
    |> where([fact], fact.price_observation_id in ^price_point_ids)
    |> select([fact], fact.price_observation_id)
    |> Repo.all()
    |> MapSet.new()
  end

  defp verify_price_point_ownership!(rows) do
    expected = Map.new(rows, &{&1.entropy_id, &1.merchant_product_id})

    existing = fetch_expected_price_point_metadata(rows)

    Enum.each(existing, fn {entropy_id, metadata} ->
      if Map.fetch!(expected, entropy_id) != metadata.merchant_product_id do
        raise "Refusing to adopt generated price point #{entropy_id}"
      end
    end)

    existing
  end

  defp fetch_expected_price_point_metadata([]), do: %{}

  defp fetch_expected_price_point_metadata(rows) do
    expected_entropy_ids = MapSet.new(rows, & &1.entropy_id)
    artifact_ids = rows |> Enum.map(& &1.artifact_id) |> Enum.uniq()

    PricePoint
    |> where([point], point.artifact_id in ^artifact_ids)
    |> Repo.all()
    |> Enum.filter(&MapSet.member?(expected_entropy_ids, &1.entropy_id))
    |> Map.new(&{&1.entropy_id, &1})
  end

  defp reconcile_offers!(selected_entropy_ids, full_entropy_ids) do
    obsolete_offer_ids = obsolete_offer_ids(selected_entropy_ids, full_entropy_ids)

    reconcile_seed_offer_watches!(obsolete_offer_ids)

    for {schema, field, label} <- [
          {PricePoint, :merchant_product_id, "price points"},
          {AffiliateLink, :merchant_product_id, "affiliate links"},
          {ProductReview, :merchant_product_id, "product reviews"},
          {CommerceClickSession, :merchant_product_id, "commerce clicks"},
          {CommerceConversion, :merchant_product_id, "commerce conversions"},
          {ImportObservation, :merchant_product_id, "import observations"},
          {AlertEvent, :merchant_product_id, "alert events"}
        ] do
      ensure_no_offer_references!(schema, field, obsolete_offer_ids, label)
    end

    obsolete_offer_ids
    |> Enum.chunk_every(5_000)
    |> Enum.each(fn offer_ids ->
      MerchantProduct |> where([offer], offer.id in ^offer_ids) |> Repo.delete_all()
    end)
  end

  defp ensure_no_unowned_offer_watches!(selected_entropy_ids, full_entropy_ids) do
    obsolete_offer_ids = obsolete_offer_ids(selected_entropy_ids, full_entropy_ids)

    if Repo.exists?(
         from watch in PriceWatchRule,
           where: watch.merchant_product_id in ^obsolete_offer_ids,
           where: is_nil(watch.entropy_id) or watch.entropy_id not in ^@seed_watch_entropy_ids
       ) do
      raise "Refusing to delete full-only offers referenced by unowned watches"
    end
  end

  defp obsolete_offer_ids(selected_entropy_ids, full_entropy_ids) do
    obsolete_entropy_ids = MapSet.difference(full_entropy_ids, selected_entropy_ids)

    MerchantProduct
    |> where([offer], offer.entropy_id in ^MapSet.to_list(obsolete_entropy_ids))
    |> select([offer], offer.id)
    |> Repo.all()
  end

  defp reconcile_seed_offer_watches!([]), do: :ok

  defp reconcile_seed_offer_watches!(offer_ids) do
    watches =
      PriceWatchRule
      |> where([watch], watch.merchant_product_id in ^offer_ids)
      |> select([watch], {watch.id, watch.entropy_id})
      |> Repo.all()

    {seed_watches, unowned_watches} =
      Enum.split_with(watches, fn {_id, entropy_id} ->
        entropy_id in @seed_watch_entropy_ids
      end)

    if unowned_watches != [] do
      raise "Refusing to delete full-only offers referenced by unowned watches #{inspect(Enum.map(unowned_watches, &elem(&1, 0)))}"
    end

    seed_watch_ids = Enum.map(seed_watches, &elem(&1, 0))

    if seed_watch_ids != [] do
      AlertEvent
      |> where(
        [event],
        event.merchant_product_id in ^offer_ids and event.watch_rule_id in ^seed_watch_ids
      )
      |> Repo.delete_all()

      PriceWatchRule |> where([watch], watch.id in ^seed_watch_ids) |> Repo.delete_all()
    end

    :ok
  end

  defp ensure_no_offer_references!(_schema, _field, [], _label), do: :ok

  defp ensure_no_offer_references!(schema, field_name, offer_ids, label) do
    if Repo.exists?(from record in schema, where: field(record, ^field_name) in ^offer_ids) do
      raise "Refusing to delete full-only offers referenced by unowned #{label}"
    end
  end

  defp fetch_by_entropy_ids([], _schema), do: []

  defp fetch_by_entropy_ids(entropy_ids, schema) do
    entropy_ids
    |> Enum.chunk_every(5_000)
    |> Enum.flat_map(fn chunk ->
      schema
      |> where([record], record.entropy_id in ^chunk)
      |> Repo.all()
    end)
  end

  defp named_offer_inventory(offers) do
    Enum.map(
      [:fresh, :aging, :stale, :out_of_stock, :inactive, :unobserved],
      &Map.fetch!(offers, &1)
    )
  end
end
