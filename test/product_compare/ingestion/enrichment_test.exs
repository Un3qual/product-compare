defmodule ProductCompare.Ingestion.EnrichmentTest do
  use ProductCompare.DataCase, async: false

  import ProductCompare.Fixtures.CJIngestionFixtures

  alias ProductCompare.Catalog
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Ingestion
  alias ProductCompare.Ingestion.MediaObservation
  alias ProductCompare.Ingestion.NormalizedListing
  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.Ingestion.CategoryMappingCandidate
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent

  setup do
    previous = Application.get_env(:product_compare, :ingestion_auto_accept_attributes, :not_set)

    on_exit(fn ->
      case previous do
        :not_set -> Application.delete_env(:product_compare, :ingestion_auto_accept_attributes)
        value -> Application.put_env(:product_compare, :ingestion_auto_accept_attributes, value)
      end
    end)

    :ok
  end

  test "persists replay-safe media and typed claims while isolating invalid optional items" do
    source = source_fixture()
    material = attribute_fixture("material", :text)

    Application.put_env(:product_compare, :ingestion_auto_accept_attributes, %{
      "cj" => ["material"]
    })

    listing =
      listing(%{
        description: "Provider-backed description",
        manufacturer_category_path: ["Footwear", "Running shoes"],
        media: [
          %MediaObservation{
            url: "https://cdn.example/products/trail-primary.jpg",
            role: :primary,
            position: 0,
            alt_text: "Trail shoe side view"
          },
          %MediaObservation{url: "javascript:alert(1)", role: :gallery, position: 1}
        ],
        model_number: "TRAIL-42",
        specifications: [
          %SpecificationObservation{
            attribute_code: "material",
            data_type: :text,
            value: "Recycled mesh",
            confidence: Decimal.new("0.98"),
            evidence_excerpt: "upperMaterial=Recycled mesh"
          },
          %SpecificationObservation{
            attribute_code: "unknown_attribute",
            data_type: :text,
            value: "ignored"
          },
          %SpecificationObservation{
            attribute_code: "material",
            data_type: :bool,
            value: true
          }
        ]
      })

    assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)

    assert persisted.product.model_number == "TRAIL-42"
    assert persisted.product.description == "Provider-backed description"
    assert persisted.media == %{persisted: 1, rejected: 1}
    assert persisted.specifications == %{accepted: 1, persisted: 1, rejected: 2, replayed: 0}
    assert persisted.taxonomy == %{status: :candidate}
    assert %PricePoint{} = persisted.price_point

    assert [%ProductMedia{url: media_url, role: "primary", position: 0}] =
             Catalog.list_product_media(persisted.product.id)

    assert media_url == "https://cdn.example/products/trail-primary.jpg"

    assert %ProductAttributeCurrent{claim_id: claim_id} =
             Repo.get_by!(ProductAttributeCurrent,
               product_id: persisted.product.id,
               attribute_id: material.id
             )

    assert %ProductAttributeClaim{
             id: ^claim_id,
             status: :accepted,
             source_type: :import,
             value_text: "Recycled mesh",
             fingerprint: fingerprint
           } = Repo.get!(ProductAttributeClaim, claim_id)

    assert fingerprint =~ ~r/^[a-f0-9]{64}$/
    assert Repo.aggregate(ClaimEvidence, :count, :id) == 1
    assert Repo.aggregate(CategoryMappingCandidate, :count, :id) == 1

    assert {:ok, replayed} = Ingestion.persist_normalized_listing(source, listing)
    assert replayed.media == %{persisted: 1, rejected: 1}
    assert replayed.specifications == %{accepted: 1, persisted: 0, rejected: 2, replayed: 1}
    assert Repo.aggregate(ProductMedia, :count, :id) == 1
    assert Repo.aggregate(ProductAttributeClaim, :count, :id) == 1
    assert Repo.aggregate(ClaimEvidence, :count, :id) == 1

    candidate = Repo.one!(CategoryMappingCandidate)
    assert candidate.display_path == "Footwear > Running shoes"
    assert candidate.normalized_path == "footwear > running shoes"
    assert candidate.observation_count == 2
  end

  test "persists and replays numeric, date, and timestamp specification observations" do
    source = source_fixture()
    dimension = SpecsFixtures.dimension_fixture(%{code: "time"})

    unit =
      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: "hz",
        symbol: "Hz"
      })

    refresh_rate =
      SpecsFixtures.attribute_fixture(%{
        code: "refresh-rate",
        data_type: :numeric,
        dimension_id: dimension.id
      })

    release_date =
      SpecsFixtures.attribute_fixture(%{code: "release-date", data_type: :date})

    measured_at =
      SpecsFixtures.attribute_fixture(%{code: "measured-at", data_type: :timestamp})

    listing =
      listing(%{
        specifications: [
          %SpecificationObservation{
            attribute_code: refresh_rate.code,
            data_type: :numeric,
            value: Decimal.new("144"),
            unit_code: unit.code
          },
          %SpecificationObservation{
            attribute_code: release_date.code,
            data_type: :date,
            value: ~D[2026-07-22]
          },
          %SpecificationObservation{
            attribute_code: measured_at.code,
            data_type: :timestamp,
            value: ~U[2026-07-22 18:30:00Z]
          }
        ]
      })

    assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)
    assert persisted.specifications == %{accepted: 0, persisted: 3, rejected: 0, replayed: 0}

    assert %ProductAttributeClaim{value_num: value_num, unit_id: unit_id} =
             Repo.get_by!(ProductAttributeClaim,
               product_id: persisted.product.id,
               attribute_id: refresh_rate.id
             )

    assert Decimal.equal?(value_num, Decimal.new("144"))
    assert unit_id == unit.id

    assert %ProductAttributeClaim{value_date: ~D[2026-07-22]} =
             Repo.get_by!(ProductAttributeClaim,
               product_id: persisted.product.id,
               attribute_id: release_date.id
             )

    assert %ProductAttributeClaim{value_ts: value_ts} =
             Repo.get_by!(ProductAttributeClaim,
               product_id: persisted.product.id,
               attribute_id: measured_at.id
             )

    assert DateTime.compare(value_ts, ~U[2026-07-22 18:30:00Z]) == :eq

    assert {:ok, replayed} = Ingestion.persist_normalized_listing(source, listing)
    assert replayed.specifications == %{accepted: 0, persisted: 0, rejected: 0, replayed: 3}
    assert Repo.aggregate(ProductAttributeClaim, :count, :id) == 3
  end

  test "exact category aliases assign a type while provider copy only fills missing fields" do
    source = source_fixture()
    {:ok, type_taxonomy} = Taxonomy.upsert_taxonomy(%{code: "type", name: "Type"})

    {:ok, running_shoes} =
      Taxonomy.create_taxon(%{
        taxonomy_id: type_taxonomy.id,
        code: "running-shoe",
        name: "Running Shoe"
      })

    assert {:ok, _alias} =
             Taxonomy.upsert_taxon_alias(running_shoes.id, ["Footwear", "Running shoes"])

    assert {:ok, first} =
             Ingestion.persist_normalized_listing(
               source,
               listing(%{
                 description: "Initial provider description",
                 manufacturer_category_path: ["Footwear", "Running shoes"],
                 model_number: "PROVIDER-1"
               })
             )

    assert first.product.primary_type_taxon_id == running_shoes.id
    assert first.taxonomy == %{status: :mapped, taxon_id: running_shoes.id}
    assert Repo.aggregate(CategoryMappingCandidate, :count, :id) == 0

    assert {:ok, curated} =
             Catalog.update_product(first.product, %{
               description: "Curated description",
               model_number: "CURATED-1"
             })

    assert {:ok, updated} =
             Ingestion.persist_normalized_listing(
               source,
               listing(%{
                 description: "Newer provider overwrite attempt",
                 manufacturer_category_path: ["Footwear", "Running shoes"],
                 model_number: "PROVIDER-2",
                 observed_at: ~U[2026-07-13 19:00:00.000000Z]
               })
             )

    assert updated.product.id == curated.id
    assert updated.product.description == "Curated description"
    assert updated.product.model_number == "CURATED-1"
    assert updated.product.primary_type_taxon_id == running_shoes.id
  end

  test "unconfigured imported attributes remain proposed and never replace current truth" do
    source = source_fixture()
    material = attribute_fixture("material", :text)

    listing =
      listing(%{
        specifications: [
          %SpecificationObservation{
            attribute_code: "material",
            data_type: :text,
            value: "Provider mesh"
          }
        ]
      })

    assert {:ok, persisted} = Ingestion.persist_normalized_listing(source, listing)
    assert persisted.specifications.accepted == 0

    assert %ProductAttributeClaim{status: :proposed} =
             Repo.get_by!(ProductAttributeClaim,
               product_id: persisted.product.id,
               attribute_id: material.id
             )

    refute Repo.get_by(ProductAttributeCurrent,
             product_id: persisted.product.id,
             attribute_id: material.id
           )
  end

  defp attribute_fixture(code, data_type) do
    {:ok, attribute} =
      Specs.upsert_attribute(%{
        code: code,
        data_type: data_type,
        display_name: String.capitalize(code),
        is_derived: false,
        is_filterable: true,
        is_multivalued: false
      })

    attribute
  end

  defp listing(overrides) do
    struct!(
      NormalizedListing,
      Map.merge(
        %{
          source: :cj,
          external_product_id: "ENRICHED-1",
          merchant_identifier: "merchant-enriched",
          product_title: "Acme Enriched Trail Shoe",
          brand_name: "Acme",
          gtin: "00012345678905",
          merchant_name: "Trail Shop",
          merchant_domain: "trail.example",
          listing_url: "https://trail.example/products/enriched-trail-shoe",
          currency: "USD",
          amount: Decimal.new("129.99"),
          availability: :in_stock,
          observed_at: ~U[2026-07-13 18:00:00.000000Z],
          raw_payload: %{"id" => "ENRICHED-1"},
          description: nil,
          manufacturer_category_path: [],
          media: [],
          model_number: nil,
          specifications: []
        },
        overrides
      )
    )
  end
end
