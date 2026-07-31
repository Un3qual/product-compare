defmodule ProductCompareWeb.GraphQL.CatalogQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers,
    only: [capture_select_queries: 1, count_select_queries_targeting_table: 2]

  alias ProductCompare.Catalog
  alias ProductCompare.Ingestion.MediaObservation
  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareSchemas.Catalog.{Brand, ProductMedia}
  alias ProductCompareSchemas.Specs.TaxonAttribute
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact
  alias ProductCompareSchemas.Taxonomy.Taxonomy, as: TaxonomySchema

  describe "/api/graphql catalog queries" do
    test "product returns a single product by slug", %{conn: conn} do
      product =
        SpecsFixtures.product_fixture(%{
          slug: "detail-product",
          name: "Detail Product",
          description: "A detailed product description.",
          model_number: "DP-1000"
        })

      assert %{
               "data" => %{
                 "product" => %{
                   "id" => product_id,
                   "slug" => "detail-product",
                   "name" => "Detail Product",
                   "description" => "A detailed product description.",
                   "modelNumber" => "DP-1000",
                   "brand" => %{
                     "id" => brand_id,
                     "name" => _brand_name
                   }
                 }
               }
             } = graphql(conn, product_query(), %{"slug" => "detail-product"})

      assert product_id == relay_id(:product, product.id)
      assert brand_id == relay_id(:brand, product.brand_id)
    end

    test "product returns a null brand when the fixture explicitly sets brand_id to nil", %{
      conn: conn
    } do
      brand_count = Repo.aggregate(Brand, :count, :id)

      product =
        SpecsFixtures.product_fixture(%{
          brand_id: nil,
          name: "Brandless Product",
          slug: "brandless-product"
        })

      assert product.brand_id == nil
      assert Repo.aggregate(Brand, :count, :id) == brand_count

      assert %{
               "data" => %{
                 "product" => %{
                   "id" => product_id,
                   "name" => "Brandless Product",
                   "brand" => nil
                 }
               }
             } = graphql(conn, product_query(), %{"slug" => product.slug})

      assert product_id == relay_id(:product, product.id)
    end

    test "product exposes ordered source-backed media without raw artifact payloads", %{
      conn: conn
    } do
      product =
        SpecsFixtures.product_fixture(%{
          slug: "media-product",
          name: "Media Product"
        })

      source =
        %Source{}
        |> Source.changeset(%{kind: "affiliate_feed", name: "Media Source", domain: "media.test"})
        |> Repo.insert!()

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          url: "https://media.test/product",
          fetched_at: ~U[2026-07-13 18:00:00.000000Z],
          raw_json: %{"secret" => "must stay private"}
        })
        |> Repo.insert!()

      assert %{persisted: 2, rejected: 0} =
               Catalog.upsert_product_media(
                 product,
                 artifact.id,
                 [
                   %MediaObservation{
                     url: "https://cdn.test/gallery.jpg",
                     role: :gallery,
                     position: 2
                   },
                   %MediaObservation{
                     url: "https://cdn.test/primary.jpg",
                     role: :primary,
                     position: 0,
                     alt_text: "Primary view"
                   }
                 ],
                 ~U[2026-07-13 18:00:00.000000Z]
               )

      assert %{
               "data" => %{
                 "product" => %{
                   "media" => [
                     %{
                       "url" => "https://cdn.test/primary.jpg",
                       "role" => "primary",
                       "position" => 0,
                       "altText" => "Primary view",
                       "sourceArtifact" => %{
                         "sourceName" => "Media Source",
                         "url" => "https://media.test/product"
                       }
                     },
                     %{
                       "url" => "https://cdn.test/gallery.jpg",
                       "position" => 2
                     }
                   ]
                 }
               }
             } = response = graphql(conn, product_media_query(), %{"slug" => product.slug})

      refute inspect(response) =~ "must stay private"
      refute inspect(response) =~ "rawJson"
    end

    test "product media remains queryable after its source artifact is removed", %{conn: conn} do
      product =
        SpecsFixtures.product_fixture(%{
          slug: "media-without-artifact",
          name: "Media Without Artifact"
        })

      %ProductMedia{}
      |> ProductMedia.changeset(%{
        product_id: product.id,
        url: "https://cdn.test/orphaned-source.jpg",
        role: "primary",
        position: 0,
        observed_at: ~U[2026-07-13 18:00:00.000000Z]
      })
      |> Repo.insert!()

      response = graphql(conn, product_media_query(), %{"slug" => product.slug})

      assert %{
               "data" => %{
                 "product" => %{
                   "media" => [
                     %{
                       "url" => "https://cdn.test/orphaned-source.jpg",
                       "sourceArtifact" => nil
                     }
                   ]
                 }
               }
             } = response

      refute Map.has_key?(response, "errors")
    end

    test "product batches brand lookups across aliased selections", %{conn: conn} do
      first_product =
        SpecsFixtures.product_fixture(%{
          slug: "batched-product-first",
          name: "Batched Product First"
        })

      second_product =
        SpecsFixtures.product_fixture(%{
          slug: "batched-product-second",
          name: "Batched Product Second"
        })

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, aliased_products_query(), %{
            "firstSlug" => first_product.slug,
            "secondSlug" => second_product.slug
          })
        end)

      assert %{
               "data" => %{
                 "firstProduct" => %{
                   "id" => first_product_id,
                   "slug" => "batched-product-first",
                   "brand" => %{"id" => first_brand_id}
                 },
                 "secondProduct" => %{
                   "id" => second_product_id,
                   "slug" => "batched-product-second",
                   "brand" => %{"id" => second_brand_id}
                 }
               }
             } = response

      assert first_product_id == relay_id(:product, first_product.id)
      assert second_product_id == relay_id(:product, second_product.id)
      assert first_brand_id == relay_id(:brand, first_product.brand_id)
      assert second_brand_id == relay_id(:brand, second_product.brand_id)
      assert [_, _] = queries
    end

    test "product returns null for a non-existent slug", %{conn: conn} do
      assert %{
               "data" => %{
                 "product" => nil
               }
             } = graphql(conn, product_query(), %{"slug" => "non-existent-slug"})
    end

    test "comparisonProducts preserves requested order and missing positions", %{conn: conn} do
      first =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("comparison-first"),
          name: "Comparison First"
        })

      second =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("comparison-second"),
          name: "Comparison Second"
        })

      assert %{
               "data" => %{
                 "comparisonProducts" => [
                   %{"id" => second_id, "slug" => second_slug},
                   nil,
                   %{"id" => first_id, "slug" => first_slug}
                 ]
               }
             } =
               graphql(conn, comparison_products_query(), %{
                 "slugs" => [second.slug, "missing-comparison-product", first.slug]
               })

      assert second_id == relay_id(:product, second.id)
      assert second_slug == second.slug
      assert first_id == relay_id(:product, first.id)
      assert first_slug == first.slug
    end

    test "comparisonProducts rejects invalid comparison selections", %{conn: conn} do
      invalid_selections = [
        {[], "comparison slugs must contain between 1 and 3 values"},
        {["one", "two", "three", "four"], "comparison slugs must contain between 1 and 3 values"},
        {["one", ""], "comparison slugs must be unique non-blank strings"},
        {["one", " one "], "comparison slugs must be unique non-blank strings"}
      ]

      Enum.each(invalid_selections, fn {slugs, expected_message} ->
        assert %{
                 "data" => nil,
                 "errors" => [%{"message" => ^expected_message, "path" => ["comparisonProducts"]}]
               } = graphql(conn, comparison_products_query(), %{"slugs" => slugs})
      end)
    end

    test "product exposes selected current attributes", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: "attribute-demo-monitor"})
      {refresh_rate_attribute, hz_unit} = refresh_rate_attribute_with_unit_fixture()
      panel_attribute = text_attribute_fixture(%{code: "panel-type", display_name: "Panel type"})
      hdr_attribute = bool_attribute_fixture(%{code: "hdr", display_name: "HDR"})

      product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(product, refresh_rate_attribute, moderator)

      product
      |> accept_claim!(panel_attribute, %{value_text: "OLED"}, moderator)
      |> select_current_claim!(product, panel_attribute, moderator)

      product
      |> accept_claim!(hdr_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(product, hdr_attribute, moderator)

      assert %{
               "data" => %{
                 "product" => %{
                   "currentAttributes" => attributes
                 }
               }
             } = graphql(conn, product_attributes_query(), %{"slug" => product.slug})

      assert [
               %{
                 "code" => "hdr",
                 "displayName" => "HDR",
                 "dataType" => "bool",
                 "valueText" => "Yes"
               },
               %{
                 "code" => "panel-type",
                 "displayName" => "Panel type",
                 "dataType" => "text",
                 "valueText" => "OLED"
               },
               %{
                 "code" => "refresh-rate",
                 "displayName" => "Refresh rate",
                 "dataType" => "numeric",
                 "valueText" => "144 Hz"
               }
             ] = attributes
    end

    test "product current attributes expose bounded safe provenance", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      product = SpecsFixtures.product_fixture(%{slug: unique_code("provenance-product")})

      attribute =
        text_attribute_fixture(%{
          code: unique_code("provenance-panel"),
          display_name: "Panel technology"
        })

      source =
        %Source{}
        |> Source.changeset(%{
          kind: "manufacturer",
          name: unique_code("Acme manufacturer"),
          domain: "acme.example"
        })
        |> Repo.insert!()

      fetched_at = ~U[2026-07-13 18:00:00Z]

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          url: "https://acme.example/specifications/model-1",
          fetched_at: fetched_at,
          content_hash: unique_code("provenance"),
          raw_json: %{"secret" => "must not be queryable"},
          raw_text: "private source body"
        })
        |> Repo.insert!()

      long_excerpt = String.duplicate("e", 520)

      assert {:ok, claim} =
               Specs.propose_claim(product.id, attribute.id, %{value_text: "OLED"}, %{
                 source_type: :import,
                 confidence: Decimal.new("0.95"),
                 artifact_id: artifact.id,
                 excerpt: long_excerpt
               })

      assert {:ok, claim} = Specs.accept_claim(claim.id, moderator.id)

      assert {:ok, _current} =
               Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)

      assert %{
               "data" => %{
                 "product" => %{
                   "currentAttributes" => [
                     %{
                       "claimId" => claim_id,
                       "claimStatus" => "accepted",
                       "sourceType" => "import",
                       "confidence" => "0.95",
                       "evidence" => [
                         %{
                           "excerpt" => excerpt,
                           "sourceArtifact" => %{
                             "id" => artifact_id,
                             "sourceKind" => "manufacturer",
                             "sourceName" => source_name,
                             "sourceDomain" => "acme.example",
                             "url" => "https://acme.example/specifications/model-1",
                             "fetchedAt" => fetched_at_value
                           }
                         }
                       ]
                     }
                   ]
                 }
               }
             } =
               graphql(conn, product_attribute_provenance_query(), %{"slug" => product.slug})

      assert claim_id == relay_id(:product_attribute_claim, claim.id)
      assert artifact_id == relay_id(:source_artifact, artifact.id)
      assert source_name == source.name
      assert excerpt == String.duplicate("e", 500)
      assert {:ok, parsed_fetched_at, 0} = DateTime.from_iso8601(fetched_at_value)
      assert DateTime.compare(parsed_fetched_at, fetched_at) == :eq
    end

    test "product exposes typed current attribute metadata for comparisons", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

      monitor_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("metadata-monitor"),
          name: "Metadata Monitor"
        })

      product =
        SpecsFixtures.product_fixture(%{
          slug: "typed-attribute-metadata-monitor",
          primary_type_taxon: monitor_taxon
        })

      {refresh_rate_attribute, hz_unit} = refresh_rate_attribute_with_unit_fixture()

      hdr_attribute =
        bool_attribute_fixture(%{code: unique_code("metadata-hdr"), display_name: "HDR"})

      {panel_attribute, oled_option, _lcd_option} = enum_attribute_with_options_fixture()

      create_taxon_attribute!(monitor_taxon, hdr_attribute, %{
        sort_order: 1,
        is_required: false,
        compare_group_label: "Capabilities"
      })

      create_taxon_attribute!(monitor_taxon, refresh_rate_attribute, %{
        sort_order: 2,
        is_required: true,
        compare_group_label: "Performance"
      })

      create_taxon_attribute!(monitor_taxon, panel_attribute, %{
        sort_order: 3,
        is_required: false,
        compare_group_label: "Display"
      })

      product
      |> accept_claim!(hdr_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(product, hdr_attribute, moderator)

      product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(product, refresh_rate_attribute, moderator)

      product
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(product, panel_attribute, moderator)

      assert %{
               "data" => %{
                 "product" => %{
                   "currentAttributes" => attributes
                 }
               }
             } = graphql(conn, product_attribute_metadata_query(), %{"slug" => product.slug})

      hdr_code = hdr_attribute.code

      assert [
               %{
                 "code" => ^hdr_code,
                 "attributeId" => hdr_attribute_id,
                 "displayName" => "HDR",
                 "dataType" => "bool",
                 "valueText" => "Yes",
                 "sortOrder" => 1,
                 "groupLabel" => "Capabilities",
                 "isRequired" => false,
                 "numericValue" => nil,
                 "booleanValue" => true,
                 "enumOptionId" => nil,
                 "unitSymbol" => nil
               },
               %{
                 "code" => "refresh-rate",
                 "attributeId" => refresh_rate_attribute_id,
                 "displayName" => "Refresh rate",
                 "dataType" => "numeric",
                 "valueText" => "144 Hz",
                 "sortOrder" => 2,
                 "groupLabel" => "Performance",
                 "isRequired" => true,
                 "numericValue" => "144",
                 "booleanValue" => nil,
                 "enumOptionId" => nil,
                 "unitSymbol" => "Hz"
               },
               %{
                 "code" => panel_code,
                 "attributeId" => panel_attribute_id,
                 "displayName" => "Catalog Enum Filter Attribute",
                 "dataType" => "enum",
                 "valueText" => "Option A",
                 "sortOrder" => 3,
                 "groupLabel" => "Display",
                 "isRequired" => false,
                 "numericValue" => nil,
                 "booleanValue" => nil,
                 "enumOptionId" => oled_option_id,
                 "unitSymbol" => nil
               }
             ] = attributes

      assert hdr_attribute_id == relay_id(:attribute, hdr_attribute.id)
      assert refresh_rate_attribute_id == relay_id(:attribute, refresh_rate_attribute.id)
      assert panel_code == panel_attribute.code
      assert panel_attribute_id == relay_id(:attribute, panel_attribute.id)
      assert oled_option_id == relay_id(:enum_option, oled_option.id)
    end

    test "product exposes numeric current attribute metadata in base units", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("metadata-length-dim")})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: dimension,
          code: unique_code("metadata-inch"),
          symbol: "in",
          multiplier_to_base: Decimal.new("25.4")
        })

      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: unique_code("metadata-mm"),
        symbol: "mm",
        multiplier_to_base: Decimal.new("1"),
        offset_to_base: Decimal.new("0")
      })

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: unique_code("metadata-size"),
          display_name: "Screen size",
          data_type: :numeric,
          dimension_id: dimension.id
        })

      product = SpecsFixtures.product_fixture(%{slug: unique_code("metadata-inch-product")})

      product
      |> accept_claim!(
        attribute,
        %{value_num: Decimal.new("27"), unit_id: inch_unit.id},
        moderator
      )
      |> select_current_claim!(product, attribute, moderator)

      assert %{
               "data" => %{
                 "product" => %{
                   "currentAttributes" => attributes
                 }
               }
             } = graphql(conn, product_attribute_metadata_query(), %{"slug" => product.slug})

      attribute_code = attribute.code

      assert [
               %{
                 "code" => ^attribute_code,
                 "dataType" => "numeric",
                 "valueText" => "27 in",
                 "numericValue" => "685.8",
                 "unitSymbol" => "mm"
               }
             ] = attributes
    end

    test "product returns an empty currentAttributes list when no current claims exist", %{
      conn: conn
    } do
      product = SpecsFixtures.product_fixture(%{slug: "attribute-free-monitor"})

      assert %{
               "data" => %{
                 "product" => %{
                   "currentAttributes" => []
                 }
               }
             } = graphql(conn, product_attributes_query(), %{"slug" => product.slug})
    end

    test "products batches current attribute lookups for connection nodes", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      first_product = SpecsFixtures.product_fixture(%{slug: "batched-attribute-first"})
      second_product = SpecsFixtures.product_fixture(%{slug: "batched-attribute-second"})
      {refresh_rate_attribute, hz_unit} = refresh_rate_attribute_with_unit_fixture()

      first_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(first_product, refresh_rate_attribute, moderator)

      second_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("165"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(second_product, refresh_rate_attribute, moderator)

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, products_current_attributes_query(), %{"first" => 2})
        end)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => edges
                 }
               }
             } = response

      assert Enum.any?(edges, fn edge ->
               get_in(edge, ["node", "slug"]) == first_product.slug &&
                 get_in(edge, ["node", "currentAttributes"]) == [
                   %{
                     "code" => "refresh-rate",
                     "displayName" => "Refresh rate",
                     "dataType" => "numeric",
                     "valueText" => "144 Hz"
                   }
                 ]
             end)

      assert Enum.any?(edges, fn edge ->
               get_in(edge, ["node", "slug"]) == second_product.slug &&
                 get_in(edge, ["node", "currentAttributes"]) == [
                   %{
                     "code" => "refresh-rate",
                     "displayName" => "Refresh rate",
                     "dataType" => "numeric",
                     "valueText" => "165 Hz"
                   }
                 ]
             end)

      assert count_select_queries_targeting_table(queries, :product_attribute_current) == 1
      assert count_select_queries_targeting_table(queries, :taxon_attributes) == 1
    end

    test "products caches base unit symbol lookups for current attribute connection nodes", %{
      conn: conn
    } do
      moderator = AccountsFixtures.user_fixture()
      dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("batched-length-dim")})

      inch_unit =
        SpecsFixtures.unit_fixture(%{
          dimension: dimension,
          code: unique_code("batched-inch"),
          symbol: "in",
          multiplier_to_base: Decimal.new("25.4")
        })

      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: unique_code("batched-mm"),
        symbol: "mm",
        multiplier_to_base: Decimal.new("1"),
        offset_to_base: Decimal.new("0")
      })

      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: unique_code("batched-size"),
          display_name: "Screen size",
          data_type: :numeric,
          dimension_id: dimension.id
        })

      first_product = SpecsFixtures.product_fixture(%{slug: "batched-inch-first"})
      second_product = SpecsFixtures.product_fixture(%{slug: "batched-inch-second"})

      first_product
      |> accept_claim!(
        attribute,
        %{value_num: Decimal.new("27"), unit_id: inch_unit.id},
        moderator
      )
      |> select_current_claim!(first_product, attribute, moderator)

      second_product
      |> accept_claim!(
        attribute,
        %{value_num: Decimal.new("32"), unit_id: inch_unit.id},
        moderator
      )
      |> select_current_claim!(second_product, attribute, moderator)

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, products_current_attribute_metadata_query(), %{"first" => 2})
        end)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => edges
                 }
               }
             } = response

      attribute_code = attribute.code

      assert [
               %{
                 "node" => %{
                   "slug" => "batched-inch-first",
                   "currentAttributes" => [
                     %{
                       "code" => ^attribute_code,
                       "valueText" => "27 in",
                       "numericValue" => "685.8",
                       "unitSymbol" => "mm"
                     }
                   ]
                 }
               },
               %{
                 "node" => %{
                   "slug" => "batched-inch-second",
                   "currentAttributes" => [
                     %{
                       "code" => ^attribute_code,
                       "valueText" => "32 in",
                       "numericValue" => "812.8",
                       "unitSymbol" => "mm"
                     }
                   ]
                 }
               }
             ] = edges

      assert count_base_unit_symbol_queries(queries) == 1
    end

    test "products returns a paginated connection with stable ordering", %{conn: conn} do
      first_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-first", name: "Catalog First"})

      second_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-second", name: "Catalog Second"})

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "cursor" => first_cursor,
                       "node" => %{
                         "id" => first_id,
                         "slug" => "catalog-first",
                         "name" => "Catalog First",
                         "brand" => %{"id" => first_brand_id, "name" => _brand_name}
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => true,
                     "hasPreviousPage" => false,
                     "startCursor" => first_start_cursor,
                     "endCursor" => first_end_cursor
                   }
                 }
               }
             } = graphql(conn, products_query(), %{"first" => 1})

      assert first_cursor == first_start_cursor
      assert first_cursor == first_end_cursor
      assert first_id == relay_id(:product, first_product.id)
      assert first_brand_id == relay_id(:brand, first_product.brand_id)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => second_id,
                         "slug" => "catalog-second",
                         "name" => "Catalog Second",
                         "brand" => %{"id" => second_brand_id, "name" => _second_brand_name}
                       }
                     }
                   ],
                   "pageInfo" => %{
                     "hasNextPage" => false,
                     "hasPreviousPage" => true
                   }
                 }
               }
             } = graphql(conn, products_query(), %{"first" => 10, "after" => first_cursor})

      assert second_id == relay_id(:product, second_product.id)
      assert second_brand_id == relay_id(:brand, second_product.brand_id)
    end

    test "products direct no-loader fallback normalizes string-key pagination args" do
      first_product =
        SpecsFixtures.product_fixture(%{
          slug: "catalog-direct-first",
          name: "Catalog Direct First"
        })

      SpecsFixtures.product_fixture(%{
        slug: "catalog-direct-second",
        name: "Catalog Direct Second"
      })

      assert {:ok,
              %{
                edges: [
                  %{
                    node: %{id: first_product_id}
                  }
                ],
                page_info: %{has_next_page: true}
              }} = CatalogResolver.products(nil, %{"first" => 1}, %{})

      assert first_product_id == first_product.id
    end

    test "products batches brand lookups for connection nodes", %{conn: conn} do
      first_product =
        SpecsFixtures.product_fixture(%{
          slug: "catalog-batched-first",
          name: "Catalog Batched First"
        })

      second_product =
        SpecsFixtures.product_fixture(%{
          slug: "catalog-batched-second",
          name: "Catalog Batched Second"
        })

      third_product =
        SpecsFixtures.product_fixture(%{
          slug: "catalog-batched-third",
          name: "Catalog Batched Third"
        })

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, products_query(), %{"first" => 3})
        end)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => edges
                 }
               }
             } = response

      product_ids =
        edges
        |> Enum.map(&get_in(&1, ["node", "id"]))

      assert relay_id(:product, first_product.id) in product_ids
      assert relay_id(:product, second_product.id) in product_ids
      assert relay_id(:product, third_product.id) in product_ids
      assert [_, _] = queries
    end

    test "products rejects invalid cursor input", %{conn: conn} do
      SpecsFixtures.product_fixture(%{slug: "catalog-invalid-cursor"})

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, products_query(), %{"after" => "not-a-valid-cursor"})
        end)

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid cursor", "path" => ["products"]} | _]
             } = response

      assert count_select_queries_targeting_table(queries, :products) == 0
    end

    test "products rejects invalid first input", %{conn: conn} do
      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, products_query(), %{"first" => -1})
        end)

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid first", "path" => ["products"]} | _]
             } = response

      assert count_select_queries_targeting_table(queries, :products) == 0
    end

    test "products searches product and brand text fields case-insensitively", %{conn: conn} do
      {:ok, brand} = Catalog.upsert_brand(%{name: "Northstar Displays"})

      product =
        SpecsFixtures.product_fixture(%{
          brand_id: brand.id,
          name: "Aurora Gaming Monitor",
          slug: "aurora-gaming-monitor",
          model_number: "AGM-270",
          description: "A fast OLED panel for competitive play."
        })

      SpecsFixtures.product_fixture(%{
        name: "Unrelated Office Display",
        slug: "unrelated-office-display",
        model_number: "OFF-100",
        description: "A basic productivity panel."
      })

      for query <- ["AURORA", "gaming-monitor", "agm-270", "competitive", "northSTAR"] do
        assert %{
                 "data" => %{
                   "products" => %{
                     "edges" => [%{"node" => %{"id" => product_id}}]
                   }
                 }
               } = graphql(conn, products_query(), %{"filters" => %{"query" => query}})

        assert product_id == relay_id(:product, product.id)
      end
    end

    test "products treats LIKE metacharacters as literal search text", %{conn: conn} do
      percent_product =
        SpecsFixtures.product_fixture(%{
          name: "Catalog Save 50% Off",
          slug: "catalog-literal-percent"
        })

      underscore_product =
        SpecsFixtures.product_fixture(%{
          name: "Catalog 27_inch Display",
          slug: "catalog-literal-underscore"
        })

      backslash_product =
        SpecsFixtures.product_fixture(%{
          name: "Catalog C:\\Display",
          slug: "catalog-literal-backslash"
        })

      SpecsFixtures.product_fixture(%{
        name: "Catalog Save 500 Off",
        slug: "catalog-percent-wildcard-decoy"
      })

      SpecsFixtures.product_fixture(%{
        name: "Catalog 27Xinch Display",
        slug: "catalog-underscore-wildcard-decoy"
      })

      SpecsFixtures.product_fixture(%{
        name: "Catalog C:Display",
        slug: "catalog-backslash-escape-decoy"
      })

      for {query, product} <- [
            {"%", percent_product},
            {"_", underscore_product},
            {"\\", backslash_product}
          ] do
        assert %{
                 "data" => %{
                   "products" => %{
                     "edges" => [%{"node" => %{"id" => product_id}}]
                   }
                 }
               } = graphql(conn, products_query(), %{"filters" => %{"query" => query}})

        assert product_id == relay_id(:product, product.id)
      end
    end

    test "products combines text search with existing catalog filters", %{conn: conn} do
      type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

      monitor_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("search-monitor"),
          name: "Monitor"
        })

      laptop_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("search-laptop"),
          name: "Laptop"
        })

      matching_product =
        SpecsFixtures.product_fixture(%{
          name: "Aurora Monitor",
          slug: "aurora-monitor-search-match",
          primary_type_taxon: monitor_taxon
        })

      SpecsFixtures.product_fixture(%{
        name: "Aurora Laptop",
        slug: "aurora-laptop-search-non-match",
        primary_type_taxon: laptop_taxon
      })

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [%{"node" => %{"id" => product_id}}]
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "query" => "aurora",
                   "primaryTypeTaxonId" => relay_id(:taxon, monitor_taxon.id)
                 }
               })

      assert product_id == relay_id(:product, matching_product.id)
    end

    test "products normalizes blank search and rejects invalid or oversized search", %{conn: conn} do
      product = SpecsFixtures.product_fixture(%{slug: "catalog-blank-search"})

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [%{"node" => %{"id" => product_id}}]
                 }
               }
             } = graphql(conn, products_query(), %{"filters" => %{"query" => "  \t  "}})

      assert product_id == relay_id(:product, product.id)

      assert {:error, "invalid search query"} =
               CatalogResolver.products(nil, %{"filters" => %{"query" => 123}}, %{})

      assert %{
               "data" => %{"products" => nil},
               "errors" => [
                 %{"message" => "search query is too long", "path" => ["products"]} | _
               ]
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{"query" => String.duplicate("a", 101)}
               })
    end

    test "products defaults searches to relevance and explicit ID sorting overrides only order",
         %{
           conn: conn
         } do
      typo =
        SpecsFixtures.product_fixture(%{
          name: "Aurorra",
          slug: "catalog-relevance-typo"
        })

      full_text =
        SpecsFixtures.product_fixture(%{
          name: "Northern Lights Reference",
          slug: "catalog-relevance-full-text",
          description: "A studio workflow inspired by the aurora phenomenon."
        })

      contains =
        SpecsFixtures.product_fixture(%{
          name: "Display for Aurora Creators",
          slug: "catalog-relevance-contains"
        })

      prefix =
        SpecsFixtures.product_fixture(%{
          name: "Aurora Pro Display",
          slug: "catalog-relevance-prefix"
        })

      exact =
        SpecsFixtures.product_fixture(%{
          name: "Aurora",
          slug: "catalog-relevance-exact"
        })

      assert product_slugs(conn, nil, "aurora") == [
               exact.slug,
               prefix.slug,
               contains.slug,
               full_text.slug,
               typo.slug
             ]

      assert product_slugs(conn, "RELEVANCE", "aurora") == [
               exact.slug,
               prefix.slug,
               contains.slug,
               full_text.slug,
               typo.slug
             ]

      assert product_slugs(conn, "ID_ASC", "aurora") ==
               [exact, prefix, contains, full_text, typo]
               |> Enum.sort_by(& &1.id)
               |> Enum.map(& &1.slug)
    end

    test "products falls back to ID order when relevance has no query", %{conn: conn} do
      first =
        SpecsFixtures.product_fixture(%{
          name: "Zulu Relevance Fallback",
          slug: "catalog-relevance-fallback-first"
        })

      second =
        SpecsFixtures.product_fixture(%{
          name: "Alpha Relevance Fallback",
          slug: "catalog-relevance-fallback-second"
        })

      assert product_slugs(conn, "RELEVANCE") == [first.slug, second.slug]
    end

    test "products supports deterministic explicit sort modes over the same search predicate", %{
      conn: conn
    } do
      {:ok, alpha_brand} = Catalog.upsert_brand(%{name: "Alpha Brand"})
      {:ok, beta_brand} = Catalog.upsert_brand(%{name: "Beta Brand"})
      {:ok, zulu_brand} = Catalog.upsert_brand(%{name: "Zulu Brand"})

      oldest =
        SpecsFixtures.product_fixture(%{
          brand_id: beta_brand.id,
          name: "Zulu Product",
          slug: "catalog-sort-oldest",
          description: "A shared qualifier for explicit sorting."
        })
        |> Ecto.Changeset.change(inserted_at: ~U[2026-01-01 00:00:00.000000Z])
        |> Repo.update!()

      middle =
        SpecsFixtures.product_fixture(%{
          brand_id: zulu_brand.id,
          name: "Alpha Product",
          slug: "catalog-sort-middle",
          description: "A shared qualifier for explicit sorting."
        })
        |> Ecto.Changeset.change(inserted_at: ~U[2026-01-02 00:00:00.000000Z])
        |> Repo.update!()

      newest =
        SpecsFixtures.product_fixture(%{
          brand_id: alpha_brand.id,
          name: "Middle Product",
          slug: "catalog-sort-newest",
          description: "A shared qualifier for explicit sorting."
        })
        |> Ecto.Changeset.change(inserted_at: ~U[2026-01-03 00:00:00.000000Z])
        |> Repo.update!()

      SpecsFixtures.product_fixture(%{
        brand_id: alpha_brand.id,
        name: "Aardvark Unrelated Product",
        slug: "catalog-sort-unrelated",
        description: "A conventional office product."
      })
      |> Ecto.Changeset.change(inserted_at: ~U[2026-01-04 00:00:00.000000Z])
      |> Repo.update!()

      query = "shared qualifier"

      assert product_slugs(conn, "NAME_ASC", query) == [middle.slug, newest.slug, oldest.slug]

      assert product_slugs(conn, "BRAND_NAME_ASC", query) == [
               newest.slug,
               oldest.slug,
               middle.slug
             ]

      assert product_slugs(conn, "NEWEST", query) == [newest.slug, middle.slug, oldest.slug]
      assert product_slugs(conn, "ID_ASC", query) == [oldest.slug, middle.slug, newest.slug]
    end

    test "products keeps cursor pagination stable when sorted values are tied", %{conn: conn} do
      first_product =
        SpecsFixtures.product_fixture(%{
          name: "Same Product Name",
          slug: "catalog-sort-tie-first"
        })

      second_product =
        SpecsFixtures.product_fixture(%{
          name: "Same Product Name",
          slug: "catalog-sort-tie-second"
        })

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "cursor" => cursor,
                       "node" => %{"id" => first_product_id}
                     }
                   ],
                   "pageInfo" => %{"hasNextPage" => true}
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "first" => 1,
                 "filters" => %{"sort" => "NAME_ASC"}
               })

      assert first_product_id == relay_id(:product, first_product.id)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [%{"node" => %{"id" => second_product_id}}],
                   "pageInfo" => %{"hasNextPage" => false, "hasPreviousPage" => true}
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "first" => 1,
                 "after" => cursor,
                 "filters" => %{"sort" => "NAME_ASC"}
               })

      assert second_product_id == relay_id(:product, second_product.id)
    end

    test "products keeps relevance cursors stable when ranked values are tied", %{conn: conn} do
      first_product =
        SpecsFixtures.product_fixture(%{
          name: "Aurora Relay Tie",
          slug: "catalog-relevance-tie-first"
        })

      second_product =
        SpecsFixtures.product_fixture(%{
          name: "Aurora Relay Tie",
          slug: "catalog-relevance-tie-second"
        })

      assert first_product.id < second_product.id

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "cursor" => cursor,
                       "node" => %{"id" => first_product_id}
                     }
                   ],
                   "pageInfo" => %{"hasNextPage" => true}
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "first" => 1,
                 "filters" => %{"query" => "Aurora Relay Tie"}
               })

      assert first_product_id == relay_id(:product, first_product.id)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [%{"node" => %{"id" => second_product_id}}],
                   "pageInfo" => %{"hasNextPage" => false, "hasPreviousPage" => true}
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "first" => 1,
                 "after" => cursor,
                 "filters" => %{"query" => "Aurora Relay Tie"}
               })

      assert second_product_id == relay_id(:product, second_product.id)
    end

    test "products supports numeric attribute filters", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      {attribute, unit} = numeric_attribute_with_unit_fixture()

      in_range = SpecsFixtures.product_fixture(%{slug: "catalog-filter-numeric-in"})
      out_of_range = SpecsFixtures.product_fixture(%{slug: "catalog-filter-numeric-out"})

      in_range
      |> accept_claim!(attribute, %{value_num: Decimal.new("120"), unit_id: unit.id}, moderator)
      |> select_current_claim!(in_range, attribute, moderator)

      out_of_range
      |> accept_claim!(attribute, %{value_num: Decimal.new("450"), unit_id: unit.id}, moderator)
      |> select_current_claim!(out_of_range, attribute, moderator)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => only_id
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "numeric" => [
                     %{
                       "attributeId" => relay_id(:attribute, attribute.id),
                       "min" => "100.0",
                       "max" => "200.0"
                     }
                   ]
                 }
               })

      assert only_id == relay_id(:product, in_range.id)
    end

    test "products supports boolean and enum filters", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      bool_attribute = bool_attribute_fixture()
      {enum_attribute, option_a, option_b} = enum_attribute_with_options_fixture()

      matching_product = SpecsFixtures.product_fixture(%{slug: "catalog-filter-bool-enum-in"})

      non_matching_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-filter-bool-enum-out"})

      matching_product
      |> accept_claim!(bool_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(matching_product, bool_attribute, moderator)

      matching_product
      |> accept_claim!(enum_attribute, %{enum_option_id: option_a.id}, moderator)
      |> select_current_claim!(matching_product, enum_attribute, moderator)

      non_matching_product
      |> accept_claim!(bool_attribute, %{value_bool: false}, moderator)
      |> select_current_claim!(non_matching_product, bool_attribute, moderator)

      non_matching_product
      |> accept_claim!(enum_attribute, %{enum_option_id: option_b.id}, moderator)
      |> select_current_claim!(non_matching_product, enum_attribute, moderator)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => only_id
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "booleans" => [
                     %{
                       "attributeId" => relay_id(:attribute, bool_attribute.id),
                       "value" => true
                     }
                   ],
                   "enums" => [
                     %{
                       "attributeId" => relay_id(:attribute, enum_attribute.id),
                       "enumOptionId" => relay_id(:enum_option, option_a.id)
                     }
                   ]
                 }
               })

      assert only_id == relay_id(:product, matching_product.id)
    end

    test "products treats multiple enum options for one attribute as alternatives", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      {enum_attribute, option_a, option_b} = enum_attribute_with_options_fixture()

      option_a_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-filter-enum-or-a"})

      option_b_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-filter-enum-or-b"})

      option_a_product
      |> accept_claim!(enum_attribute, %{enum_option_id: option_a.id}, moderator)
      |> select_current_claim!(option_a_product, enum_attribute, moderator)

      option_b_product
      |> accept_claim!(enum_attribute, %{enum_option_id: option_b.id}, moderator)
      |> select_current_claim!(option_b_product, enum_attribute, moderator)

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => edges
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "enums" => [
                     %{
                       "attributeId" => relay_id(:attribute, enum_attribute.id),
                       "enumOptionId" => relay_id(:enum_option, option_a.id)
                     },
                     %{
                       "attributeId" => relay_id(:attribute, enum_attribute.id),
                       "enumOptionId" => relay_id(:enum_option, option_b.id)
                     }
                   ]
                 }
               })

      product_ids = Enum.map(edges, &get_in(&1, ["node", "id"]))

      assert product_ids == [
               relay_id(:product, option_a_product.id),
               relay_id(:product, option_b_product.id)
             ]
    end

    test "products supports use-case taxon filters", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      use_case_taxonomy = TaxonomyFixtures.taxonomy_fixture("use_case", "Use Case")

      gaming_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("catalog-use-case-gaming"),
          name: "Gaming"
        })

      office_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("catalog-use-case-office"),
          name: "Office"
        })

      gaming_product = SpecsFixtures.product_fixture(%{slug: "catalog-use-case-gaming"})
      office_product = SpecsFixtures.product_fixture(%{slug: "catalog-use-case-office"})

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 gaming_product.id,
                 gaming_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 office_product.id,
                 office_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => only_id
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "useCaseTaxonIds" => [relay_id(:taxon, gaming_taxon.id)]
                 }
               })

      assert only_id == relay_id(:product, gaming_product.id)
    end

    test "products rejects invalid filter IDs", %{conn: conn} do
      SpecsFixtures.product_fixture(%{slug: "catalog-filter-invalid-id"})

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid attribute id", "path" => ["products"]} | _]
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "numeric" => [
                     %{
                       "attributeId" => relay_id(:product, 123),
                       "min" => "100.0"
                     }
                   ]
                 }
               })
    end

    test "products rejects numeric ranges where min exceeds max", %{conn: conn} do
      {numeric_attribute, _unit} = numeric_attribute_with_unit_fixture()

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid numeric filter", "path" => ["products"]} | _]
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "numeric" => [
                     %{
                       "attributeId" => relay_id(:attribute, numeric_attribute.id),
                       "min" => "200",
                       "max" => "100"
                     }
                   ]
                 }
               })
    end

    test "products rejects mismatched filter attribute types", %{conn: conn} do
      text_attribute =
        text_attribute_fixture(%{
          code: unique_code("catalog-invalid-numeric-type"),
          display_name: "Not Numeric"
        })

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid numeric filter", "path" => ["products"]} | _]
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "numeric" => [
                     %{
                       "attributeId" => relay_id(:attribute, text_attribute.id),
                       "min" => "100",
                       "max" => "200"
                     }
                   ]
                 }
               })
    end

    test "products rejects boolean filters for non-boolean attributes", %{conn: conn} do
      text_attribute =
        text_attribute_fixture(%{
          code: unique_code("catalog-invalid-boolean-type"),
          display_name: "Not Boolean"
        })

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid boolean filter", "path" => ["products"]} | _]
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "booleans" => [
                     %{
                       "attributeId" => relay_id(:attribute, text_attribute.id),
                       "value" => true
                     }
                   ]
                 }
               })
    end

    test "products rejects enum options outside the filter attribute enum set", %{conn: conn} do
      {enum_attribute, _option_a, _option_b} = enum_attribute_with_options_fixture()

      {_other_enum_attribute, other_option, _other_option_b} =
        enum_attribute_with_options_fixture()

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid enum filter", "path" => ["products"]} | _]
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "enums" => [
                     %{
                       "attributeId" => relay_id(:attribute, enum_attribute.id),
                       "enumOptionId" => relay_id(:enum_option, other_option.id)
                     }
                   ]
                 }
               })
    end

    test "products treats null optional list filters as omitted", %{conn: conn} do
      product = SpecsFixtures.product_fixture(%{slug: "catalog-null-list-filters"})

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => edges
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "numeric" => nil,
                   "booleans" => nil,
                   "enums" => nil,
                   "useCaseTaxonIds" => nil
                 }
               })

      assert Enum.any?(edges, fn edge ->
               get_in(edge, ["node", "id"]) == relay_id(:product, product.id)
             end)
    end

    test "products filters by primary type taxon descendants when requested", %{conn: conn} do
      type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

      parent_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("catalog-type-parent"),
          name: "Display"
        })

      child_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          parent_id: parent_taxon.id,
          code: unique_code("catalog-type-child"),
          name: "OLED Display"
        })

      matching_product =
        SpecsFixtures.product_fixture(%{
          slug: "catalog-type-descendant-match",
          primary_type_taxon: child_taxon
        })

      _non_matching_product =
        SpecsFixtures.product_fixture(%{slug: "catalog-type-descendant-other"})

      assert %{
               "data" => %{
                 "products" => %{
                   "edges" => [
                     %{
                       "node" => %{
                         "id" => only_id
                       }
                     }
                   ]
                 }
               }
             } =
               graphql(conn, products_query(), %{
                 "filters" => %{
                   "primaryTypeTaxonId" => relay_id(:taxon, parent_taxon.id),
                   "includeTypeDescendants" => true
                 }
               })

      assert only_id == relay_id(:product, matching_product.id)
    end

    test "taxonomy fixture updates name for existing taxonomy code", %{conn: _conn} do
      taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")
      renamed_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Device Type")

      assert renamed_taxonomy.id == taxonomy.id
      assert renamed_taxonomy.name == "Device Type"

      persisted_taxonomy = Repo.get!(TaxonomySchema, taxonomy.id)
      assert persisted_taxonomy.name == "Device Type"
    end
  end

  defp products_query do
    """
    query Products($first: Int! = 50, $after: String, $filters: ProductFiltersInput) {
      products(first: $first, after: $after, filters: $filters) {
        edges {
          cursor
          node {
            id
            name
            slug
            brand {
              id
              name
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
    """
  end

  defp product_slugs(conn, sort), do: product_slugs(conn, sort, nil)

  defp product_slugs(conn, sort, query) do
    filters =
      %{}
      |> then(fn filters -> if query, do: Map.put(filters, "query", query), else: filters end)
      |> then(fn filters -> if sort, do: Map.put(filters, "sort", sort), else: filters end)

    %{
      "data" => %{
        "products" => %{
          "edges" => edges
        }
      }
    } = graphql(conn, products_query(), %{"filters" => filters})

    Enum.map(edges, &get_in(&1, ["node", "slug"]))
  end

  defp product_query do
    """
    query Product($slug: String!) {
      product(slug: $slug) {
        id
        name
        slug
        modelNumber
        description
        brand {
          id
          name
        }
      }
    }
    """
  end

  defp product_media_query do
    """
    query ProductMedia($slug: String!) {
      product(slug: $slug) {
        media {
          url
          role
          position
          altText
          observedAt
          sourceArtifact {
            sourceName
            url
          }
        }
      }
    }
    """
  end

  defp comparison_products_query do
    """
    query ComparisonProducts($slugs: [String!]!) {
      comparisonProducts(slugs: $slugs) {
        id
        slug
        name
      }
    }
    """
  end

  defp product_attributes_query do
    """
    query ProductAttributes($slug: String!) {
      product(slug: $slug) {
        currentAttributes {
          code
          displayName
          dataType
          valueText
        }
      }
    }
    """
  end

  defp product_attribute_metadata_query do
    """
    query ProductAttributeMetadata($slug: String!) {
      product(slug: $slug) {
        currentAttributes {
          attributeId
          code
          displayName
          dataType
          valueText
          sortOrder
          groupLabel
          isRequired
          numericValue
          booleanValue
          enumOptionId
          unitSymbol
        }
      }
    }
    """
  end

  defp product_attribute_provenance_query do
    """
    query ProductAttributeProvenance($slug: String!) {
      product(slug: $slug) {
        currentAttributes {
          claimId
          claimStatus
          sourceType
          confidence
          evidence {
            excerpt
            sourceArtifact {
              id
              sourceKind
              sourceName
              sourceDomain
              url
              fetchedAt
            }
          }
        }
      }
    }
    """
  end

  defp aliased_products_query do
    """
    query AliasedProducts($firstSlug: String!, $secondSlug: String!) {
      firstProduct: product(slug: $firstSlug) {
        id
        slug
        brand {
          id
        }
      }
      secondProduct: product(slug: $secondSlug) {
        id
        slug
        brand {
          id
        }
      }
    }
    """
  end

  defp products_current_attributes_query do
    """
    query ProductsCurrentAttributes($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            currentAttributes {
              code
              displayName
              dataType
              valueText
            }
          }
        }
      }
    }
    """
  end

  defp products_current_attribute_metadata_query do
    """
    query ProductsCurrentAttributeMetadata($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            currentAttributes {
              code
              valueText
              numericValue
              unitSymbol
            }
          }
        }
      }
    }
    """
  end

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp count_base_unit_symbol_queries(queries) do
    Enum.count(queries, fn query ->
      String.contains?(query, ~s(FROM "units")) and String.contains?(query, "CASE WHEN")
    end)
  end

  defp accept_claim!(product, attribute, typed_value, moderator) do
    assert {:ok, claim} =
             Specs.propose_claim(product.id, attribute.id, typed_value, %{
               source_type: :user,
               created_by: moderator.id
             })

    assert {:ok, accepted_claim} = Specs.accept_claim(claim.id, moderator.id)
    accepted_claim
  end

  defp select_current_claim!(claim, product, attribute, moderator) do
    assert {:ok, _current} =
             Specs.select_current_claim(product.id, attribute.id, claim.id, moderator.id)

    claim
  end

  defp create_taxon_attribute!(taxon, attribute, attrs) do
    %TaxonAttribute{}
    |> TaxonAttribute.changeset(
      Map.merge(
        %{
          taxon_id: taxon.id,
          attribute_id: attribute.id
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp numeric_attribute_with_unit_fixture do
    dimension =
      SpecsFixtures.dimension_fixture(%{code: unique_code("catalog-dim-numeric-filter")})

    unit =
      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: unique_code("catalog-unit-numeric-filter"),
        symbol: "cnf"
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("catalog-attr-numeric-filter"),
        display_name: "Catalog Numeric Filter Attribute",
        data_type: :numeric,
        dimension_id: dimension.id
      })

    {attribute, unit}
  end

  defp refresh_rate_attribute_with_unit_fixture do
    dimension =
      SpecsFixtures.dimension_fixture(%{code: unique_code("catalog-dim-refresh-rate")})

    unit =
      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: "hz",
        symbol: "Hz"
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: "refresh-rate",
        display_name: "Refresh rate",
        data_type: :numeric,
        dimension_id: dimension.id
      })

    {attribute, unit}
  end

  defp text_attribute_fixture(attrs) do
    SpecsFixtures.attribute_fixture(
      Map.merge(
        %{
          code: unique_code("catalog-attr-text"),
          display_name: "Catalog Text Attribute",
          data_type: :text
        },
        attrs
      )
    )
  end

  defp bool_attribute_fixture(attrs \\ %{}) do
    SpecsFixtures.attribute_fixture(
      Map.merge(
        %{
          code: unique_code("catalog-attr-bool-filter"),
          display_name: "Catalog Boolean Filter Attribute",
          data_type: :bool
        },
        attrs
      )
    )
  end

  defp enum_attribute_with_options_fixture do
    {:ok, enum_set} = Specs.upsert_enum_set(%{code: unique_code("catalog-enum-set-filter")})

    {:ok, option_a} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("catalog-enum-option-a"),
        label: "Option A",
        sort_order: 1
      })

    {:ok, option_b} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("catalog-enum-option-b"),
        label: "Option B",
        sort_order: 2
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("catalog-attr-enum-filter"),
        display_name: "Catalog Enum Filter Attribute",
        data_type: :enum,
        enum_set_id: enum_set.id
      })

    {attribute, option_a, option_b}
  end

  defp unique_code(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}"
end
