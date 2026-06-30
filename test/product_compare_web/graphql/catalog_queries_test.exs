defmodule ProductCompareWeb.GraphQL.CatalogQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
  alias ProductCompareWeb.Resolvers.CatalogResolver
  alias ProductCompareSchemas.Specs.TaxonAttribute
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
      assert length(queries) == 3
    end

    test "product returns null for a non-existent slug", %{conn: conn} do
      assert %{
               "data" => %{
                 "product" => nil
               }
             } = graphql(conn, product_query(), %{"slug" => "non-existent-slug"})
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

      assert count_queries_targeting_table(queries, :product_attribute_current) == 1
      assert count_queries_targeting_table(queries, :taxon_attributes) == 1
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

    test "products resolver normalizes string-key pagination args" do
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
      assert length(queries) == 2
    end

    test "products rejects invalid cursor input", %{conn: conn} do
      SpecsFixtures.product_fixture(%{slug: "catalog-invalid-cursor"})

      assert %{
               "data" => %{"products" => nil},
               "errors" => [%{"message" => "invalid cursor", "path" => ["products"]} | _]
             } = graphql(conn, products_query(), %{"after" => "not-a-valid-cursor"})
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
    query Products($first: Int, $after: String, $filters: ProductFiltersInput) {
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

  defp graphql(conn, query, variables) do
    conn
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  defp capture_select_queries(fun) do
    handler_id = {__MODULE__, System.unique_integer([:positive])}
    ref = make_ref()
    test_pid = self()

    :ok =
      :telemetry.attach(
        handler_id,
        [:product_compare, :repo, :query],
        fn _event, _measurements, metadata, {pid, message_ref} ->
          if select_query?(metadata.query) do
            send(pid, {message_ref, metadata.query})
          end
        end,
        {test_pid, ref}
      )

    try do
      result = fun.()
      {result, drain_queries(ref, [])}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp drain_queries(ref, acc) do
    receive do
      {^ref, query} -> drain_queries(ref, [query | acc])
    after
      0 -> Enum.reverse(acc)
    end
  end

  defp select_query?(query) when is_binary(query) do
    query
    |> String.trim_leading()
    |> String.upcase()
    |> String.starts_with?("SELECT")
  end

  defp count_queries_targeting_table(queries, table) when is_atom(table) do
    Enum.count(queries, &String.contains?(&1, ~s(FROM "#{table}")))
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
