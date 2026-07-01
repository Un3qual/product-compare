defmodule ProductCompareWeb.GraphQL.CatalogFilterMetadataTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy

  describe "productFilterMetadata" do
    test "returns display-safe filter metadata with Relay IDs and selected state", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")
      use_case_taxonomy = TaxonomyFixtures.taxonomy_fixture("use_case", "Use Case")

      monitor_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("gql-filter-meta-monitor"),
          name: "Monitor"
        })

      laptop_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: unique_code("gql-filter-meta-laptop"),
          name: "Laptop"
        })

      gaming_taxon =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: use_case_taxonomy.id,
          code: unique_code("gql-filter-meta-gaming"),
          name: "Gaming"
        })

      {refresh_rate_attribute, hz_unit} = numeric_attribute_with_unit_fixture()
      hdr_attribute = bool_attribute_fixture()
      {panel_attribute, oled_option, ips_option} = enum_attribute_with_options_fixture()

      matching_product =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("gql-filter-meta-match"),
          primary_type_taxon: monitor_taxon
        })

      sibling_product =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("gql-filter-meta-sibling"),
          primary_type_taxon: monitor_taxon
        })

      other_type_product =
        SpecsFixtures.product_fixture(%{
          slug: unique_code("gql-filter-meta-other-type"),
          primary_type_taxon: laptop_taxon
        })

      matching_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("144"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(matching_product, refresh_rate_attribute, moderator)

      matching_product
      |> accept_claim!(hdr_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(matching_product, hdr_attribute, moderator)

      matching_product
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(matching_product, panel_attribute, moderator)

      sibling_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("165"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(sibling_product, refresh_rate_attribute, moderator)

      sibling_product
      |> accept_claim!(hdr_attribute, %{value_bool: true}, moderator)
      |> select_current_claim!(sibling_product, hdr_attribute, moderator)

      sibling_product
      |> accept_claim!(panel_attribute, %{enum_option_id: ips_option.id}, moderator)
      |> select_current_claim!(sibling_product, panel_attribute, moderator)

      other_type_product
      |> accept_claim!(
        refresh_rate_attribute,
        %{value_num: Decimal.new("60"), unit_id: hz_unit.id},
        moderator
      )
      |> select_current_claim!(other_type_product, refresh_rate_attribute, moderator)

      other_type_product
      |> accept_claim!(hdr_attribute, %{value_bool: false}, moderator)
      |> select_current_claim!(other_type_product, hdr_attribute, moderator)

      other_type_product
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(other_type_product, panel_attribute, moderator)

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 matching_product.id,
                 gaming_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert {:ok, _} =
               Taxonomy.assign_use_case(
                 sibling_product.id,
                 gaming_taxon.id,
                 moderator.id,
                 :editorial
               )

      assert %{
               "data" => %{
                 "productFilterMetadata" => %{
                   "resultCount" => 1,
                   "typeOptions" => type_options,
                   "useCaseOptions" => use_case_options,
                   "numericFilters" => [
                     %{
                       "attributeId" => refresh_rate_id,
                       "code" => refresh_rate_code,
                       "displayName" => "Refresh Rate",
                       "unitSymbol" => "Hz",
                       "min" => "144",
                       "max" => "144",
                       "selectedMin" => "100",
                       "selectedMax" => nil
                     }
                   ],
                   "booleanFilters" => [
                     %{
                       "attributeId" => hdr_id,
                       "code" => hdr_code,
                       "displayName" => "HDR",
                       "trueCount" => 1,
                       "falseCount" => 0,
                       "selectedValue" => true
                     }
                   ],
                   "enumFilters" => [
                     %{
                       "attributeId" => panel_id,
                       "code" => panel_code,
                       "displayName" => "Panel",
                       "options" => enum_options
                     }
                   ]
                 }
               }
             } =
               graphql(conn, product_filter_metadata_query(), %{
                 "filters" => %{
                   "primaryTypeTaxonId" => relay_id(:taxon, monitor_taxon.id),
                   "numeric" => [
                     %{
                       "attributeId" => relay_id(:attribute, refresh_rate_attribute.id),
                       "min" => "100"
                     }
                   ],
                   "booleans" => [
                     %{
                       "attributeId" => relay_id(:attribute, hdr_attribute.id),
                       "value" => true
                     }
                   ],
                   "enums" => [
                     %{
                       "attributeId" => relay_id(:attribute, panel_attribute.id),
                       "enumOptionId" => relay_id(:enum_option, oled_option.id)
                     }
                   ],
                   "useCaseTaxonIds" => [relay_id(:taxon, gaming_taxon.id)]
                 }
               })

      assert refresh_rate_id == relay_id(:attribute, refresh_rate_attribute.id)
      assert refresh_rate_code == refresh_rate_attribute.code
      assert hdr_id == relay_id(:attribute, hdr_attribute.id)
      assert hdr_code == hdr_attribute.code
      assert panel_id == relay_id(:attribute, panel_attribute.id)
      assert panel_code == panel_attribute.code

      assert %{
               "id" => relay_id(:taxon, monitor_taxon.id),
               "label" => "Monitor",
               "count" => 1,
               "selected" => true,
               "disabled" => false
             } in type_options

      assert %{
               "id" => relay_id(:taxon, laptop_taxon.id),
               "label" => "Laptop",
               "count" => 0,
               "selected" => false,
               "disabled" => true
             } in type_options

      assert %{
               "id" => relay_id(:taxon, gaming_taxon.id),
               "label" => "Gaming",
               "count" => 1,
               "selected" => true,
               "disabled" => false
             } in use_case_options

      assert %{
               "id" => relay_id(:enum_option, oled_option.id),
               "label" => "OLED",
               "count" => 1,
               "selected" => true,
               "disabled" => false
             } in enum_options

      assert %{
               "id" => relay_id(:enum_option, ips_option.id),
               "label" => "IPS",
               "count" => 1,
               "selected" => false,
               "disabled" => false
             } in enum_options
    end

    test "treats multiple selected enum options for one attribute as alternatives", %{conn: conn} do
      moderator = AccountsFixtures.user_fixture()
      {panel_attribute, oled_option, ips_option} = enum_attribute_with_options_fixture()

      oled_product =
        SpecsFixtures.product_fixture(%{slug: unique_code("gql-filter-meta-enum-or-oled")})

      ips_product =
        SpecsFixtures.product_fixture(%{slug: unique_code("gql-filter-meta-enum-or-ips")})

      oled_product
      |> accept_claim!(panel_attribute, %{enum_option_id: oled_option.id}, moderator)
      |> select_current_claim!(oled_product, panel_attribute, moderator)

      ips_product
      |> accept_claim!(panel_attribute, %{enum_option_id: ips_option.id}, moderator)
      |> select_current_claim!(ips_product, panel_attribute, moderator)

      assert %{
               "data" => %{
                 "productFilterMetadata" => %{
                   "resultCount" => 2,
                   "enumFilters" => [
                     %{
                       "attributeId" => panel_attribute_id,
                       "options" => enum_options
                     }
                   ]
                 }
               }
             } =
               graphql(conn, product_filter_metadata_query(), %{
                 "filters" => %{
                   "enums" => [
                     %{
                       "attributeId" => relay_id(:attribute, panel_attribute.id),
                       "enumOptionId" => relay_id(:enum_option, oled_option.id)
                     },
                     %{
                       "attributeId" => relay_id(:attribute, panel_attribute.id),
                       "enumOptionId" => relay_id(:enum_option, ips_option.id)
                     }
                   ]
                 }
               })

      assert panel_attribute_id == relay_id(:attribute, panel_attribute.id)

      assert %{
               "id" => relay_id(:enum_option, oled_option.id),
               "label" => "OLED",
               "count" => 1,
               "selected" => true,
               "disabled" => false
             } in enum_options

      assert %{
               "id" => relay_id(:enum_option, ips_option.id),
               "label" => "IPS",
               "count" => 1,
               "selected" => true,
               "disabled" => false
             } in enum_options
    end

    test "rejects invalid filter metadata filters without leaking internals", %{conn: conn} do
      {numeric_attribute, _unit} = numeric_attribute_with_unit_fixture()

      assert %{
               "data" => nil,
               "errors" => [
                 %{"message" => "invalid numeric filter", "path" => ["productFilterMetadata"]} | _
               ]
             } =
               graphql(conn, product_filter_metadata_query(), %{
                 "filters" => %{
                   "numeric" => [
                     %{
                       "attributeId" => relay_id(:attribute, numeric_attribute.id),
                       "min" => "100",
                       "max" => "10"
                     }
                   ]
                 }
               })
    end
  end

  defp product_filter_metadata_query do
    """
    query ProductFilterMetadata($filters: ProductFiltersInput) {
      productFilterMetadata(filters: $filters) {
        resultCount
        typeOptions {
          id
          label
          count
          selected
          disabled
        }
        useCaseOptions {
          id
          label
          count
          selected
          disabled
        }
        numericFilters {
          attributeId
          code
          displayName
          unitSymbol
          min
          max
          selectedMin
          selectedMax
        }
        booleanFilters {
          attributeId
          code
          displayName
          trueCount
          falseCount
          selectedValue
        }
        enumFilters {
          attributeId
          code
          displayName
          options {
            id
            label
            count
            selected
            disabled
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

  defp numeric_attribute_with_unit_fixture do
    dimension = SpecsFixtures.dimension_fixture(%{code: unique_code("gql-filter-meta-dim")})

    unit =
      SpecsFixtures.unit_fixture(%{
        dimension: dimension,
        code: unique_code("gql-filter-meta-hz"),
        symbol: "Hz"
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("gql-filter-meta-refresh-rate"),
        display_name: "Refresh Rate",
        data_type: :numeric,
        dimension_id: dimension.id,
        is_filterable: true
      })

    {attribute, unit}
  end

  defp bool_attribute_fixture do
    SpecsFixtures.attribute_fixture(%{
      code: unique_code("gql-filter-meta-hdr"),
      display_name: "HDR",
      data_type: :bool,
      is_filterable: true
    })
  end

  defp enum_attribute_with_options_fixture do
    {:ok, enum_set} = Specs.upsert_enum_set(%{code: unique_code("gql-filter-meta-panel-set")})

    {:ok, oled_option} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("gql-filter-meta-oled"),
        label: "OLED",
        sort_order: 1
      })

    {:ok, ips_option} =
      Specs.upsert_enum_option(%{
        enum_set_id: enum_set.id,
        code: unique_code("gql-filter-meta-ips"),
        label: "IPS",
        sort_order: 2
      })

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: unique_code("gql-filter-meta-panel"),
        display_name: "Panel",
        data_type: :enum,
        enum_set_id: enum_set.id,
        is_filterable: true
      })

    {attribute, oled_option, ips_option}
  end

  defp unique_code(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}"
end
