defmodule ProductCompare.DevSeeds.Catalog do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Specs.TaxonAttribute
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

  @source_name "Development Manufacturer Evidence"
  @artifact_hash "development-manufacturer-specs-v1"

  @spec seed!(map(), DateTime.t()) :: map()
  def seed!(accounts, %DateTime{} = anchor) do
    Taxonomy.seed_default_taxonomies()
    |> Support.expect!("default taxonomies")

    type_taxonomy = Repo.get_by!(TaxonomySchema, code: "type")
    use_case_taxonomy = Repo.get_by!(TaxonomySchema, code: "use_case")

    taxons = seed_taxons!(type_taxonomy, use_case_taxonomy)
    definitions = seed_definitions!(taxons)
    products = seed_products!(taxons)
    seed_use_cases!(products, taxons, accounts.admin)

    {source, artifact} = seed_source_evidence!(anchor)
    identifiers = seed_identifiers!(products, artifact, anchor)
    seed_media!(products, artifact, anchor)
    claims = seed_claims!(products, definitions, accounts, artifact)

    %{
      taxons: taxons,
      attributes: definitions.attributes,
      units: definitions.units,
      enum_options: definitions.enum_options,
      products: products,
      identifiers: identifiers,
      source: source,
      artifact: artifact,
      claims: claims
    }
  end

  defp seed_taxons!(type_taxonomy, use_case_taxonomy) do
    electronics = upsert_taxon!(type_taxonomy, "electronics", "Electronics", nil)
    displays = upsert_taxon!(type_taxonomy, "displays", "Displays", electronics)
    tv = upsert_taxon!(type_taxonomy, "tv", "TV", displays)
    monitor = upsert_taxon!(type_taxonomy, "monitor", "Monitor", displays)
    projector = upsert_taxon!(type_taxonomy, "projector", "Projector", displays)

    search_taxons =
      for {key, taxon, slug, description} <- [
            {:tv, tv, "tvs",
             "Compare television display specifications, accepted source evidence, and complete current offer observations."},
            {:monitor, monitor, "monitors",
             "Compare monitor display specifications, accepted source evidence, and complete current offer observations."},
            {:projector, projector, "projectors",
             "Compare projector image specifications, accepted source evidence, and complete current offer observations."}
          ],
          into: %{} do
        updated_taxon =
          Taxonomy.update_taxon(taxon, %{
            seo_slug: slug,
            seo_description: description,
            seo_indexable: true
          })
          |> Support.expect!("search metadata for #{taxon.code}")

        {key, updated_taxon}
      end

    desktop_setup =
      upsert_taxon!(use_case_taxonomy, "desktop_setup", "Desktop Setup", nil)

    %{
      electronics: electronics,
      displays: displays,
      tv: search_taxons.tv,
      monitor: search_taxons.monitor,
      projector: search_taxons.projector,
      desktop_setup: desktop_setup,
      gaming: upsert_taxon!(use_case_taxonomy, "gaming", "Gaming", desktop_setup),
      office: upsert_taxon!(use_case_taxonomy, "office", "Office", desktop_setup),
      creative: upsert_taxon!(use_case_taxonomy, "creative", "Creative", desktop_setup),
      home_theater: upsert_taxon!(use_case_taxonomy, "home_theater", "Home Theater", nil)
    }
  end

  defp upsert_taxon!(taxonomy, code, name, parent) do
    parent_id = if parent, do: parent.id, else: nil

    case Repo.get_by(Taxon, taxonomy_id: taxonomy.id, code: code) do
      nil ->
        Taxonomy.create_taxon(%{
          taxonomy_id: taxonomy.id,
          parent_id: parent_id,
          code: code,
          name: name
        })
        |> Support.expect!("taxon #{code}")

      taxon ->
        taxon =
          if taxon.parent_id == parent_id do
            taxon
          else
            Taxonomy.move_taxon(taxon.id, parent_id)
            |> Support.expect!("taxon parent #{code}")
          end

        Taxonomy.update_taxon(taxon, %{name: name})
        |> Support.expect!("taxon name #{code}")
    end
  end

  defp seed_definitions!(taxons) do
    frequency_dimension =
      Specs.upsert_dimension(%{code: "frequency", description: "Frequency values"})
      |> Support.expect!("frequency dimension")

    length_dimension =
      Specs.upsert_dimension(%{code: "length", description: "Length values"})
      |> Support.expect!("length dimension")

    hz =
      Specs.upsert_unit(%{
        dimension_id: frequency_dimension.id,
        code: "hz",
        symbol: "Hz",
        multiplier_to_base: Decimal.new("1"),
        offset_to_base: Decimal.new("0")
      })
      |> Support.expect!("hertz unit")

    inches =
      Specs.upsert_unit(%{
        dimension_id: length_dimension.id,
        code: "in",
        symbol: "in",
        multiplier_to_base: Decimal.new("25.4"),
        offset_to_base: Decimal.new("0")
      })
      |> Support.expect!("inch unit")

    millimeters =
      Specs.upsert_unit(%{
        dimension_id: length_dimension.id,
        code: "mm",
        symbol: "mm",
        multiplier_to_base: Decimal.new("1"),
        offset_to_base: Decimal.new("0")
      })
      |> Support.expect!("millimeter unit")

    panel_set =
      Specs.upsert_enum_set(%{code: "panel_tech"})
      |> Support.expect!("panel technology enum")

    enum_options =
      for {code, label, order} <- [
            {"ips", "IPS", 0},
            {"va", "VA", 1},
            {"oled", "OLED", 2},
            {"qd_oled", "QD-OLED", 3},
            {"mini_led", "Mini LED", 4}
          ],
          into: %{} do
        option =
          Specs.upsert_enum_option(%{
            enum_set_id: panel_set.id,
            code: code,
            label: label,
            sort_order: order
          })
          |> Support.expect!("panel technology option #{code}")

        {String.to_atom(code), option}
      end

    attributes = %{
      refresh_rate:
        Specs.upsert_attribute(%{
          code: "refresh_rate",
          display_name: "Refresh Rate",
          data_type: :numeric,
          dimension_id: frequency_dimension.id,
          is_filterable: true
        })
        |> Support.expect!("refresh rate attribute"),
      hdr_supported:
        Specs.upsert_attribute(%{
          code: "hdr_supported",
          display_name: "HDR Supported",
          data_type: :bool,
          is_filterable: true
        })
        |> Support.expect!("HDR attribute"),
      panel_tech:
        Specs.upsert_attribute(%{
          code: "panel_tech",
          display_name: "Panel Technology",
          data_type: :enum,
          enum_set_id: panel_set.id,
          is_filterable: true
        })
        |> Support.expect!("panel technology attribute"),
      diagonal:
        Specs.upsert_attribute(%{
          code: "diagonal",
          display_name: "Diagonal",
          data_type: :numeric,
          dimension_id: length_dimension.id,
          is_filterable: true
        })
        |> Support.expect!("diagonal attribute")
    }

    for taxon <- [taxons.monitor, taxons.tv, taxons.projector],
        {attribute, sort_order} <-
          Enum.with_index([
            attributes.diagonal,
            attributes.panel_tech,
            attributes.refresh_rate,
            attributes.hdr_supported
          ]) do
      upsert_taxon_attribute!(taxon, attribute, sort_order)
    end

    %{
      attributes: attributes,
      enum_options: enum_options,
      units: %{hz: hz, inches: inches, millimeters: millimeters}
    }
  end

  defp upsert_taxon_attribute!(taxon, attribute, sort_order) do
    attrs = %{
      taxon_id: taxon.id,
      attribute_id: attribute.id,
      is_required: true,
      sort_order: sort_order,
      min_rep_to_edit: 0,
      compare_group_label: "Display"
    }

    (Repo.get_by(TaxonAttribute, taxon_id: taxon.id, attribute_id: attribute.id) ||
       %TaxonAttribute{})
    |> TaxonAttribute.changeset(attrs)
    |> Repo.insert_or_update()
    |> Support.expect!("#{taxon.code} attribute #{attribute.code}")
  end

  defp seed_products!(taxons) do
    brand =
      Catalog.upsert_brand(%{name: "Acme Display"})
      |> Support.expect!("Acme Display brand")

    [
      {:monitor_16_9, taxons.monitor, "Acme Vision 27G", "AV27G", "acme-vision-27g",
       "27 inch 16:9 high-refresh monitor with HDR and QD-OLED panel"},
      {:monitor_ultrawide, taxons.monitor, "Acme Vision 27UW", "AV27UW", "acme-vision-27uw",
       "Ultrawide monitor with 27-inch 16:9 height equivalent"},
      {:monitor_import_feed, taxons.monitor, "Acme Vision 27I Import", "AV27I",
       "acme-vision-27i-import",
       "Import-feed sample monitor used to validate claim backfill workflow"},
      {:tv, taxons.tv, "Acme Cinema 55O", "AC55O", "acme-cinema-55o",
       "55 inch OLED television with HDR and a 120 Hz refresh rate"},
      {:projector, taxons.projector, "Acme Beam 4K", "AB4K", "acme-beam-4k",
       "4K home-theater projector with an IPS imaging panel and a 60 Hz refresh rate"}
    ]
    |> Map.new(fn {key, taxon, name, model_number, slug, description} ->
      attrs = %{
        brand_id: brand.id,
        primary_type_taxon_id: taxon.id,
        name: name,
        model_number: model_number,
        slug: slug,
        description: description
      }

      product =
        case Repo.get_by(Product, slug: slug) do
          nil -> Catalog.create_product(attrs)
          product -> Catalog.update_product(product, attrs)
        end
        |> Support.expect!("product #{slug}")

      {key, product}
    end)
  end

  defp seed_use_cases!(products, taxons, admin) do
    for {product, use_case, confidence} <- [
          {products.monitor_16_9, taxons.gaming, "0.95"},
          {products.monitor_16_9, taxons.office, "0.85"},
          {products.monitor_ultrawide, taxons.creative, "0.90"},
          {products.monitor_ultrawide, taxons.home_theater, "0.60"},
          {products.monitor_import_feed, taxons.office, "0.75"},
          {products.tv, taxons.home_theater, "0.98"},
          {products.projector, taxons.home_theater, "0.92"}
        ] do
      Taxonomy.assign_use_case(
        product.id,
        use_case.id,
        admin.id,
        :editorial,
        Decimal.new(confidence)
      )
      |> Support.expect!("use case #{product.slug}/#{use_case.code}")
    end
  end

  defp seed_source_evidence!(anchor) do
    source_attrs = %{
      kind: "manufacturer",
      name: @source_name,
      domain: "manufacturer.example"
    }

    source =
      (Repo.get_by(Source, kind: "manufacturer", name: @source_name) || %Source{})
      |> Source.changeset(source_attrs)
      |> Repo.insert_or_update()
      |> Support.expect!("manufacturer evidence source")

    artifact_attrs = %{
      source_id: source.id,
      url: "https://manufacturer.example/development/acme-display-specifications",
      fetched_at: anchor,
      content_hash: @artifact_hash,
      raw_json: %{
        "synthetic" => true,
        "purpose" => "development feature testing",
        "models" => ["AV27I", "AC55O", "AB4K"]
      }
    }

    artifact =
      (Repo.get_by(SourceArtifact, source_id: source.id, content_hash: @artifact_hash) ||
         %SourceArtifact{})
      |> SourceArtifact.changeset(artifact_attrs)
      |> Repo.insert_or_update()
      |> Support.expect!("manufacturer evidence artifact")

    {source, artifact}
  end

  defp seed_identifiers!(products, artifact, anchor) do
    products
    |> Enum.map(fn {key, product} ->
      normalized_value = product.model_number

      attrs = %{
        product_id: product.id,
        scheme: :mpn,
        normalized_value: normalized_value,
        display_value: normalized_value,
        verification_status: :validated,
        source_artifact_id: artifact.id,
        verified_at: anchor
      }

      identifier =
        case Repo.get_by(ProductIdentifier, scheme: :mpn, normalized_value: normalized_value) do
          nil ->
            Catalog.create_product_identifier(attrs)

          identifier ->
            identifier
            |> ProductIdentifier.changeset(attrs)
            |> Repo.update()
        end
        |> Support.expect!("MPN #{normalized_value}")

      {key, identifier}
    end)
    |> Map.new()
  end

  defp seed_media!(products, artifact, anchor) do
    Enum.each(products, fn {_key, product} ->
      %{persisted: 1, rejected: 0} =
        Catalog.upsert_product_media(
          product,
          artifact.id,
          [
            %{
              url: "https://images.example/products/#{product.slug}.jpg",
              role: :primary,
              position: 0,
              alt_text: "Synthetic development image for #{product.name}"
            }
          ],
          anchor
        )
    end)
  end

  defp seed_claims!(products, definitions, accounts, artifact) do
    attrs = definitions.attributes
    units = definitions.units
    options = definitions.enum_options

    editorial = %{
      source_type: :user,
      created_by: accounts.admin.id,
      confidence: Decimal.new("0.90")
    }

    claims =
      [
        {products.monitor_16_9, attrs.refresh_rate,
         %{value_num: Decimal.new("165"), unit_id: units.hz.id}},
        {products.monitor_16_9, attrs.hdr_supported, %{value_bool: true}},
        {products.monitor_16_9, attrs.panel_tech, %{enum_option_id: options.qd_oled.id}},
        {products.monitor_16_9, attrs.diagonal,
         %{value_num: Decimal.new("27"), unit_id: units.inches.id}},
        {products.monitor_ultrawide, attrs.refresh_rate,
         %{value_num: Decimal.new("144"), unit_id: units.hz.id}},
        {products.monitor_ultrawide, attrs.hdr_supported, %{value_bool: true}},
        {products.monitor_ultrawide, attrs.panel_tech, %{enum_option_id: options.mini_led.id}},
        {products.monitor_ultrawide, attrs.diagonal,
         %{value_num: Decimal.new("27"), unit_id: units.inches.id}},
        {products.monitor_import_feed, attrs.hdr_supported, %{value_bool: true}},
        {products.monitor_import_feed, attrs.panel_tech, %{enum_option_id: options.ips.id}},
        {products.monitor_import_feed, attrs.diagonal,
         %{value_num: Decimal.new("27"), unit_id: units.inches.id}},
        {products.tv, attrs.refresh_rate, %{value_num: Decimal.new("120"), unit_id: units.hz.id}},
        {products.tv, attrs.hdr_supported, %{value_bool: true}},
        {products.tv, attrs.panel_tech, %{enum_option_id: options.oled.id}},
        {products.tv, attrs.diagonal, %{value_num: Decimal.new("55"), unit_id: units.inches.id}},
        {products.projector, attrs.refresh_rate,
         %{value_num: Decimal.new("60"), unit_id: units.hz.id}},
        {products.projector, attrs.hdr_supported, %{value_bool: false}},
        {products.projector, attrs.panel_tech, %{enum_option_id: options.ips.id}},
        {products.projector, attrs.diagonal,
         %{value_num: Decimal.new("120"), unit_id: units.inches.id}}
      ]
      |> Map.new(fn {product, attribute, typed_value} ->
        claim =
          ensure_current_claim!(product, attribute, typed_value, editorial, accounts.moderator)

        {{product.slug, attribute.code}, claim}
      end)

    imported =
      Specs.import_observation(
        products.monitor_import_feed.id,
        artifact.id,
        "development",
        %SpecificationObservation{
          attribute_code: "refresh_rate",
          data_type: :numeric,
          value: Decimal.new("180"),
          unit_code: "hz",
          confidence: Decimal.new("0.94"),
          evidence_excerpt: "Synthetic manufacturer sheet lists a 180 Hz refresh rate."
        }
      )
      |> Support.expect!("imported refresh-rate observation")

    imported_claim =
      case imported.claim.status do
        :accepted ->
          imported.claim

        :proposed ->
          Specs.accept_claim(imported.claim.id, accounts.moderator.id)
          |> Support.expect!("accept imported refresh-rate claim")
      end

    Specs.select_current_claim(
      products.monitor_import_feed.id,
      attrs.refresh_rate.id,
      imported_claim.id,
      accounts.moderator.id
    )
    |> Support.expect!("select imported refresh-rate claim")

    Map.put(claims, {products.monitor_import_feed.slug, attrs.refresh_rate.code}, imported_claim)
  end

  defp ensure_current_claim!(product, attribute, typed_value, provenance, moderator) do
    claim =
      ProductAttributeClaim
      |> where(
        [claim],
        claim.product_id == ^product.id and claim.attribute_id == ^attribute.id and
          claim.status in [:proposed, :accepted]
      )
      |> where(
        [claim],
        ^Enum.reduce(typed_value, dynamic(true), fn {field, value}, dynamic_query ->
          dynamic([claim], ^dynamic_query and field(claim, ^field) == ^value)
        end)
      )
      |> order_by([claim], asc: claim.id)
      |> Repo.one()

    claim =
      case claim do
        nil ->
          Specs.propose_claim(product.id, attribute.id, typed_value, provenance)
          |> Support.expect!("claim #{product.slug}/#{attribute.code}")

        claim ->
          claim
      end

    claim =
      case claim.status do
        :accepted ->
          claim

        :proposed ->
          Specs.accept_claim(claim.id, moderator.id)
          |> Support.expect!("accept claim #{product.slug}/#{attribute.code}")

        other ->
          raise "development seed claim #{product.slug}/#{attribute.code} has #{other} status"
      end

    Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)
    |> Support.expect!("current claim #{product.slug}/#{attribute.code}")

    claim
  end
end
