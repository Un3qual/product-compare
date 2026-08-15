defmodule ProductCompare.DevSeeds.Catalog do
  @moduledoc false

  import Ecto.Query

  alias ProductCompare.Catalog
  alias ProductCompare.DevSeeds.CorrectionSafety
  alias ProductCompare.DevSeeds.Dictionary
  alias ProductCompare.DevSeeds.Support
  alias ProductCompare.Ingestion.SpecificationObservation
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareSchemas.Catalog.Product
  alias ProductCompareSchemas.Catalog.ProductIdentifier
  alias ProductCompareSchemas.Catalog.ProductMedia
  alias ProductCompareSchemas.Specs.ClaimEvidence
  alias ProductCompareSchemas.Specs.ProductAttributeClaim
  alias ProductCompareSchemas.Specs.ProductAttributeCurrent
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Specs.TaxonAttribute
  alias ProductCompareSchemas.Taxonomy.Taxon
  alias ProductCompareSchemas.Taxonomy.ProductTaxon
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

  @source_name "Development Manufacturer Evidence"
  @artifact_hash Support.sha256("development-manufacturer-specs-v1")
  @identifier_entropy_ids %{
    monitor_16_9: "d3ca0000-0000-4000-8000-000000000401",
    monitor_ultrawide: "d3ca0000-0000-4000-8000-000000000402",
    monitor_import_feed: "d3ca0000-0000-4000-8000-000000000403",
    tv: "d3ca0000-0000-4000-8000-000000000404",
    projector: "d3ca0000-0000-4000-8000-000000000405"
  }

  @spec seed!(map(), DateTime.t(), map()) :: map()
  def seed!(
        accounts,
        %DateTime{} = anchor,
        profile \\ ProductCompare.DevSeeds.Profile.config!(:bounded)
      ) do
    Taxonomy.seed_default_taxonomies()
    |> Support.expect!("default taxonomies")

    type_taxonomy = Repo.get_by!(TaxonomySchema, code: "type")
    use_case_taxonomy = Repo.get_by!(TaxonomySchema, code: "use_case")

    taxons = seed_taxons!(type_taxonomy, use_case_taxonomy)
    definitions = seed_definitions!(taxons)
    {products, generated} = seed_products!(taxons, profile, anchor)
    all_products = named_product_inventory(products) ++ Enum.map(generated, & &1.product)
    seed_use_cases!(products, generated, taxons, accounts.admin, anchor)

    {source, artifact} = seed_source_evidence!(anchor)
    identifiers = seed_identifiers!(products, artifact, anchor)
    seed_media!(products, artifact, anchor)
    claims = seed_claims!(products, definitions, accounts, artifact)
    generated_identifiers = seed_generated_identifiers!(generated, artifact, anchor)
    seed_generated_media!(generated, artifact, anchor)
    generated_claims = seed_generated_claims!(generated, definitions, accounts, artifact)

    %{
      taxons: taxons,
      attributes: definitions.attributes,
      units: definitions.units,
      enum_options: definitions.enum_options,
      products: products,
      all_products: all_products,
      identifiers: identifiers,
      generated_identifiers: generated_identifiers,
      source: source,
      artifact: artifact,
      claims: claims,
      generated_claims: generated_claims
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
        |> Support.expect!("diagonal attribute"),
      finish:
        Specs.upsert_attribute(%{
          code: "finish",
          display_name: "Finish",
          data_type: :text,
          is_filterable: false
        })
        |> Support.expect!("finish attribute")
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

    for taxon <- [taxons.monitor, taxons.tv, taxons.projector] do
      upsert_taxon_attribute!(taxon, attributes.finish, 4, false)
    end

    %{
      attributes: attributes,
      enum_options: enum_options,
      units: %{hz: hz, inches: inches, millimeters: millimeters}
    }
  end

  defp upsert_taxon_attribute!(taxon, attribute, sort_order, required? \\ true) do
    attrs = %{
      taxon_id: taxon.id,
      attribute_id: attribute.id,
      is_required: required?,
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

  defp seed_products!(taxons, profile, anchor) do
    named = seed_named_products!(taxons)
    fixtures = Dictionary.product_fixtures(profile)
    reconcile_generated_products!(fixtures)

    brands =
      fixtures
      |> Enum.map(& &1.brand)
      |> Enum.uniq()
      |> Map.new(fn name ->
        brand = Catalog.upsert_brand(%{name: name}) |> Support.expect!("brand #{name}")
        {name, brand}
      end)

    rows =
      Enum.map(fixtures, fn fixture ->
        taxon = Map.fetch!(taxons, fixture.type)
        brand = Map.fetch!(brands, fixture.brand)

        %Product{}
        |> Product.changeset(%{
          brand_id: brand.id,
          primary_type_taxon_id: taxon.id,
          name: fixture.name,
          model_number: fixture.model_number,
          slug: fixture.slug,
          description: fixture.description
        })
        |> Support.validated_row!(
          [:brand_id, :primary_type_taxon_id, :name, :model_number, :slug, :description],
          entropy_id: Support.stable_uuid("development-product", fixture.key),
          inserted_at: anchor,
          updated_at: anchor,
          stage: "product #{fixture.slug}"
        )
      end)

    products =
      Support.sync_owned_rows!(
        Product,
        rows,
        [:brand_id, :primary_type_taxon_id, :name, :model_number, :slug, :description],
        stage: "generated products"
      )

    generated =
      Enum.zip_with(fixtures, products, fn fixture, product ->
        %{fixture: fixture, product: product}
      end)

    {named, generated}
  end

  defp seed_named_products!(taxons) do
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
        |> then(&Repo.get!(Product, &1.id))

      {key, product}
    end)
  end

  defp named_product_inventory(products) do
    Enum.map(
      [:monitor_16_9, :monitor_ultrawide, :monitor_import_feed, :tv, :projector],
      &Map.fetch!(products, &1)
    )
  end

  defp reconcile_generated_products!(fixtures) do
    expected =
      Map.new(fixtures, fn fixture ->
        {fixture.slug, Support.stable_uuid("development-product", fixture.key)}
      end)

    Product
    |> where(
      [product],
      fragment("? ~ ?", product.slug, "^dev-(mon|tv|proj)-[0-9]{3}$")
    )
    |> Repo.all()
    |> Enum.each(fn product ->
      case Map.fetch(expected, product.slug) do
        {:ok, expected_entropy_id} when expected_entropy_id == product.entropy_id ->
          :ok

        {:ok, _expected_entropy_id} ->
          raise "Refusing to adopt generated product #{product.slug} with entropy #{product.entropy_id}"

        :error ->
          reconcile_obsolete_generated_product!(product)
      end
    end)
  end

  defp reconcile_obsolete_generated_product!(product) do
    with [number] <-
           Regex.run(~r/^dev-(?:mon|tv|proj)-(\d{3})$/, product.slug, capture: :all_but_first),
         expected_entropy_id =
           Support.stable_uuid("development-product", "generated-product-#{number}"),
         true <- product.entropy_id == expected_entropy_id do
      Repo.delete!(product)
    else
      _ -> :ok
    end
  end

  defp seed_use_cases!(products, generated, taxons, admin, anchor) do
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

    use_cases = [taxons.gaming, taxons.office, taxons.creative, taxons.home_theater]

    generated_rows =
      Enum.map(generated, fn %{fixture: fixture, product: product} ->
        use_case = Enum.at(use_cases, rem(fixture.specification_index - 1, length(use_cases)))

        %ProductTaxon{}
        |> ProductTaxon.changeset(%{
          product_id: product.id,
          taxon_id: use_case.id,
          created_by: admin.id,
          source_type: :editorial,
          confidence: Decimal.new("0.80")
        })
        |> Support.validated_row!(
          [:product_id, :taxon_id, :created_by, :source_type, :confidence],
          entropy_id:
            Support.stable_uuid(
              "development-generated-product-use-case",
              "#{fixture.key}:#{use_case.code}"
            ),
          inserted_at: anchor,
          stage: "use case #{product.slug}/#{use_case.code}"
        )
      end)

    product_ids = Enum.map(generated_rows, & &1.product_id)

    existing_by_pair =
      ProductTaxon
      |> where([assignment], assignment.product_id in ^product_ids)
      |> Repo.all()
      |> Map.new(&{{&1.product_id, &1.taxon_id}, &1})

    Enum.each(generated_rows, fn row ->
      case Map.get(existing_by_pair, {row.product_id, row.taxon_id}) do
        nil ->
          :ok

        %ProductTaxon{entropy_id: entropy_id} when entropy_id == row.entropy_id ->
          :ok

        %ProductTaxon{} ->
          raise "Refusing to adopt generated use case #{row.product_id}/#{row.taxon_id}"
      end
    end)

    changed_rows =
      Enum.reject(generated_rows, fn row ->
        case Map.get(existing_by_pair, {row.product_id, row.taxon_id}) do
          nil ->
            false

          assignment ->
            assignment.created_by == row.created_by and assignment.source_type == row.source_type and
              Decimal.equal?(assignment.confidence, row.confidence)
        end
      end)

    if changed_rows != [] do
      Repo.insert_all(ProductTaxon, changed_rows,
        on_conflict: {:replace, [:created_by, :source_type, :confidence]},
        conflict_target: [:product_id, :taxon_id]
      )
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
      entropy_id = Map.fetch!(@identifier_entropy_ids, key)
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
        case Repo.get_by(ProductIdentifier, entropy_id: entropy_id) ||
               Repo.get_by(ProductIdentifier,
                 scheme: :mpn,
                 normalized_value: normalized_value,
                 verification_status: :validated
               ) do
          nil ->
            attrs
            |> Catalog.create_product_identifier()
            |> Support.expect!("MPN #{normalized_value}")
            |> Ecto.Changeset.change(entropy_id: entropy_id)
            |> Repo.update()

          %ProductIdentifier{product_id: product_id} = identifier when product_id == product.id ->
            identifier
            |> ProductIdentifier.changeset(attrs)
            |> Ecto.Changeset.change(entropy_id: entropy_id)
            |> Repo.update()

          %ProductIdentifier{product_id: conflicting_product_id} ->
            raise """
            Refusing to seed MPN #{normalized_value}: it already belongs to product #{conflicting_product_id}.
            Resolve the identifier conflict explicitly before rerunning seeds.
            """
        end
        |> Support.expect!("MPN #{normalized_value}")

      {key, identifier}
    end)
    |> Map.new()
  end

  defp seed_generated_identifiers!(generated, artifact, anchor) do
    model_numbers = Enum.map(generated, & &1.fixture.model_number)

    existing_by_value =
      ProductIdentifier
      |> where(
        [identifier],
        identifier.scheme == :mpn and identifier.verification_status == :validated and
          identifier.normalized_value in ^model_numbers
      )
      |> Repo.all()
      |> Map.new(&{&1.normalized_value, &1})

    rows =
      Enum.map(generated, fn %{fixture: fixture, product: product} ->
        entropy_id = Support.stable_uuid("development-product-identifier", fixture.key)

        case Map.get(existing_by_value, fixture.model_number) do
          nil ->
            :ok

          %ProductIdentifier{product_id: product_id, entropy_id: ^entropy_id}
          when product_id == product.id ->
            :ok

          %ProductIdentifier{} = conflicting ->
            raise "Refusing to adopt generated MPN #{fixture.model_number} from product #{conflicting.product_id}"
        end

        %ProductIdentifier{}
        |> ProductIdentifier.changeset(%{
          product_id: product.id,
          scheme: :mpn,
          normalized_value: fixture.model_number,
          display_value: fixture.model_number,
          verification_status: :validated,
          source_artifact_id: artifact.id,
          verified_at: anchor
        })
        |> Support.validated_row!(
          [
            :product_id,
            :scheme,
            :normalized_value,
            :display_value,
            :verification_status,
            :source_artifact_id,
            :verified_at
          ],
          entropy_id: entropy_id,
          inserted_at: anchor,
          updated_at: anchor,
          stage: "MPN #{fixture.model_number}"
        )
      end)

    Support.sync_owned_rows!(
      ProductIdentifier,
      rows,
      [
        :product_id,
        :scheme,
        :normalized_value,
        :display_value,
        :verification_status,
        :source_artifact_id,
        :verified_at
      ],
      stage: "generated product identifiers"
    )
  end

  defp seed_media!(products, artifact, anchor) do
    Enum.each(products, fn {_key, product} ->
      result =
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

      case result do
        %{persisted: 1, rejected: 0} ->
          :ok

        other ->
          Support.expect!({:error, other}, "media for #{product.slug}")
      end
    end)
  end

  defp seed_generated_media!(generated, artifact, anchor) do
    product_ids = Enum.map(generated, & &1.product.id)

    existing_by_pair =
      ProductMedia
      |> where([media], media.product_id in ^product_ids)
      |> Repo.all()
      |> Map.new(&{{&1.product_id, &1.url}, &1})

    rows =
      Enum.map(generated, fn %{fixture: fixture, product: product} ->
        url = "https://images.example/products/#{product.slug}.jpg"
        entropy_id = Support.stable_uuid("development-product-media", fixture.key)

        case Map.get(existing_by_pair, {product.id, url}) do
          nil -> :ok
          %ProductMedia{entropy_id: ^entropy_id} -> :ok
          %ProductMedia{} -> raise "Refusing to adopt generated media for #{product.slug}"
        end

        %ProductMedia{}
        |> ProductMedia.changeset(%{
          product_id: product.id,
          source_artifact_id: artifact.id,
          url: url,
          role: :primary,
          position: 0,
          alt_text: "Synthetic development image for #{product.name}",
          observed_at: anchor
        })
        |> Support.validated_row!(
          [:product_id, :source_artifact_id, :url, :role, :position, :alt_text, :observed_at],
          entropy_id: entropy_id,
          inserted_at: anchor,
          updated_at: anchor,
          stage: "media for #{product.slug}"
        )
      end)

    Support.sync_owned_rows!(
      ProductMedia,
      rows,
      [:product_id, :source_artifact_id, :url, :role, :position, :alt_text, :observed_at],
      stage: "generated product media"
    )
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
      restore_accepted_claim!(
        imported.claim,
        accounts.moderator,
        "imported refresh-rate claim"
      )

    select_seed_current_claim!(
      products.monitor_import_feed,
      attrs.refresh_rate,
      imported_claim,
      accounts.moderator,
      "imported refresh-rate claim"
    )

    Map.put(claims, {products.monitor_import_feed.slug, attrs.refresh_rate.code}, imported_claim)
  end

  defp seed_generated_claims!(generated, definitions, accounts, artifact) do
    attrs = definitions.attributes
    units = definitions.units
    options = definitions.enum_options
    panel_options = [options.ips, options.oled, options.mini_led]
    finishes = ["Matte Black", "Silver", "Graphite", "Warm White"]

    entries =
      Enum.flat_map(generated, fn %{fixture: fixture, product: product} ->
        index = fixture.specification_index

        typed_values = [
          {attrs.hdr_supported, %{value_bool: rem(index, 2) == 0}},
          {attrs.panel_tech,
           %{enum_option_id: Enum.at(panel_options, rem(index, length(panel_options))).id}},
          {attrs.diagonal,
           %{
             value_num: Decimal.new(Integer.to_string(24 + rem(index, 8) * 5)),
             value_num_base:
               Decimal.mult(
                 Decimal.new(Integer.to_string(24 + rem(index, 8) * 5)),
                 Decimal.new("25.4")
               ),
             unit_id: units.inches.id
           }}
        ]

        typed_values =
          if rem(index, 11) == 0 do
            typed_values
          else
            value = Decimal.new(Integer.to_string(60 + rem(index, 9) * 15))

            [
              {attrs.refresh_rate,
               %{value_num: value, value_num_base: value, unit_id: units.hz.id}}
              | typed_values
            ]
          end

        typed_values =
          if rem(index, 17) == 0 do
            [
              {attrs.finish, %{value_text: Enum.at(finishes, rem(index, length(finishes)))}}
              | typed_values
            ]
          else
            typed_values
          end

        Enum.map(typed_values, fn {attribute, typed_value} ->
          %{fixture: fixture, product: product, attribute: attribute, typed_value: typed_value}
        end)
      end)

    seed_generated_claim_rows!(entries, accounts, artifact)
  end

  @claim_value_fields [
    :value_bool,
    :value_int,
    :value_num,
    :unit_id,
    :value_num_base,
    :value_num_base_min,
    :value_num_base_max,
    :value_text,
    :value_date,
    :value_ts,
    :enum_option_id,
    :value_json
  ]

  defp seed_generated_claim_rows!(entries, accounts, artifact) do
    inserted_at = artifact.fetched_at

    rows =
      Enum.map(entries, fn entry ->
        entropy_id =
          Support.stable_uuid(
            "development-product-claim",
            "#{entry.fixture.key}:#{entry.attribute.code}"
          )

        @claim_value_fields
        |> Map.new(&{&1, nil})
        |> Map.merge(entry.typed_value)
        |> Map.merge(%{
          entropy_id: entropy_id,
          product_id: entry.product.id,
          attribute_id: entry.attribute.id,
          source_type: :user,
          status: :accepted,
          created_by: accounts.admin.id,
          confidence: Decimal.new("0.88"),
          inserted_at: inserted_at
        })
      end)

    verify_generated_claim_ownership!(rows)

    entropy_ids = Enum.map(rows, & &1.entropy_id)

    existing_claims_by_entropy_id =
      ProductAttributeClaim
      |> where([claim], claim.entropy_id in ^entropy_ids)
      |> Repo.all()
      |> Map.new(&{&1.entropy_id, &1})

    preservation_candidates =
      Enum.map(rows, fn row ->
        %{
          product_id: row.product_id,
          attribute_id: row.attribute_id,
          claim_id: get_in(existing_claims_by_entropy_id, [row.entropy_id, Access.key(:id)])
        }
      end)

    preserved_current_scopes =
      CorrectionSafety.preserved_current_scopes(preservation_candidates)

    rows_to_sync =
      Enum.reject(rows, fn row ->
        Map.has_key?(existing_claims_by_entropy_id, row.entropy_id) and
          MapSet.member?(preserved_current_scopes, {row.product_id, row.attribute_id})
      end)

    Repo.insert_all(ProductAttributeClaim, rows_to_sync,
      on_conflict:
        {:replace, [:status, :created_by, :confidence, :inserted_at] ++ @claim_value_fields},
      conflict_target: [:entropy_id]
    )

    claims =
      ProductAttributeClaim
      |> where([claim], claim.entropy_id in ^entropy_ids)
      |> Repo.all()

    claims_by_entropy_id = Map.new(claims, &{&1.entropy_id, &1})

    current_rows =
      Enum.zip(entries, rows)
      |> Enum.map(fn {entry, row} ->
        claim = Map.fetch!(claims_by_entropy_id, row.entropy_id)

        %{
          entropy_id:
            Support.stable_uuid(
              "development-product-current",
              "#{entry.fixture.key}:#{entry.attribute.code}"
            ),
          product_id: row.product_id,
          attribute_id: row.attribute_id,
          claim_id: claim.id,
          selected_by: accounts.moderator.id,
          selected_at: inserted_at,
          inserted_at: inserted_at
        }
      end)
      |> Enum.reject(fn row ->
        MapSet.member?(preserved_current_scopes, {row.product_id, row.attribute_id})
      end)

    Repo.insert_all(ProductAttributeCurrent, current_rows,
      on_conflict: {:replace, [:entropy_id, :claim_id, :selected_by, :selected_at]},
      conflict_target: [:product_id, :attribute_id]
    )

    evidence_rows =
      Enum.map(claims, fn claim ->
        %{
          entropy_id:
            Support.stable_uuid(
              "development-product-claim-evidence",
              "#{claim.entropy_id}:#{artifact.id}"
            ),
          claim_id: claim.id,
          artifact_id: artifact.id,
          excerpt: "Synthetic deterministic development specification.",
          inserted_at: inserted_at
        }
      end)

    Repo.insert_all(ClaimEvidence, evidence_rows,
      on_conflict: :nothing,
      conflict_target: [:claim_id, :artifact_id]
    )

    claims
  end

  defp verify_generated_claim_ownership!(rows) do
    expected = Map.new(rows, &{&1.entropy_id, {&1.product_id, &1.attribute_id}})

    ProductAttributeClaim
    |> where([claim], claim.entropy_id in ^Map.keys(expected))
    |> select([claim], {claim.entropy_id, claim.product_id, claim.attribute_id})
    |> Repo.all()
    |> Enum.each(fn {entropy_id, product_id, attribute_id} ->
      if Map.fetch!(expected, entropy_id) != {product_id, attribute_id} do
        raise "Refusing to adopt generated claim #{entropy_id}"
      end
    end)
  end

  defp ensure_current_claim!(product, attribute, typed_value, provenance, moderator) do
    claim =
      ProductAttributeClaim
      |> where(
        [claim],
        claim.product_id == ^product.id and claim.attribute_id == ^attribute.id and
          claim.status in [:proposed, :accepted, :superseded]
      )
      |> where(
        [claim],
        ^Enum.reduce(typed_value, dynamic(true), fn {field, value}, dynamic_query ->
          dynamic([claim], ^dynamic_query and field(claim, ^field) == ^value)
        end)
      )
      |> order_by([claim],
        asc: claim.status != :accepted,
        asc: claim.status == :proposed,
        desc: claim.id
      )
      |> limit(1)
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
      restore_accepted_claim!(claim, moderator, "claim #{product.slug}/#{attribute.code}")

    select_seed_current_claim!(
      product,
      attribute,
      claim,
      moderator,
      "claim #{product.slug}/#{attribute.code}"
    )

    claim
  end

  defp select_seed_current_claim!(product, attribute, claim, moderator, stage) do
    if CorrectionSafety.preserve_current_for_pending?(product.id, attribute.id, claim.id) do
      :ok
    else
      Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)
      |> Support.expect!("select #{stage}")
    end
  end

  defp restore_accepted_claim!(
         %ProductAttributeClaim{status: :accepted} = claim,
         _moderator,
         _stage
       ),
       do: claim

  defp restore_accepted_claim!(
         %ProductAttributeClaim{status: :proposed} = claim,
         moderator,
         stage
       ) do
    Specs.accept_claim(claim.id, moderator.id)
    |> Support.expect!("accept #{stage}")
  end

  defp restore_accepted_claim!(
         %ProductAttributeClaim{status: :superseded} = claim,
         _moderator,
         stage
       ) do
    claim
    |> ProductAttributeClaim.changeset(%{status: :accepted})
    |> Repo.update()
    |> Support.expect!("restore #{stage}")
  end

  defp restore_accepted_claim!(%ProductAttributeClaim{status: status}, _moderator, stage) do
    raise "development seed #{stage} has #{status} status"
  end
end
