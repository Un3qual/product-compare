defmodule ProductCompareWeb.GraphQL.CatalogQueriesTest do
  use ProductCompareWeb.ConnCase, async: false

  alias ProductCompare.Fixtures.AccountsFixtures
  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Fixtures.TaxonomyFixtures
  alias ProductCompare.Repo
  alias ProductCompare.Specs
  alias ProductCompare.Taxonomy
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

      assert product_id == relay_id("Product", product.id)
      assert brand_id == relay_id("Brand", product.brand_id)
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
      assert first_id == relay_id("Product", first_product.id)
      assert first_brand_id == relay_id("Brand", first_product.brand_id)

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

      assert second_id == relay_id("Product", second_product.id)
      assert second_brand_id == relay_id("Brand", second_product.brand_id)
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
                       "attributeId" => relay_id("Attribute", attribute.id),
                       "min" => "100.0",
                       "max" => "200.0"
                     }
                   ]
                 }
               })

      assert only_id == relay_id("Product", in_range.id)
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
                       "attributeId" => relay_id("Attribute", bool_attribute.id),
                       "value" => true
                     }
                   ],
                   "enums" => [
                     %{
                       "attributeId" => relay_id("Attribute", enum_attribute.id),
                       "enumOptionId" => relay_id("EnumOption", option_a.id)
                     }
                   ]
                 }
               })

      assert only_id == relay_id("Product", matching_product.id)
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
                   "useCaseTaxonIds" => [relay_id("Taxon", gaming_taxon.id)]
                 }
               })

      assert only_id == relay_id("Product", gaming_product.id)
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
                       "attributeId" => relay_id("Product", 123),
                       "min" => "100.0"
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
               get_in(edge, ["node", "id"]) == relay_id("Product", product.id)
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
                   "primaryTypeTaxonId" => relay_id("Taxon", parent_taxon.id),
                   "includeTypeDescendants" => true
                 }
               })

      assert only_id == relay_id("Product", matching_product.id)
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

  defp bool_attribute_fixture do
    SpecsFixtures.attribute_fixture(%{
      code: unique_code("catalog-attr-bool-filter"),
      display_name: "Catalog Boolean Filter Attribute",
      data_type: :bool
    })
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

  defp relay_id(type, local_id), do: Base.encode64("#{type}:#{local_id}")
end
