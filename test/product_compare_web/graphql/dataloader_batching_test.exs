defmodule ProductCompareWeb.GraphQL.DataloaderBatchingTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.{
    Accounts,
    Alerts,
    Affiliate,
    Catalog,
    ComparisonSnapshots,
    Discussions,
    Pricing,
    Specs
  }

  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures, TaxonomyFixtures}
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.{Source, SourceArtifact}

  @tracked_tables ~w(products brands merchant_products merchants price_points)a
  @public_node_tables ~w(products brands merchants merchant_products price_points source_artifacts sources)a
  @product_evidence_tables ~w(product_media product_attribute_current product_reviews merchant_products price_points)a
  @community_connection_tables ~w(product_reviews product_threads thread_posts)a
  @viewer_submission_tables ~w(product_reviews product_threads thread_posts)a
  @offer_connection_tables ~w(merchant_products coupons price_points)a
  @merchant_offer_connection_tables ~w(merchant_products price_points)a
  @category_tables ~w(taxons products)a
  @comparison_root_tables ~w(products product_attribute_current merchant_products price_points)a
  @owner_management_collections ~w(specification_corrections price_watches alert_events api_tokens saved_comparison_sets comparison_snapshots)a
  @public_opaque_tables ~w(source_artifacts sources product_threads thread_posts comparison_snapshots)a
  @authorized_node_tables ~w(affiliate_networks affiliate_programs affiliate_links coupons saved_comparison_sets api_tokens saved_comparison_items products)a
  @evidence_description "Evidence-rich product description for careful shoppers considering performance, value, compatibility, and trusted retail availability."

  describe "/api/graphql dataloader batching" do
    test "single request keeps dataloader-backed field batches bounded", %{
      conn: conn,
      test: test_name
    } do
      first_product =
        SpecsFixtures.product_fixture(%{
          slug: "#{test_name}-first-product",
          name: "First Batched Product"
        })

      second_product =
        SpecsFixtures.product_fixture(%{
          slug: "#{test_name}-second-product",
          name: "Second Batched Product"
        })

      merchant_products =
        1..4
        |> Enum.map(fn index ->
          merchant =
            merchant_fixture(%{
              name: unique_name("Bounded Merchant #{index}"),
              domain: unique_domain("bounded-#{index}")
            })

          merchant_product =
            merchant_product_fixture(%{
              merchant: merchant,
              product: first_product,
              is_active: true
            })

          {:ok, latest_price} =
            Pricing.add_price_point(%{
              merchant_product_id: merchant_product.id,
              observed_at:
                DateTime.utc_now()
                |> DateTime.add(index, :second)
                |> DateTime.truncate(:microsecond),
              price: Decimal.new("#{200 + index}.99")
            })

          {merchant_product, merchant, latest_price}
        end)

      {response, queries} =
        capture_select_queries(fn ->
          graphql(conn, batching_query(), %{
            "firstSlug" => first_product.slug,
            "secondSlug" => second_product.slug,
            "input" => %{
              "productId" => relay_id(:product, first_product.id),
              "first" => 10
            }
          })
        end)

      relevant_queries = Enum.filter(queries, &relevant_query?/1)
      query_counts = count_queries_by_table(relevant_queries)

      assert %{
               "data" => %{
                 "firstProduct" => %{
                   "id" => first_product_id,
                   "brand" => %{"id" => first_brand_id}
                 },
                 "secondProduct" => %{
                   "id" => second_product_id,
                   "brand" => %{"id" => second_brand_id}
                 },
                 "merchantProducts" => %{
                   "edges" => edges
                 }
               }
             } = response

      assert first_product_id == relay_id(:product, first_product.id)
      assert second_product_id == relay_id(:product, second_product.id)
      assert first_brand_id == relay_id(:brand, first_product.brand_id)
      assert second_brand_id == relay_id(:brand, second_product.brand_id)
      assert [_, _, _, _] = edges

      Enum.each(merchant_products, fn {merchant_product, merchant, latest_price} ->
        assert Enum.any?(edges, fn edge ->
                 edge["node"] == %{
                   "id" => relay_id(:merchant_product, merchant_product.id),
                   "merchant" => %{
                     "id" => relay_id(:merchant, merchant.id),
                     "name" => merchant.name
                   },
                   "product" => %{
                     "id" => relay_id(:product, first_product.id),
                     "slug" => first_product.slug
                   },
                   "latestPrice" => %{
                     "id" => relay_id(:price_point, latest_price.id),
                     "price" => Decimal.to_string(latest_price.price)
                   }
                 }
               end)
      end)

      assert query_counts == %{
               products: 2,
               brands: 1,
               merchant_products: 1,
               merchants: 1,
               price_points: 1
             }
    end

    test "public node aliases keep values and SELECT budgets fixed per schema as aliases grow",
         %{conn: conn, test: test_name} do
      records = public_node_records("#{test_name}-#{System.unique_integer([:positive])}", 1..6)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, public_node_batch_query(Enum.take(records, 3)), %{})
        end)

      assert_public_node_values(initial_response, Enum.take(records, 3))
      initial_budget = public_node_query_budget(initial_queries)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, public_node_batch_query(records), %{})
        end)

      assert_public_node_values(grown_response, records)
      grown_budget = public_node_query_budget(grown_queries)

      assert {initial_budget, grown_budget} == {
               %{
                 products: 1,
                 brands: 1,
                 merchants: 1,
                 merchant_products: 1,
                 price_points: 1,
                 source_artifacts: 1,
                 sources: 1
               },
               initial_budget
             }
    end

    test "comparison root aliases preserve values and fixed SELECT budgets as aliases grow",
         %{conn: conn, test: test_name} do
      records =
        for index <- 1..4 do
          comparison_root_record("#{test_name}-#{System.unique_integer([:positive])}", index)
        end

      {two_response, two_queries} =
        capture_select_queries(fn ->
          graphql(conn, comparison_root_batch_query(Enum.take(records, 2)), %{})
        end)

      assert_comparison_root_values(two_response, Enum.take(records, 2))
      two_budget = comparison_root_query_budget(two_queries)

      {four_response, four_queries} =
        capture_select_queries(fn ->
          graphql(conn, comparison_root_batch_query(records), %{})
        end)

      assert_comparison_root_values(four_response, records)
      four_budget = comparison_root_query_budget(four_queries)

      assert {two_budget, four_budget} == {
               %{
                 products: 3,
                 product_attribute_current: 1,
                 merchant_products: 1,
                 price_points: 1
               },
               two_budget
             }
    end

    for collection <- @owner_management_collections do
      test "#{collection} owner connection aliases preserve values, authorization, and fixed SELECT budgets as aliases grow",
           %{conn: conn} do
        collection = unquote(collection)
        owner = AccountsFixtures.user_fixture()
        prefix = "owner-#{collection}-#{System.unique_integer([:positive])}"
        expected_node = owner_management_record(collection, owner, prefix)

        authorized_conn =
          conn
          |> log_in_user(owner)
          |> put_req_header_same_origin()

        {two_response, two_queries} =
          capture_select_queries(fn ->
            graphql(authorized_conn, owner_management_connection_query(collection, 2), %{})
          end)

        assert_owner_management_connection_values(two_response, collection, 2, expected_node)

        {four_response, four_queries} =
          capture_select_queries(fn ->
            graphql(authorized_conn, owner_management_connection_query(collection, 4), %{})
          end)

        assert_owner_management_connection_values(four_response, collection, 4, expected_node)

        {anonymous_response, anonymous_queries} =
          capture_select_queries(fn ->
            graphql(conn, owner_management_connection_query(collection, 2), %{})
          end)

        assert_unauthorized_owner_management_response(anonymous_response, collection)
        assert owner_management_connection_query_budget(anonymous_queries, collection) == 0

        two_budget = owner_management_connection_query_budget(two_queries, collection)
        four_budget = owner_management_connection_query_budget(four_queries, collection)

        assert {two_budget, four_budget} == {1, two_budget}
      end
    end

    test "authorized node aliases keep values and SELECT budgets fixed per schema as aliases grow",
         %{conn: conn, test: test_name} do
      owner = AccountsFixtures.operator_fixture()
      prefix = "#{test_name}-#{System.unique_integer([:positive])}"
      records = authorized_node_records(owner, prefix, 1..4)

      authorized_conn =
        conn
        |> log_in_user(owner)
        |> put_req_header_same_origin()

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(authorized_conn, authorized_node_batch_query(Enum.take(records, 2)), %{})
        end)

      assert_authorized_node_values(initial_response, Enum.take(records, 2))
      initial_budget = authorized_node_query_budget(initial_queries)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(authorized_conn, authorized_node_batch_query(records), %{})
        end)

      assert_authorized_node_values(grown_response, records)
      grown_budget = authorized_node_query_budget(grown_queries)

      assert {initial_budget, grown_budget} == {
               %{
                 affiliate_networks: 1,
                 affiliate_programs: 1,
                 affiliate_links: 1,
                 coupons: 1,
                 saved_comparison_sets: 1,
                 api_tokens: 1,
                 saved_comparison_items: 1,
                 products: 1
               },
               initial_budget
             }

      {anonymous_response, anonymous_queries} =
        capture_select_queries(fn ->
          graphql(conn, authorized_node_batch_query(Enum.take(records, 2)), %{})
        end)

      assert %{"data" => anonymous_data, "errors" => [_ | _]} = anonymous_response
      assert Enum.all?(anonymous_data, fn {_alias, value} -> is_nil(value) end)

      assert authorized_node_query_budget(anonymous_queries) ==
               Map.new(@authorized_node_tables, &{&1, 0})

      member = AccountsFixtures.user_fixture()

      member_conn =
        conn
        |> log_in_user(member)
        |> put_req_header_same_origin()

      {cross_owner_response, cross_owner_queries} =
        capture_select_queries(fn ->
          graphql(member_conn, owner_scoped_node_batch_query(records), %{})
        end)

      assert %{"data" => cross_owner_data} = cross_owner_response
      assert Enum.all?(cross_owner_data, fn {_alias, value} -> is_nil(value) end)

      assert authorized_node_query_budget(cross_owner_queries) ==
               Map.new(@authorized_node_tables, fn
                 table when table in [:saved_comparison_sets, :api_tokens] -> {table, 1}
                 table -> {table, 0}
               end)

      {non_operator_response, non_operator_queries} =
        capture_select_queries(fn ->
          graphql(member_conn, operator_node_batch_query(records), %{})
        end)

      assert %{"data" => non_operator_data, "errors" => [_ | _]} = non_operator_response
      assert Enum.all?(non_operator_data, fn {_alias, value} -> is_nil(value) end)

      assert authorized_node_query_budget(non_operator_queries) ==
               Map.new(@authorized_node_tables, &{&1, 0})
    end

    test "public product and merchant slug aliases keep values and SELECT budgets fixed as aliases grow",
         %{conn: conn, test: test_name} do
      prefix = canonical_slug("public-slugs-#{test_name}-#{System.unique_integer([:positive])}")
      products = public_slug_product_records(prefix)
      merchants = public_slug_merchant_records(prefix)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(
            conn,
            public_slug_batch_query(Enum.take(products, 2), Enum.take(merchants, 2)),
            %{}
          )
        end)

      assert_public_slug_values(initial_response, Enum.take(products, 2), Enum.take(merchants, 2))
      initial_budget = public_slug_query_budget(initial_queries)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, public_slug_batch_query(products, merchants), %{})
        end)

      assert_public_slug_values(grown_response, products, merchants)
      grown_budget = public_slug_query_budget(grown_queries)

      assert {initial_budget, grown_budget} == {
               %{
                 products: 2,
                 product_slug_aliases: 1,
                 brands: 1,
                 merchants: 1,
                 merchant_products: 1,
                 price_points: 1
               },
               initial_budget
             }
    end

    test "public opaque-key aliases keep values and SELECT budgets fixed per lookup kind as aliases grow",
         %{conn: conn} do
      prefix = "public-opaque-#{System.unique_integer([:positive])}"
      records = public_opaque_records(prefix, 1..4)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, public_opaque_batch_query(Enum.take(records, 2)), %{})
        end)

      assert_public_opaque_values(initial_response, Enum.take(records, 2))
      initial_budget = public_opaque_query_budget(initial_queries)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, public_opaque_batch_query(records), %{})
        end)

      assert_public_opaque_values(grown_response, records)
      grown_budget = public_opaque_query_budget(grown_queries)

      assert {initial_budget, grown_budget} == {
               %{
                 source_artifacts: 1,
                 sources: 1,
                 product_threads: 1,
                 thread_posts: 1,
                 comparison_snapshots: 1
               },
               initial_budget
             }
    end

    test "merchant detail summaries keep a fixed offer and price query budget as parents grow", %{
      conn: conn
    } do
      product = SpecsFixtures.product_fixture(%{name: "Summary batch product"})

      initial_merchants =
        for index <- 1..2 do
          merchant = merchant_fixture(%{name: unique_name("Summary Merchant #{index}")})
          merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

          {:ok, _point} =
            Pricing.add_price_point(%{
              merchant_product_id: merchant_product.id,
              observed_at: DateTime.utc_now(),
              price: Decimal.new("#{100 + index}.00"),
              shipping: Decimal.new("5.00"),
              in_stock: true
            })

          merchant
        end

      empty_merchant = merchant_fixture(%{name: unique_name("Summary Empty")})

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_summary_batch_query(), %{"first" => 3})
        end)

      initial_edges = get_in(initial_response, ["data", "merchants", "edges"])
      assert [_, _, _] = initial_edges
      assert summary_for(initial_edges, empty_merchant.name)["activeOfferCount"] == 0

      Enum.each(initial_merchants, fn merchant ->
        assert summary_for(initial_edges, merchant.name) == %{
                 "activeOfferCount" => 1,
                 "distinctProductCount" => 1,
                 "eligibleOfferCount" => 1,
                 "unobservedOfferCount" => 0
               }
      end)

      initial_budget = merchant_summary_query_budget(initial_queries)

      for index <- 3..5 do
        merchant = merchant_fixture(%{name: unique_name("Summary Merchant #{index}")})
        merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

        {:ok, _point} =
          Pricing.add_price_point(%{
            merchant_product_id: merchant_product.id,
            observed_at: DateTime.utc_now(),
            price: Decimal.new("#{100 + index}.00"),
            shipping: Decimal.new("5.00"),
            in_stock: true
          })
      end

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_summary_batch_query(), %{"first" => 6})
        end)

      assert grown_response |> get_in(["data", "merchants", "edges"]) |> length() == 6
      assert initial_budget == %{merchant_products: 1, price_points: 1}
      assert merchant_summary_query_budget(grown_queries) == initial_budget
    end

    test "merchant offer connections keep Relay values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      initial_merchants = merchant_offer_parents("#{test_name}-initial", 1..3)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_offer_connections_batch_query(), %{"first" => 3})
        end)

      initial_nodes = merchant_offer_connection_nodes(initial_response)
      assert [_, _, _] = initial_nodes
      assert_merchant_offer_connection_values(initial_nodes, initial_merchants)

      grown_merchants =
        initial_merchants ++ merchant_offer_parents("#{test_name}-grown", 4..6)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, merchant_offer_connections_batch_query(), %{"first" => 6})
        end)

      grown_nodes = merchant_offer_connection_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_merchant_offer_connection_values(grown_nodes, grown_merchants)

      fixed_budget = %{merchant_products: 1, price_points: 1}

      assert {
               merchant_offer_connection_query_budget(initial_queries),
               merchant_offer_connection_query_budget(grown_queries)
             } == {fixed_budget, fixed_budget}
    end

    test "product evidence fields keep semantic values and SELECT budgets fixed as parents grow",
         %{conn: conn} do
      operator = AccountsFixtures.operator_fixture()
      prefix = "product-evidence-#{System.unique_integer([:positive])}"
      initial_products = product_evidence_set("#{prefix}-initial", operator)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, product_evidence_batch_query(), %{"first" => 3})
        end)

      initial_nodes = product_evidence_nodes(initial_response)
      assert [_, _, _] = initial_nodes
      assert_product_evidence_values(initial_nodes, initial_products)

      initial_budget = product_evidence_query_budget(initial_queries)

      assert initial_budget == %{
               product_media: 1,
               product_attribute_current: 1,
               product_reviews: 2,
               merchant_products: 2,
               price_points: 2
             }

      grown_products = initial_products ++ product_evidence_set("#{prefix}-grown", operator)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, product_evidence_batch_query(), %{"first" => 6})
        end)

      grown_nodes = product_evidence_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_product_evidence_values(grown_nodes, grown_products)
      assert product_evidence_query_budget(grown_queries) == initial_budget
      assert_offer_as_of_is_shared(initial_nodes)
      assert_offer_as_of_is_shared(grown_nodes)
    end

    test "category aliases keep qualification, Relay pages, and SELECT budgets fixed as aliases grow",
         %{conn: conn, test: test_name} do
      operator = AccountsFixtures.operator_fixture()

      prefix =
        canonical_slug("category-batching-#{test_name}-#{System.unique_integer([:positive])}")

      categories = category_batching_set(prefix, operator, 1..4)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, category_batch_query(Enum.take(categories, 2)), %{})
        end)

      assert_category_batch_values(initial_response, Enum.take(categories, 2))
      initial_budget = category_query_budget(initial_queries)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, category_batch_query(categories), %{})
        end)

      assert_category_batch_values(grown_response, categories)
      grown_budget = category_query_budget(grown_queries)

      assert {initial_budget, grown_budget} == {
               %{taxons: 1, products: 2},
               initial_budget
             }
    end

    test "community connections keep their public Relay values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      operator = AccountsFixtures.operator_fixture()
      prefix = "community-connections-#{test_name}-#{System.unique_integer([:positive])}"

      initial_products =
        Enum.map(["first", "second"], fn suffix ->
          public_community_product("#{prefix}-#{suffix}", operator)
        end)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, community_connections_batch_query(), %{"first" => 10})
        end)

      initial_nodes = community_connection_nodes(initial_response)
      assert [_, _] = initial_nodes
      assert_public_community_connection_values(initial_nodes, initial_products)

      initial_budget = community_connection_query_budget(initial_queries)

      assert initial_budget == %{
               product_reviews: 1,
               product_threads: 1,
               thread_posts: 1
             }

      grown_products =
        initial_products ++
          Enum.map(["third", "fourth"], fn suffix ->
            public_community_product("#{prefix}-#{suffix}", operator)
          end)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, community_connections_batch_query(), %{"first" => 10})
        end)

      grown_nodes = community_connection_nodes(grown_response)
      assert [_, _, _, _] = grown_nodes
      assert_public_community_connection_values(grown_nodes, grown_products)
      assert community_connection_query_budget(grown_queries) == initial_budget
    end

    test "viewer community submissions keep owner values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      previous_discussion_config =
        Application.get_env(:product_compare, ProductCompare.Discussions)

      on_exit(fn ->
        if previous_discussion_config do
          Application.put_env(
            :product_compare,
            ProductCompare.Discussions,
            previous_discussion_config
          )
        else
          Application.delete_env(:product_compare, ProductCompare.Discussions)
        end
      end)

      Application.put_env(:product_compare, ProductCompare.Discussions,
        community_write_limits: [review: 10, question: 10, answer: 30, report: 30]
      )

      owner = AccountsFixtures.user_fixture()
      operator = AccountsFixtures.operator_fixture()
      owner_conn = conn |> log_in_user(owner) |> put_req_header_same_origin()
      prefix = "viewer-submissions-#{test_name}-#{System.unique_integer([:positive])}"

      initial_products = viewer_submission_products(prefix, owner, operator, 1..3)

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(owner_conn, viewer_submissions_batch_query(), %{"first" => 3})
        end)

      initial_nodes = viewer_submission_nodes(initial_response)
      assert [_, _, _] = initial_nodes
      assert_viewer_submission_values(initial_nodes, initial_products)

      initial_budget = viewer_submission_query_budget(initial_queries)

      assert initial_budget == %{
               product_reviews: 1,
               product_threads: 1,
               thread_posts: 1
             }

      grown_products =
        initial_products ++ viewer_submission_products(prefix, owner, operator, 4..6)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(owner_conn, viewer_submissions_batch_query(), %{"first" => 6})
        end)

      grown_nodes = viewer_submission_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_viewer_submission_values(grown_nodes, grown_products)
      assert viewer_submission_query_budget(grown_queries) == initial_budget
    end

    test "compare-shaped offer connections keep Relay values and SELECT budgets fixed as parents grow",
         %{conn: conn, test: test_name} do
      anchor = DateTime.utc_now() |> DateTime.truncate(:microsecond)

      merchants =
        for index <- 1..3 do
          merchant_fixture(%{
            name: unique_name("Compare Merchant #{index}"),
            domain: unique_domain("compare-#{index}")
          })
        end

      coupons = offer_connection_coupons(merchants, anchor)

      initial_products =
        offer_connection_products("#{test_name}-initial", merchants, anchor, 1..3)

      variables = %{
        "first" => 3,
        "historyFrom" => anchor |> DateTime.add(-7_200, :second) |> DateTime.to_iso8601(),
        "historyTo" => DateTime.to_iso8601(anchor)
      }

      {initial_response, initial_queries} =
        capture_select_queries(fn ->
          graphql(conn, offer_connections_batch_query(), variables)
        end)

      assert %{"data" => %{"products" => %{"edges" => _edges}}} = initial_response
      initial_nodes = offer_connection_nodes(initial_response)
      assert [_, _, _] = initial_nodes

      assert_offer_connection_values(
        initial_nodes,
        initial_products,
        coupons
      )

      grown_products =
        initial_products ++
          offer_connection_products("#{test_name}-grown", merchants, anchor, 4..6)

      {grown_response, grown_queries} =
        capture_select_queries(fn ->
          graphql(conn, offer_connections_batch_query(), %{variables | "first" => 6})
        end)

      grown_nodes = offer_connection_nodes(grown_response)
      assert [_, _, _, _, _, _] = grown_nodes
      assert_offer_connection_values(grown_nodes, grown_products, coupons)

      fixed_budget = %{merchant_products: 1, coupons: 1, price_points: 2}

      assert {
               offer_connection_query_budget(initial_queries),
               offer_connection_query_budget(grown_queries)
             } == {fixed_budget, fixed_budget}
    end
  end

  defp batching_query do
    """
    query DataloaderBatching(
      $firstSlug: String!
      $secondSlug: String!
      $input: MerchantProductsInput!
    ) {
      firstProduct: product(slug: $firstSlug) {
        id
        brand {
          id
        }
      }

      secondProduct: product(slug: $secondSlug) {
        id
        brand {
          id
        }
      }

      merchantProducts(input: $input) {
        edges {
          node {
            id
            merchant {
              id
              name
            }
            product {
              id
              slug
            }
            latestPrice {
              id
              price
            }
          }
        }
      }
    }
    """
  end

  defp public_node_batch_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.flat_map(fn {record, index} ->
        [
          public_node_selection("product#{index}", :product, record.product.id),
          public_node_selection("brand#{index}", :brand, record.brand.id),
          public_node_selection("merchant#{index}", :merchant, record.merchant.id),
          public_node_selection(
            "merchantProduct#{index}",
            :merchant_product,
            record.merchant_product.id
          ),
          public_node_selection("pricePoint#{index}", :price_point, record.price_point.id),
          public_node_selection("sourceArtifact#{index}", :source_artifact, record.artifact.id)
        ]
      end)

    missing = public_node_selection("missingProduct", :product, 2_147_483_647)

    """
    query PublicNodeBatch {
      #{Enum.join(selections ++ [missing], "\n")}
    }
    """
  end

  defp public_slug_batch_query(products, merchants) do
    product_selections =
      products
      |> Enum.with_index(1)
      |> Enum.map(fn {record, index} ->
        """
        product#{index}: product(slug: "#{record.requested_slug}") {
          id
          slug
          brand { id name }
        }
        """
      end)

    merchant_selections =
      merchants
      |> Enum.with_index(1)
      |> Enum.map(fn {record, index} ->
        """
        merchant#{index}: merchant(slug: "#{record.requested_slug}") {
          id
          slug
          detailSummary {
            activeOfferCount
            distinctProductCount
            eligibleOfferCount
          }
        }
        """
      end)

    """
    query PublicSlugBatch {
      #{Enum.join(product_selections ++ merchant_selections, "\n")}
    }
    """
  end

  defp comparison_root_batch_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.flat_map(fn {record, index} ->
        [
          """
          comparisonProducts#{index}: comparisonProducts(slugs: ["#{record.second.slug}", "missing-comparison-root-#{index}", "#{record.first.slug}"]) {
            id
            slug
            name
          }
          """,
          """
          comparisonRecommendation#{index}: comparisonRecommendation(slugs: ["#{record.first.slug}", "#{record.second.slug}"], profile: LOWEST_CURRENT_COST) {
            profile
            algorithmVersion
            status
            winnerProductId
            currency
            missingInputs
            rankings { rank productId pricePointId merchantProductId landedPrice currency claimIds reasons }
          }
          """
        ]
      end)

    """
    query ComparisonRootBatch {
      #{Enum.join(selections, "\n")}
    }
    """
  end

  defp owner_management_connection_query(collection, alias_count) do
    selections =
      Enum.map_join(1..alias_count, "\n", fn index ->
        """
        #{owner_management_alias(collection, index)}: #{owner_management_field(collection)} {
          edges {
            cursor
            node { #{owner_management_node_selection(collection)} }
          }
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        }
        """
      end)

    case collection do
      :comparison_snapshots ->
        """
        query OwnerManagementConnections {
          viewer {
            #{selections}
          }
        }
        """

      _collection ->
        """
        query OwnerManagementConnections {
          #{selections}
        }
        """
    end
  end

  defp owner_management_alias(collection, index),
    do: "#{collection |> Atom.to_string() |> Absinthe.Utils.camelize(lower: true)}#{index}"

  defp owner_management_field(:specification_corrections),
    do: "mySpecificationCorrections(first: 10, status: PENDING)"

  defp owner_management_field(:price_watches),
    do: "myPriceWatches(first: 10, enabled: true)"

  defp owner_management_field(:alert_events),
    do: "myAlertEvents(first: 10, unreadOnly: false)"

  defp owner_management_field(:api_tokens), do: "myApiTokens(first: 10, status: ACTIVE)"
  defp owner_management_field(:saved_comparison_sets), do: "mySavedComparisonSets(first: 10)"
  defp owner_management_field(:comparison_snapshots), do: "comparisonSnapshots(first: 10)"

  defp owner_management_node_selection(:specification_corrections),
    do: "id productId status valueText"

  defp owner_management_node_selection(:price_watches),
    do: "id enabled productName merchantName"

  defp owner_management_node_selection(:alert_events),
    do: "id productName merchantName landedPrice readAt"

  defp owner_management_node_selection(:api_tokens), do: "id label tokenPrefix revokedAt"

  defp owner_management_node_selection(:saved_comparison_sets),
    do: "id name items { position product { id name } }"

  defp owner_management_node_selection(:comparison_snapshots),
    do: "id title sharePath products { id name }"

  defp authorized_node_batch_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.flat_map(fn {record, index} ->
        [
          authorized_node_selection(
            "affiliateNetwork#{index}",
            :affiliate_network,
            record.network.id
          ),
          authorized_node_selection(
            "affiliateProgram#{index}",
            :affiliate_program,
            record.program.id
          ),
          authorized_node_selection("affiliateLink#{index}", :affiliate_link, record.link.id),
          authorized_node_selection("coupon#{index}", :coupon, record.coupon.id),
          authorized_node_selection(
            "savedComparisonSet#{index}",
            :saved_comparison_set,
            record.saved_set.entropy_id
          ),
          authorized_node_selection("apiToken#{index}", :api_token, record.api_token.entropy_id)
        ]
      end)

    missing = [
      authorized_node_selection("missingAffiliateNetwork", :affiliate_network, 2_147_483_647),
      authorized_node_selection(
        "missingSavedComparisonSet",
        :saved_comparison_set,
        Ecto.UUID.generate()
      ),
      authorized_node_selection("missingApiToken", :api_token, Ecto.UUID.generate())
    ]

    """
    query AuthorizedNodeBatch {
      #{Enum.join(selections ++ missing, "\n")}
    }
    """
  end

  defp owner_scoped_node_batch_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.flat_map(fn {record, index} ->
        [
          authorized_node_selection(
            "savedComparisonSet#{index}",
            :saved_comparison_set,
            record.saved_set.entropy_id
          ),
          authorized_node_selection("apiToken#{index}", :api_token, record.api_token.entropy_id)
        ]
      end)

    """
    query OwnerScopedNodeBatch {
      #{Enum.join(selections, "\n")}
    }
    """
  end

  defp operator_node_batch_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.flat_map(fn {record, index} ->
        [
          authorized_node_selection(
            "affiliateNetwork#{index}",
            :affiliate_network,
            record.network.id
          ),
          authorized_node_selection(
            "affiliateProgram#{index}",
            :affiliate_program,
            record.program.id
          ),
          authorized_node_selection("affiliateLink#{index}", :affiliate_link, record.link.id),
          authorized_node_selection("coupon#{index}", :coupon, record.coupon.id)
        ]
      end)

    """
    query OperatorNodeBatch {
      #{Enum.join(selections, "\n")}
    }
    """
  end

  defp authorized_node_selection(alias_name, type, id) do
    """
    #{alias_name}: node(id: "#{relay_id(type, id)}") {
      __typename
      ... on AffiliateNetwork { id name }
      ... on AffiliateProgram { id affiliateNetworkId merchantId programCode status }
      ... on AffiliateLink { id merchantProductId affiliateNetworkId originalUrl affiliateUrl }
      ... on Coupon { id merchantId affiliateNetworkId code discountType }
      ... on SavedComparisonSet {
        id
        name
        items { position product { id slug } }
      }
      ... on ApiToken { id label tokenPrefix revokedAt }
    }
    """
  end

  defp public_opaque_batch_query(records) do
    selections =
      records
      |> Enum.with_index(1)
      |> Enum.flat_map(fn {record, index} ->
        [
          """
          sourceArtifact#{index}: sourceArtifact(id: "#{relay_id(:source_artifact, record.artifact.id)}") {
            id sourceKind sourceName sourceDomain url fetchedAt
          }
          """,
          """
          productQuestion#{index}: productQuestion(id: "#{relay_id(:product_question, record.question.entropy_id)}") {
            id title acceptedAnswerId
          }
          """,
          """
          comparisonSnapshot#{index}: comparisonSnapshot(token: "#{record.snapshot.public_token}") {
            id title capturedAt
          }
          """
        ]
      end)

    missing_selections = [
      "missingSourceArtifact: sourceArtifact(id: \"#{relay_id(:source_artifact, 2_147_483_647)}\") { id }",
      "missingProductQuestion: productQuestion(id: \"#{relay_id(:product_question, Ecto.UUID.generate())}\") { id }",
      "missingComparisonSnapshot: comparisonSnapshot(token: \"#{String.duplicate("z", 43)}\") { id }"
    ]

    """
    query PublicOpaqueBatch {
      #{Enum.join(selections ++ missing_selections, "\n")}
    }
    """
  end

  defp public_node_selection(alias_name, type, id) do
    """
    #{alias_name}: node(id: "#{relay_id(type, id)}") {
      __typename
      ... on Product { id slug name }
      ... on Brand { id name }
      ... on Merchant { id name domain }
      ... on MerchantProduct { id merchantId productId isActive }
      ... on PricePoint { id merchantProductId observedAt price }
      ... on SourceArtifact { id sourceKind sourceName sourceDomain url fetchedAt }
    }
    """
  end

  defp merchant_summary_batch_query do
    """
    query MerchantSummaryBatch($first: Int!) {
      merchants(first: $first) {
        edges {
          node {
            name
            detailSummary {
              activeOfferCount
              distinctProductCount
              eligibleOfferCount
              unobservedOfferCount
            }
          }
        }
      }
    }
    """
  end

  defp product_evidence_batch_query do
    """
    query ProductEvidenceBatch($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            offerTruth {
              asOf
              freshForSeconds
              staleAfterSeconds
              offerCount
              observedOfferCount
              eligibleOfferCount
              currencySummaries {
                currency
                offerCount
                observedOfferCount
                eligibleOfferCount
                bestOffer {
                  currency
                  itemPrice
                  shipping
                  landedPrice
                  landedPriceComplete
                  stockStatus
                  freshness
                  eligible
                }
              }
            }
            reviewSummary { count averageRating }
            seo { title description canonicalPath indexable imageUrl structuredData }
          }
        }
      }
    }
    """
  end

  defp merchant_offer_connections_batch_query do
    """
    query MerchantOfferConnectionsBatch($first: Int!) {
      merchants(first: $first) {
        edges {
          node {
            id
            name
            merchantProducts(first: 2) {
              edges {
                cursor
                node {
                  id
                  merchant { id name }
                  product { id name slug }
                  latestPrice { id price }
                }
              }
              pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
            }
          }
        }
      }
    }
    """
  end

  defp community_connections_batch_query do
    """
    query CommunityConnectionsBatch($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            reviews(first: 2) {
              edges { cursor node { id rating title moderationStatus } }
              pageInfo { hasNextPage endCursor }
            }
            questions(first: 1) {
              edges {
                cursor
                node {
                  id
                  title
                  moderationStatus
                  acceptedAnswerId
                  answers(first: 1) {
                    edges { cursor node { id body moderationStatus } }
                    pageInfo { hasNextPage endCursor }
                  }
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }
    }
    """
  end

  defp category_batch_query(categories) do
    selections =
      categories
      |> Enum.with_index(1)
      |> Enum.map(fn {category_data, index} ->
        """
        category#{index}: category(slug: "#{category_data.category.seo_slug}") {
          id
          name
          slug
          qualifiedProductCount
          indexable
          seo { canonicalPath indexable structuredData }
          products(first: 2) {
            edges { cursor node { id name slug } }
            pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          }
        }
        """
      end)

    """
    query CategoryBatch {
      #{Enum.join(selections, "\n")}
      missingCategory: category(slug: "missing-category") { id }
    }
    """
  end

  defp viewer_submissions_batch_query do
    """
    query ViewerSubmissionsBatch($first: Int!) {
      products(first: $first) {
        edges {
          node {
            slug
            viewerCommunitySubmissions {
              reviews { id rating moderationStatus viewerCanEdit viewerCanRemove }
              questions { id title moderationStatus viewerCanEdit viewerCanRemove }
              answers { id body moderationStatus viewerCanEdit viewerCanRemove }
            }
          }
        }
      }
    }
    """
  end

  defp offer_connections_batch_query do
    """
    query OfferConnectionsBatch(
      $first: Int!
      $historyFrom: DateTime!
      $historyTo: DateTime!
    ) {
      products(first: $first) {
        edges {
          node {
            slug
            merchantProducts(first: 2, activeOnly: true) {
              edges {
                cursor
                node {
                  id
                  merchant { id name }
                  activeCoupons(first: 1) {
                    edges { cursor node { code validTo } }
                    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
                  }
                  latestPrice { id observedAt price }
                  priceHistory(first: 2, from: $historyFrom, to: $historyTo) {
                    edges { cursor node { id observedAt price } }
                    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
                  }
                }
              }
              pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
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

  defp count_queries_by_table(queries) do
    Enum.into(@tracked_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp public_node_query_budget(queries) do
    Enum.into(@public_node_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp authorized_node_query_budget(queries) do
    Enum.into(@authorized_node_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp public_slug_query_budget(queries) do
    %{
      products: Enum.count(queries, &query_targets_table?(&1, :products)),
      product_slug_aliases:
        Enum.count(queries, &String.contains?(&1, ~s("product_slug_aliases"))),
      brands: Enum.count(queries, &query_targets_table?(&1, :brands)),
      merchants: Enum.count(queries, &query_targets_table?(&1, :merchants)),
      merchant_products: Enum.count(queries, &query_targets_table?(&1, :merchant_products)),
      price_points: Enum.count(queries, &query_targets_table?(&1, :price_points))
    }
  end

  defp public_opaque_query_budget(queries) do
    Enum.into(@public_opaque_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp comparison_root_query_budget(queries) do
    Enum.into(@comparison_root_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp owner_management_connection_query_budget(queries, collection) do
    table =
      case collection do
        :specification_corrections -> :specification_corrections
        :price_watches -> :price_watch_rules
        :alert_events -> :alert_events
        :api_tokens -> :api_tokens
        :saved_comparison_sets -> :saved_comparison_sets
        :comparison_snapshots -> :comparison_snapshots
      end

    Enum.count(queries, &query_targets_table?(&1, table))
  end

  defp assert_owner_management_connection_values(response, collection, alias_count, expected) do
    assert %{"data" => data} = response
    refute Map.has_key?(response, "errors")

    data = if collection == :comparison_snapshots, do: Map.fetch!(data, "viewer"), else: data

    Enum.each(1..alias_count, fn index ->
      alias_name = owner_management_alias(collection, index)

      assert %{
               "edges" => [%{"cursor" => cursor, "node" => ^expected}],
               "pageInfo" => %{
                 "hasNextPage" => false,
                 "hasPreviousPage" => false,
                 "startCursor" => cursor,
                 "endCursor" => cursor
               }
             } = Map.fetch!(data, alias_name)
    end)
  end

  defp assert_unauthorized_owner_management_response(response, :comparison_snapshots) do
    assert response == %{"data" => %{"viewer" => nil}}
  end

  defp assert_unauthorized_owner_management_response(response, collection) do
    assert %{"data" => data, "errors" => errors} = response

    if collection in [:saved_comparison_sets] do
      assert Enum.all?(data, fn {_alias, value} -> is_nil(value) end)
    else
      assert data == nil
    end

    assert errors != []
    assert Enum.all?(errors, &(&1["message"] == "unauthorized"))
  end

  defp assert_comparison_root_values(response, records) do
    assert %{"data" => data} = response
    refute Map.has_key?(response, "errors")

    records
    |> Enum.with_index(1)
    |> Enum.each(fn {record, index} ->
      assert data["comparisonProducts#{index}"] == [
               %{
                 "id" => relay_id(:product, record.second.id),
                 "slug" => record.second.slug,
                 "name" => record.second.name
               },
               nil,
               %{
                 "id" => relay_id(:product, record.first.id),
                 "slug" => record.first.slug,
                 "name" => record.first.name
               }
             ]

      assert data["comparisonRecommendation#{index}"] == %{
               "profile" => "LOWEST_CURRENT_COST",
               "algorithmVersion" => "lowest-current-cost-v1",
               "status" => "WINNER",
               "winnerProductId" => relay_id(:product, record.second.id),
               "currency" => "USD",
               "missingInputs" => [],
               "rankings" => [
                 %{
                   "rank" => 1,
                   "productId" => relay_id(:product, record.second.id),
                   "pricePointId" => relay_id(:price_point, record.second_point.id),
                   "merchantProductId" =>
                     relay_id(:merchant_product, record.second_point.merchant_product_id),
                   "landedPrice" => "80",
                   "currency" => "USD",
                   "claimIds" => [],
                   "reasons" => ["Lowest eligible landed price: 80 USD."]
                 },
                 %{
                   "rank" => 2,
                   "productId" => relay_id(:product, record.first.id),
                   "pricePointId" => relay_id(:price_point, record.first_point.id),
                   "merchantProductId" =>
                     relay_id(:merchant_product, record.first_point.merchant_product_id),
                   "landedPrice" => "100",
                   "currency" => "USD",
                   "claimIds" => [],
                   "reasons" => ["Lowest eligible landed price: 100 USD."]
                 }
               ]
             }
    end)
  end

  defp assert_public_slug_values(response, products, merchants) do
    assert %{"data" => data} = response

    products
    |> Enum.with_index(1)
    |> Enum.each(fn
      {%{product: nil}, index} ->
        assert data["product#{index}"] == nil

      {%{product: product, brand: brand}, index} ->
        assert data["product#{index}"] == %{
                 "id" => relay_id(:product, product.id),
                 "slug" => product.slug,
                 "brand" => %{
                   "id" => relay_id(:brand, product.brand_id),
                   "name" => brand.name
                 }
               }
    end)

    merchants
    |> Enum.with_index(1)
    |> Enum.each(fn
      {%{merchant: nil}, index} ->
        assert data["merchant#{index}"] == nil

      {%{merchant: merchant}, index} ->
        assert data["merchant#{index}"] == %{
                 "id" => relay_id(:merchant, merchant.id),
                 "slug" => merchant.slug,
                 "detailSummary" => %{
                   "activeOfferCount" => 1,
                   "distinctProductCount" => 1,
                   "eligibleOfferCount" => 1
                 }
               }
    end)
  end

  defp assert_public_opaque_values(response, records) do
    assert %{"data" => data} = response
    assert data["missingSourceArtifact"] == nil
    assert data["missingProductQuestion"] == nil
    assert data["missingComparisonSnapshot"] == nil

    records
    |> Enum.with_index(1)
    |> Enum.each(fn {record, index} ->
      assert data["sourceArtifact#{index}"] == %{
               "id" => relay_id(:source_artifact, record.artifact.id),
               "sourceKind" => record.source.kind,
               "sourceName" => record.source.name,
               "sourceDomain" => record.source.domain,
               "url" => record.artifact.url,
               "fetchedAt" => DateTime.to_iso8601(record.artifact.fetched_at)
             }

      assert data["productQuestion#{index}"] == %{
               "id" => relay_id(:product_question, record.question.entropy_id),
               "title" => record.question.title,
               "acceptedAnswerId" => relay_id(:product_answer, record.answer.entropy_id)
             }

      assert data["comparisonSnapshot#{index}"] == %{
               "id" => relay_id(:comparison_snapshot, record.snapshot.entropy_id),
               "title" => record.snapshot.title,
               "capturedAt" => record.snapshot.payload.captured_at
             }
    end)
  end

  defp assert_public_node_values(response, records) do
    assert %{"data" => data} = response
    assert data["missingProduct"] == nil

    records
    |> Enum.with_index(1)
    |> Enum.each(fn {record, index} ->
      assert data["product#{index}"] == %{
               "__typename" => "Product",
               "id" => relay_id(:product, record.product.id),
               "slug" => record.product.slug,
               "name" => record.product.name
             }

      assert data["brand#{index}"] == %{
               "__typename" => "Brand",
               "id" => relay_id(:brand, record.brand.id),
               "name" => record.brand.name
             }

      assert data["merchant#{index}"] == %{
               "__typename" => "Merchant",
               "id" => relay_id(:merchant, record.merchant.id),
               "name" => record.merchant.name,
               "domain" => record.merchant.domain
             }

      assert data["merchantProduct#{index}"] == %{
               "__typename" => "MerchantProduct",
               "id" => relay_id(:merchant_product, record.merchant_product.id),
               "merchantId" => relay_id(:merchant, record.merchant.id),
               "productId" => relay_id(:product, record.product.id),
               "isActive" => record.merchant_product.is_active
             }

      assert data["pricePoint#{index}"] == %{
               "__typename" => "PricePoint",
               "id" => relay_id(:price_point, record.price_point.id),
               "merchantProductId" => relay_id(:merchant_product, record.merchant_product.id),
               "observedAt" => DateTime.to_iso8601(record.price_point.observed_at),
               "price" => Decimal.to_string(record.price_point.price)
             }

      assert data["sourceArtifact#{index}"] == %{
               "__typename" => "SourceArtifact",
               "id" => relay_id(:source_artifact, record.artifact.id),
               "sourceKind" => record.source.kind,
               "sourceName" => record.source.name,
               "sourceDomain" => record.source.domain,
               "url" => record.artifact.url,
               "fetchedAt" => DateTime.to_iso8601(record.artifact.fetched_at)
             }
    end)
  end

  defp assert_authorized_node_values(response, records) do
    assert %{"data" => data} = response
    assert data["missingAffiliateNetwork"] == nil
    assert data["missingSavedComparisonSet"] == nil
    assert data["missingApiToken"] == nil

    records
    |> Enum.with_index(1)
    |> Enum.each(fn {record, index} ->
      assert data["affiliateNetwork#{index}"] == %{
               "__typename" => "AffiliateNetwork",
               "id" => relay_id(:affiliate_network, record.network.id),
               "name" => record.network.name
             }

      assert data["affiliateProgram#{index}"] == %{
               "__typename" => "AffiliateProgram",
               "id" => relay_id(:affiliate_program, record.program.id),
               "affiliateNetworkId" => relay_id(:affiliate_network, record.network.id),
               "merchantId" => relay_id(:merchant, record.merchant.id),
               "programCode" => record.program.program_code,
               "status" => record.program.status
             }

      assert data["affiliateLink#{index}"] == %{
               "__typename" => "AffiliateLink",
               "id" => relay_id(:affiliate_link, record.link.id),
               "merchantProductId" => relay_id(:merchant_product, record.merchant_product.id),
               "affiliateNetworkId" => relay_id(:affiliate_network, record.network.id),
               "originalUrl" => record.link.original_url,
               "affiliateUrl" => record.link.affiliate_url
             }

      assert data["coupon#{index}"] == %{
               "__typename" => "Coupon",
               "id" => relay_id(:coupon, record.coupon.id),
               "merchantId" => relay_id(:merchant, record.merchant.id),
               "affiliateNetworkId" => relay_id(:affiliate_network, record.network.id),
               "code" => record.coupon.code,
               "discountType" => "OTHER"
             }

      assert data["savedComparisonSet#{index}"] == %{
               "__typename" => "SavedComparisonSet",
               "id" => relay_id(:saved_comparison_set, record.saved_set.entropy_id),
               "name" => record.saved_set.name,
               "items" => [
                 %{
                   "position" => 1,
                   "product" => %{
                     "id" => relay_id(:product, record.product.id),
                     "slug" => record.product.slug
                   }
                 }
               ]
             }

      assert data["apiToken#{index}"] == %{
               "__typename" => "ApiToken",
               "id" => relay_id(:api_token, record.api_token.entropy_id),
               "label" => record.api_token.label,
               "tokenPrefix" => record.api_token.token_prefix,
               "revokedAt" => nil
             }
    end)
  end

  defp merchant_summary_query_budget(queries) do
    %{
      merchant_products: Enum.count(queries, &query_targets_table?(&1, :merchant_products)),
      price_points: Enum.count(queries, &query_targets_table?(&1, :price_points))
    }
  end

  defp merchant_offer_connection_nodes(response) do
    response
    |> get_in(["data", "merchants", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp merchant_offer_connection_query_budget(queries) do
    Enum.into(@merchant_offer_connection_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp assert_merchant_offer_connection_values(nodes, merchants) do
    Enum.each(merchants, fn merchant_data ->
      node = Enum.find(nodes, &(&1["name"] == merchant_data.merchant.name))

      assert node["id"] == relay_id(:merchant, merchant_data.merchant.id)

      expected_edges =
        merchant_data.visible_offers
        |> Enum.with_index()
        |> Enum.map(fn {offer_data, index} ->
          %{
            "cursor" => cursor_for(index),
            "node" => %{
              "id" => relay_id(:merchant_product, offer_data.offer.id),
              "merchant" => %{
                "id" => relay_id(:merchant, merchant_data.merchant.id),
                "name" => merchant_data.merchant.name
              },
              "product" => %{
                "id" => relay_id(:product, offer_data.product.id),
                "name" => offer_data.product.name,
                "slug" => offer_data.product.slug
              },
              "latestPrice" => %{
                "id" => relay_id(:price_point, offer_data.latest_price.id),
                "price" => Decimal.to_string(offer_data.latest_price.price)
              }
            }
          }
        end)

      assert node["merchantProducts"] == %{
               "edges" => expected_edges,
               "pageInfo" => %{
                 "hasNextPage" => true,
                 "hasPreviousPage" => false,
                 "startCursor" => cursor_for(0),
                 "endCursor" => cursor_for(1)
               }
             }
    end)
  end

  defp product_evidence_query_budget(queries) do
    Enum.into(@product_evidence_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp category_query_budget(queries) do
    Enum.into(@category_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp assert_category_batch_values(response, categories) do
    assert %{"data" => data} = response
    assert data["missingCategory"] == nil

    categories
    |> Enum.with_index(1)
    |> Enum.each(fn {category_data, index} ->
      category = category_data.category
      expected_products = Enum.take(category_data.products, 2)
      expected_category_id = relay_id(:taxon, category.id)
      expected_category_name = category.name
      expected_category_slug = category.seo_slug
      expected_canonical_path = "/categories/#{category.seo_slug}"

      assert %{
               "id" => ^expected_category_id,
               "name" => ^expected_category_name,
               "slug" => ^expected_category_slug,
               "qualifiedProductCount" => 3,
               "indexable" => true,
               "seo" => %{
                 "canonicalPath" => ^expected_canonical_path,
                 "indexable" => true,
                 "structuredData" => structured_data
               },
               "products" => %{
                 "edges" => edges,
                 "pageInfo" => %{
                   "hasNextPage" => true,
                   "hasPreviousPage" => false,
                   "startCursor" => start_cursor,
                   "endCursor" => end_cursor
                 }
               }
             } = data["category#{index}"]

      assert Jason.decode!(structured_data)["@type"] == "CollectionPage"
      assert start_cursor == cursor_for(0)
      assert end_cursor == cursor_for(1)

      assert edges ==
               expected_products
               |> Enum.with_index()
               |> Enum.map(fn {product, product_index} ->
                 %{
                   "cursor" => cursor_for(product_index),
                   "node" => %{
                     "id" => relay_id(:product, product.id),
                     "name" => product.name,
                     "slug" => product.slug
                   }
                 }
               end)
    end)
  end

  defp summary_for(edges, merchant_name) do
    edges
    |> Enum.find(fn edge -> edge["node"]["name"] == merchant_name end)
    |> get_in(["node", "detailSummary"])
  end

  defp product_evidence_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp community_connection_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp viewer_submission_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp assert_viewer_submission_values(nodes, products) do
    Enum.each(products, fn product_data ->
      node = node_for(nodes, product_data.product.slug)

      assert node["viewerCommunitySubmissions"] == %{
               "reviews" => [
                 %{
                   "id" => relay_id(:product_review, product_data.review.entropy_id),
                   "rating" => product_data.review.rating,
                   "moderationStatus" => "PENDING",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 }
               ],
               "questions" => [
                 %{
                   "id" => relay_id(:product_question, product_data.hidden_question.entropy_id),
                   "title" => product_data.hidden_question.title,
                   "moderationStatus" => "HIDDEN",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 }
               ],
               "answers" => [
                 %{
                   "id" => relay_id(:product_answer, product_data.pending_answer.entropy_id),
                   "body" => product_data.pending_answer.body_md,
                   "moderationStatus" => "PENDING",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 },
                 %{
                   "id" =>
                     relay_id(
                       :product_answer,
                       product_data.published_hidden_answer.entropy_id
                     ),
                   "body" => product_data.published_hidden_answer.body_md,
                   "moderationStatus" => "PUBLISHED",
                   "viewerCanEdit" => true,
                   "viewerCanRemove" => true
                 }
               ]
             }
    end)
  end

  defp assert_public_community_connection_values(nodes, products) do
    Enum.each(products, fn product ->
      node = node_for(nodes, product.product.slug)

      assert node["reviews"] == %{
               "edges" =>
                 Enum.map(product.visible_reviews, fn review ->
                   %{
                     "cursor" => cursor_for(review.cursor_index),
                     "node" => %{
                       "id" => relay_id(:product_review, review.entropy_id),
                       "rating" => review.rating,
                       "title" => review.title,
                       "moderationStatus" => "PUBLISHED"
                     }
                   }
                 end),
               "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor_for(1)}
             }

      assert node["questions"] == %{
               "edges" => [
                 %{
                   "cursor" => cursor_for(0),
                   "node" => %{
                     "id" => relay_id(:product_question, product.question.entropy_id),
                     "title" => product.question.title,
                     "moderationStatus" => "PUBLISHED",
                     "acceptedAnswerId" =>
                       relay_id(:product_answer, product.accepted_answer.entropy_id),
                     "answers" => %{
                       "edges" => [
                         %{
                           "cursor" => cursor_for(0),
                           "node" => %{
                             "id" => relay_id(:product_answer, product.first_answer.entropy_id),
                             "body" => product.first_answer.body_md,
                             "moderationStatus" => "PUBLISHED"
                           }
                         }
                       ],
                       "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor_for(0)}
                     }
                   }
                 }
               ],
               "pageInfo" => %{"hasNextPage" => true, "endCursor" => cursor_for(0)}
             }

      refute inspect(node) =~ "hidden review"
      refute inspect(node) =~ "hidden question"
      refute inspect(node) =~ "hidden answer"
    end)
  end

  defp community_connection_query_budget(queries) do
    Enum.into(@community_connection_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp viewer_submission_query_budget(queries) do
    Enum.into(@viewer_submission_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp offer_connection_nodes(response) do
    response
    |> get_in(["data", "products", "edges"])
    |> Enum.map(& &1["node"])
  end

  defp assert_offer_connection_values(nodes, products, coupons) do
    assert Enum.map(nodes, & &1["slug"]) == Enum.map(products, & &1.product.slug)

    Enum.each(products, fn product_data ->
      node = node_for(nodes, product_data.product.slug)

      expected_edges =
        product_data.visible_offers
        |> Enum.with_index()
        |> Enum.map(fn {offer_data, index} ->
          coupon = Map.fetch!(coupons, offer_data.merchant.id)

          %{
            "cursor" => cursor_for(index),
            "node" => %{
              "id" => relay_id(:merchant_product, offer_data.offer.id),
              "merchant" => %{
                "id" => relay_id(:merchant, offer_data.merchant.id),
                "name" => offer_data.merchant.name
              },
              "activeCoupons" => %{
                "edges" => [
                  %{
                    "cursor" => cursor_for(0),
                    "node" => %{
                      "code" => coupon.first.code,
                      "validTo" => DateTime.to_iso8601(coupon.first.valid_to)
                    }
                  }
                ],
                "pageInfo" => %{
                  "hasNextPage" => true,
                  "hasPreviousPage" => false,
                  "startCursor" => cursor_for(0),
                  "endCursor" => cursor_for(0)
                }
              },
              "latestPrice" => %{
                "id" => relay_id(:price_point, offer_data.latest.id),
                "observedAt" => DateTime.to_iso8601(offer_data.latest.observed_at),
                "price" => Decimal.to_string(offer_data.latest.price)
              },
              "priceHistory" => %{
                "edges" =>
                  [offer_data.history_newer, offer_data.history_older]
                  |> Enum.with_index()
                  |> Enum.map(fn {price_point, history_index} ->
                    %{
                      "cursor" => cursor_for(history_index),
                      "node" => %{
                        "id" => relay_id(:price_point, price_point.id),
                        "observedAt" => DateTime.to_iso8601(price_point.observed_at),
                        "price" => Decimal.to_string(price_point.price)
                      }
                    }
                  end),
                "pageInfo" => %{
                  "hasNextPage" => false,
                  "hasPreviousPage" => false,
                  "startCursor" => cursor_for(0),
                  "endCursor" => cursor_for(1)
                }
              }
            }
          }
        end)

      assert node["merchantProducts"] == %{
               "edges" => expected_edges,
               "pageInfo" => %{
                 "hasNextPage" => true,
                 "hasPreviousPage" => false,
                 "startCursor" => cursor_for(0),
                 "endCursor" => cursor_for(1)
               }
             }
    end)
  end

  defp offer_connection_query_budget(queries) do
    Enum.into(@offer_connection_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp offer_connection_coupons(merchants, anchor) do
    Map.new(Enum.with_index(merchants, 1), fn {merchant, index} ->
      {:ok, _expired} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "EXPIRED-#{index}",
          discount_type: :other,
          valid_to: DateTime.add(anchor, -60, :second)
        })

      {:ok, first} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "ACTIVE-#{index}-FIRST",
          discount_type: :percent,
          discount_value: Decimal.new("5"),
          valid_to: DateTime.add(anchor, 3_600, :second)
        })

      {:ok, second} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "ACTIVE-#{index}-SECOND",
          discount_type: :amount,
          discount_value: Decimal.new("10"),
          currency: "USD",
          valid_to: DateTime.add(anchor, 7_200, :second)
        })

      {:ok, _future} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          code: "FUTURE-#{index}",
          discount_type: :other,
          valid_from: DateTime.add(anchor, 3_600, :second)
        })

      {merchant.id, %{first: first, second: second}}
    end)
  end

  defp merchant_offer_parents(prefix, indexes) do
    Enum.map(indexes, fn merchant_index ->
      merchant =
        merchant_fixture(%{
          name: unique_name("Merchant Offer Parent #{merchant_index}"),
          domain: unique_domain("#{prefix}-merchant-#{merchant_index}")
        })

      inactive_product =
        SpecsFixtures.product_fixture(%{
          slug: "#{prefix}-merchant-#{merchant_index}-inactive",
          name: "Merchant #{merchant_index} Inactive Product"
        })

      _inactive_offer =
        merchant_product_fixture(%{
          merchant: merchant,
          product: inactive_product,
          is_active: false
        })

      active_offers =
        Enum.map(1..3, fn offer_index ->
          product =
            SpecsFixtures.product_fixture(%{
              slug: "#{prefix}-merchant-#{merchant_index}-active-#{offer_index}",
              name: "Merchant #{merchant_index} Active Product #{offer_index}"
            })

          offer =
            merchant_product_fixture(%{
              merchant: merchant,
              product: product,
              is_active: true
            })

          {:ok, latest_price} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at:
                DateTime.utc_now()
                |> DateTime.add(offer_index, :second)
                |> DateTime.truncate(:microsecond),
              price: Decimal.new(merchant_index * 100 + offer_index)
            })

          %{offer: offer, product: product, latest_price: latest_price}
        end)

      %{merchant: merchant, visible_offers: Enum.take(active_offers, 2)}
    end)
  end

  defp offer_connection_products(prefix, merchants, anchor, indexes) do
    Enum.map(indexes, fn product_index ->
      product =
        SpecsFixtures.product_fixture(%{
          slug: "#{prefix}-#{product_index}",
          name: "Compare Product #{product_index}"
        })

      _inactive_offer =
        merchant_product_fixture(%{
          merchant: hd(merchants),
          product: product,
          is_active: false
        })

      active_offers =
        merchants
        |> Enum.with_index(1)
        |> Enum.map(fn {merchant, merchant_index} ->
          offer =
            merchant_product_fixture(%{
              merchant: merchant,
              product: product,
              is_active: true
            })

          price_seed = product_index * 100 + merchant_index * 10

          {:ok, _outside_older} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, -10_800, :second),
              price: Decimal.new(price_seed - 3)
            })

          {:ok, history_older} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, -7_200, :second),
              price: Decimal.new(price_seed - 2)
            })

          {:ok, history_newer} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, -3_600, :second),
              price: Decimal.new(price_seed - 1)
            })

          {:ok, latest} =
            Pricing.add_price_point(%{
              merchant_product_id: offer.id,
              observed_at: DateTime.add(anchor, 3_600, :second),
              price: Decimal.new(price_seed)
            })

          %{
            offer: offer,
            merchant: merchant,
            history_older: history_older,
            history_newer: history_newer,
            latest: latest
          }
        end)

      %{product: product, visible_offers: Enum.take(active_offers, 2)}
    end)
  end

  defp public_community_product(slug, operator) do
    product = SpecsFixtures.product_fixture(%{slug: slug, name: "#{slug} product"})

    published_reviews =
      for rating <- 3..5 do
        reviewer = AccountsFixtures.user_fixture()

        {:ok, review} =
          Discussions.submit_review(reviewer.id, product.id, %{
            rating: rating,
            title: "published review #{rating}"
          })

        {:ok, review} = Discussions.moderate(operator.id, :review, review.entropy_id, :published)
        review
      end

    hidden_reviewer = AccountsFixtures.user_fixture()

    {:ok, hidden_review} =
      Discussions.submit_review(hidden_reviewer.id, product.id, %{
        rating: 1,
        title: "hidden review"
      })

    {:ok, _hidden_review} =
      Discussions.moderate(operator.id, :review, hidden_review.entropy_id, :hidden)

    asker = AccountsFixtures.user_fixture()

    {:ok, older_question} =
      Discussions.ask_question(asker.id, product.id, %{
        title: "older published question",
        body: "Older published question body"
      })

    {:ok, _older_question} =
      Discussions.moderate(operator.id, :question, older_question.entropy_id, :published)

    {:ok, question} =
      Discussions.ask_question(asker.id, product.id, %{
        title: "newer published question",
        body: "Newer published question body"
      })

    {:ok, question} =
      Discussions.moderate(operator.id, :question, question.entropy_id, :published)

    answerer = AccountsFixtures.user_fixture()

    {:ok, first_answer} =
      Discussions.answer_question(answerer.id, question.entropy_id, "first published answer")

    {:ok, first_answer} =
      Discussions.moderate(operator.id, :answer, first_answer.entropy_id, :published)

    {:ok, accepted_answer} =
      Discussions.answer_question(answerer.id, question.entropy_id, "accepted published answer")

    {:ok, accepted_answer} =
      Discussions.moderate(operator.id, :answer, accepted_answer.entropy_id, :published)

    {:ok, hidden_answer} =
      Discussions.answer_question(answerer.id, question.entropy_id, "hidden answer")

    {:ok, _hidden_answer} =
      Discussions.moderate(operator.id, :answer, hidden_answer.entropy_id, :hidden)

    {:ok, question} =
      Discussions.accept_answer(asker.id, question.entropy_id, accepted_answer.entropy_id)

    {:ok, hidden_question} =
      Discussions.ask_question(asker.id, product.id, %{
        title: "hidden question",
        body: "Hidden question body"
      })

    {:ok, _hidden_question} =
      Discussions.moderate(operator.id, :question, hidden_question.entropy_id, :hidden)

    %{
      product: product,
      visible_reviews:
        published_reviews
        |> Enum.reverse()
        |> Enum.take(2)
        |> Enum.with_index()
        |> Enum.map(fn {review, cursor_index} -> Map.put(review, :cursor_index, cursor_index) end),
      question: question,
      first_answer: first_answer,
      accepted_answer: accepted_answer
    }
  end

  defp viewer_submission_products(prefix, owner, operator, indexes) do
    Enum.map(indexes, fn index ->
      slug = "#{prefix}-#{String.pad_leading(Integer.to_string(index), 2, "0")}"
      product = SpecsFixtures.product_fixture(%{slug: slug, name: slug})

      {:ok, review} =
        Discussions.submit_review(owner.id, product.id, %{
          rating: rem(index, 5) + 1,
          title: "Owner review #{index}"
        })

      {:ok, hidden_question} =
        Discussions.ask_question(owner.id, product.id, %{
          title: "Owner hidden question #{index}"
        })

      {:ok, hidden_question} =
        Discussions.moderate(
          operator.id,
          :question,
          hidden_question.entropy_id,
          :published
        )

      {:ok, published_hidden_answer} =
        Discussions.answer_question(
          owner.id,
          hidden_question.entropy_id,
          "Published answer under hidden question #{index}"
        )

      {:ok, published_hidden_answer} =
        Discussions.moderate(
          operator.id,
          :answer,
          published_hidden_answer.entropy_id,
          :published
        )

      {:ok, hidden_question} =
        Discussions.moderate(operator.id, :question, hidden_question.entropy_id, :hidden)

      other_asker = AccountsFixtures.user_fixture()

      {:ok, public_question} =
        Discussions.ask_question(other_asker.id, product.id, %{
          title: "Other user's public question #{index}"
        })

      {:ok, public_question} =
        Discussions.moderate(
          operator.id,
          :question,
          public_question.entropy_id,
          :published
        )

      {:ok, pending_answer} =
        Discussions.answer_question(
          owner.id,
          public_question.entropy_id,
          "Pending answer #{index}"
        )

      %{
        product: product,
        review: review,
        hidden_question: hidden_question,
        published_hidden_answer: published_hidden_answer,
        pending_answer: pending_answer
      }
    end)
  end

  defp cursor_for(index), do: Base.encode64("cursor:#{index}")

  defp assert_product_evidence_values(nodes, products) do
    Enum.each(Enum.chunk_every(products, 3), &assert_product_evidence_group(nodes, &1))
  end

  defp assert_product_evidence_group(nodes, [reviewed, unreviewed, missing]) do
    reviewed_node = node_for(nodes, reviewed.slug)
    reviewed_structured_data = get_in(reviewed_node, ["seo", "structuredData"])

    assert is_binary(reviewed_node["offerTruth"]["asOf"])

    assert Map.delete(reviewed_node["offerTruth"], "asOf") == %{
             "freshForSeconds" => 86_400,
             "staleAfterSeconds" => 259_200,
             "offerCount" => 1,
             "observedOfferCount" => 1,
             "eligibleOfferCount" => 1,
             "currencySummaries" => [
               %{
                 "currency" => "USD",
                 "offerCount" => 1,
                 "observedOfferCount" => 1,
                 "eligibleOfferCount" => 1,
                 "bestOffer" => %{
                   "currency" => "USD",
                   "itemPrice" => "100",
                   "shipping" => "5",
                   "landedPrice" => "105",
                   "landedPriceComplete" => true,
                   "stockStatus" => "IN_STOCK",
                   "freshness" => "FRESH",
                   "eligible" => true
                 }
               }
             ]
           }

    assert reviewed_node["reviewSummary"] == %{"count" => 1, "averageRating" => "4.00"}

    assert reviewed_node["seo"] == %{
             "title" => "#{reviewed.name} specifications and prices | Product Compare",
             "description" => @evidence_description,
             "canonicalPath" => "/products/#{reviewed.slug}",
             "indexable" => true,
             "imageUrl" => nil,
             "structuredData" => reviewed_structured_data
           }

    assert Jason.decode!(reviewed_structured_data) == %{
             "@context" => "https://schema.org",
             "@type" => "Product",
             "name" => reviewed.name,
             "description" => @evidence_description,
             "url" => "/products/#{reviewed.slug}",
             "brand" => %{"@type" => "Brand", "name" => "#{reviewed.slug} Brand"},
             "offers" => %{
               "@type" => "AggregateOffer",
               "availability" => "https://schema.org/InStock",
               "lowPrice" => "105",
               "offerCount" => 1,
               "priceCurrency" => "USD"
             },
             "aggregateRating" => %{
               "@type" => "AggregateRating",
               "ratingValue" => "4.00",
               "reviewCount" => 1
             }
           }

    assert node_for(nodes, unreviewed.slug)["reviewSummary"] == %{
             "count" => 0,
             "averageRating" => nil
           }

    assert node_for(nodes, unreviewed.slug)["seo"]["indexable"]

    assert is_binary(node_for(nodes, missing.slug)["offerTruth"]["asOf"])

    assert Map.delete(node_for(nodes, missing.slug)["offerTruth"], "asOf") == %{
             "freshForSeconds" => 86_400,
             "staleAfterSeconds" => 259_200,
             "offerCount" => 0,
             "observedOfferCount" => 0,
             "eligibleOfferCount" => 0,
             "currencySummaries" => []
           }

    assert node_for(nodes, missing.slug)["reviewSummary"] == %{
             "count" => 0,
             "averageRating" => nil
           }

    assert node_for(nodes, missing.slug)["seo"] == %{
             "title" => "#{missing.name} specifications and prices | Product Compare",
             "description" =>
               "Compare accepted specifications and current offer evidence for #{missing.name}.",
             "canonicalPath" => "/products/#{missing.slug}",
             "indexable" => false,
             "imageUrl" => nil,
             "structuredData" => nil
           }
  end

  defp assert_offer_as_of_is_shared(nodes) do
    assert nodes
           |> Enum.map(&get_in(&1, ["offerTruth", "asOf"]))
           |> Enum.uniq()
           |> length() == 1
  end

  defp node_for(nodes, slug), do: Enum.find(nodes, &(&1["slug"] == slug))

  defp product_evidence_set(prefix, operator) do
    [
      qualified_evidence_product("#{prefix}-reviewed", operator, true),
      qualified_evidence_product("#{prefix}-unreviewed", operator, false),
      product_without_evidence("#{prefix}-missing")
    ]
  end

  defp public_slug_product_records(prefix) do
    historical = SpecsFixtures.product_fixture(%{slug: "#{prefix}-legacy"})
    {:ok, historical} = Catalog.update_product(historical, %{slug: "#{prefix}-current"})
    canonical = SpecsFixtures.product_fixture(%{slug: "#{prefix}-canonical"})
    other = SpecsFixtures.product_fixture(%{slug: "#{prefix}-other"})

    [
      public_slug_product_record("#{prefix}-legacy", historical),
      public_slug_product_record(canonical.slug, canonical),
      public_slug_product_record(other.slug, other),
      %{requested_slug: "#{prefix}-missing", product: nil}
    ]
  end

  defp public_slug_product_record(requested_slug, product) do
    %{
      requested_slug: requested_slug,
      product: product,
      brand: Catalog.get_brand(product.brand_id)
    }
  end

  defp public_slug_merchant_records(prefix) do
    product = SpecsFixtures.product_fixture(%{slug: "#{prefix}-merchant-product"})

    records =
      Enum.map(1..3, fn index ->
        merchant =
          merchant_fixture(%{
            name: "#{prefix} Merchant #{index}",
            domain: "#{prefix}-merchant-#{index}.example"
          })

        merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

        {:ok, _price_point} =
          Pricing.add_price_point(%{
            merchant_product_id: merchant_product.id,
            observed_at: DateTime.utc_now(),
            price: "#{100 + index}",
            shipping: "5",
            in_stock: true
          })

        %{requested_slug: merchant.slug, merchant: merchant}
      end)

    records ++ [%{requested_slug: "#{prefix}-missing-merchant", merchant: nil}]
  end

  defp category_batching_set(prefix, operator, indexes) do
    type_taxonomy = TaxonomyFixtures.taxonomy_fixture("type", "Type")

    Enum.map(indexes, fn index ->
      category =
        TaxonomyFixtures.taxon_fixture(%{
          taxonomy_id: type_taxonomy.id,
          code: "#{prefix}-#{index}",
          name: "Category #{index}",
          seo_slug: "#{prefix}-#{index}",
          seo_description:
            String.duplicate("Compare current category specifications and offer evidence. ", 2),
          seo_indexable: true
        })

      products =
        Enum.map(1..3, fn product_index ->
          qualified_category_product(
            "#{prefix}-#{index}-product-#{product_index}",
            category,
            operator
          )
        end)

      %{category: category, products: products}
    end)
  end

  defp qualified_category_product(slug, category, operator) do
    product =
      SpecsFixtures.product_fixture(%{
        slug: slug,
        description: @evidence_description,
        primary_type_taxon: category
      })

    Enum.each(["Resolution", "Weight"], fn label ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "#{slug}-#{String.downcase(label)}",
          data_type: :text,
          display_name: label
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: "Known #{label}"}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)

      {:ok, _current} =
        Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "#{slug} Merchant", domain: "#{slug}.example"})

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{slug}.example/product",
        currency: "USD",
        is_active: true
      })

    {:ok, _point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.utc_now(),
        price: "100",
        shipping: "5",
        in_stock: true
      })

    product
  end

  defp qualified_evidence_product(slug, operator, publish_review?) do
    canonical_slug = canonical_slug(slug)
    {:ok, brand} = Catalog.upsert_brand(%{name: "#{canonical_slug} Brand"})

    product =
      SpecsFixtures.product_fixture(%{
        slug: slug,
        brand_id: brand.id,
        description: @evidence_description
      })

    Enum.each(["Resolution", "Weight"], fn label ->
      attribute =
        SpecsFixtures.attribute_fixture(%{
          code: "#{slug}-#{String.downcase(label)}",
          data_type: :text,
          display_name: label
        })

      {:ok, claim} =
        Specs.propose_claim(product.id, attribute.id, %{value_text: "Known #{label}"}, %{
          source_type: :user,
          created_by: operator.id
        })

      {:ok, claim} = Specs.accept_claim(claim.id, operator.id)

      {:ok, _current} =
        Specs.select_current_claim(product.id, attribute.id, claim.id, operator.id)
    end)

    {:ok, merchant} =
      Pricing.upsert_merchant(%{name: "#{slug} Merchant", domain: "#{slug}.example"})

    {:ok, offer} =
      Pricing.upsert_merchant_product(%{
        merchant_id: merchant.id,
        product_id: product.id,
        url: "https://#{slug}.example/product",
        currency: "USD",
        is_active: true
      })

    {:ok, _point} =
      Pricing.add_price_point(%{
        merchant_product_id: offer.id,
        observed_at: DateTime.utc_now(),
        price: "100",
        shipping: "5",
        in_stock: true
      })

    if publish_review? do
      {:ok, review} =
        Discussions.submit_review(AccountsFixtures.user_fixture().id, product.id, %{
          rating: 4,
          title: "Published review",
          body: "This review is public."
        })

      {:ok, _published} =
        Discussions.moderate(operator.id, :review, review.entropy_id, :published)
    end

    product
  end

  defp product_without_evidence(slug) do
    canonical_slug = canonical_slug(slug)
    {:ok, brand} = Catalog.upsert_brand(%{name: "#{canonical_slug} Brand"})
    SpecsFixtures.product_fixture(%{slug: slug, brand_id: brand.id})
  end

  defp public_node_records(prefix, indexes) do
    Enum.map(indexes, fn index ->
      {:ok, brand} = Catalog.upsert_brand(%{name: "#{prefix} Brand #{index}"})

      product =
        SpecsFixtures.product_fixture(%{
          brand_id: brand.id,
          slug: "#{prefix}-product-#{index}",
          name: "#{prefix} Product #{index}"
        })

      merchant =
        merchant_fixture(%{
          name: "#{prefix} Merchant #{index}",
          domain: unique_domain("#{prefix}-merchant-#{index}")
        })

      merchant_product =
        merchant_product_fixture(%{
          merchant: merchant,
          product: product,
          is_active: rem(index, 2) == 1
        })

      observed_at =
        ~U[2026-07-21 12:00:00Z]
        |> DateTime.add(index, :second)
        |> DateTime.truncate(:microsecond)

      {:ok, price_point} =
        Pricing.add_price_point(%{
          merchant_product_id: merchant_product.id,
          observed_at: observed_at,
          price: Decimal.new("#{100 + index}.25")
        })

      source =
        %Source{}
        |> Source.changeset(%{
          kind: "affiliate",
          name: "#{prefix} Source #{index}",
          domain: "#{prefix}-source-#{index}.example.com"
        })
        |> Repo.insert!()

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          url: "https://#{prefix}-source-#{index}.example.com/product",
          fetched_at: observed_at,
          content_hash: "#{prefix}-artifact-#{index}"
        })
        |> Repo.insert!()

      %{
        product: product,
        brand: brand,
        merchant: merchant,
        merchant_product: merchant_product,
        price_point: price_point,
        source: source,
        artifact: artifact
      }
    end)
  end

  defp authorized_node_records(owner, prefix, indexes) do
    Enum.map(indexes, fn index ->
      product =
        SpecsFixtures.product_fixture(%{
          slug: "#{prefix}-authorized-product-#{index}",
          name: "#{prefix} Authorized Product #{index}"
        })

      merchant =
        merchant_fixture(%{
          name: "#{prefix} Authorized Merchant #{index}",
          domain: unique_domain("#{prefix}-authorized-merchant-#{index}")
        })

      merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

      {:ok, network} =
        Affiliate.upsert_network(%{name: "#{prefix} Authorized Network #{index}"})

      {:ok, program} =
        Affiliate.upsert_program(%{
          affiliate_network_id: network.id,
          merchant_id: merchant.id,
          program_code: "#{prefix}-program-#{index}",
          status: "active"
        })

      {:ok, link} =
        Affiliate.upsert_link(%{
          merchant_product_id: merchant_product.id,
          affiliate_network_id: network.id,
          original_url: merchant_product.url,
          affiliate_url: "https://affiliate.example.com/#{prefix}/#{index}"
        })

      {:ok, coupon} =
        Affiliate.create_coupon(%{
          merchant_id: merchant.id,
          affiliate_network_id: network.id,
          code: "#{prefix}-coupon-#{index}",
          discount_type: :other
        })

      {:ok, saved_set} =
        Catalog.create_saved_comparison_set(owner.id, %{
          name: "Authorized set #{index}",
          product_ids: [product.id]
        })

      {:ok, %{api_token: api_token}} =
        Accounts.create_api_token(owner.id, %{label: "Authorized token #{index}"})

      %{
        product: product,
        merchant: merchant,
        merchant_product: merchant_product,
        network: network,
        program: program,
        link: link,
        coupon: coupon,
        saved_set: saved_set,
        api_token: api_token
      }
    end)
  end

  defp public_opaque_records(prefix, indexes) do
    owner = AccountsFixtures.user_fixture()
    answer_author = AccountsFixtures.user_fixture()
    operator = AccountsFixtures.operator_fixture()

    Enum.map(indexes, fn index ->
      fetched_at =
        ~U[2026-07-21 18:00:00Z]
        |> DateTime.add(index, :second)
        |> DateTime.truncate(:microsecond)

      source =
        %Source{}
        |> Source.changeset(%{
          kind: "affiliate",
          name: "#{prefix} Source #{index}",
          domain: "#{prefix}-source-#{index}.example.com"
        })
        |> Repo.insert!()

      artifact =
        %SourceArtifact{}
        |> SourceArtifact.changeset(%{
          source_id: source.id,
          url: "https://#{prefix}-source-#{index}.example.com/product",
          fetched_at: fetched_at,
          content_hash: "#{prefix}-artifact-#{index}"
        })
        |> Repo.insert!()

      question_product =
        SpecsFixtures.product_fixture(%{name: "#{prefix} Question Product #{index}"})

      {:ok, question} =
        Discussions.ask_question(owner.id, question_product.id, %{
          title: "#{prefix} Question #{index}",
          body: "Public opaque-key question #{index}"
        })

      {:ok, question} =
        Discussions.moderate(operator.id, :question, question.entropy_id, :published)

      {:ok, answer} =
        Discussions.answer_question(
          answer_author.id,
          question.entropy_id,
          "Public opaque-key answer #{index}"
        )

      {:ok, answer} =
        Discussions.moderate(operator.id, :answer, answer.entropy_id, :published)

      {:ok, question} =
        Discussions.accept_answer(owner.id, question.entropy_id, answer.entropy_id)

      comparison_product =
        SpecsFixtures.product_fixture(%{name: "#{prefix} Comparison Product #{index}"})

      {:ok, snapshot} =
        ComparisonSnapshots.publish(owner.id, %{
          title: "#{prefix} Snapshot #{index}",
          product_ids: [question_product.id, comparison_product.id],
          recommendation_profile: :lowest_current_cost
        })

      %{
        source: source,
        artifact: artifact,
        question: question,
        answer: answer,
        snapshot: snapshot
      }
    end)
  end

  defp owner_management_record(:specification_corrections, owner, prefix) do
    product = SpecsFixtures.product_fixture(%{name: "#{prefix} Correction Product"})

    attribute =
      SpecsFixtures.attribute_fixture(%{
        code: canonical_slug("#{prefix}-correction-attribute"),
        data_type: :text,
        display_name: "#{prefix} Correction Attribute"
      })

    {:ok, correction} =
      Specs.propose_correction(
        product.id,
        attribute.id,
        owner.id,
        %{value_text: "Owner proposed value"},
        %{
          reason: "Owner supplied correction evidence.",
          explanation: "The visible specification differs from the manufacturer's documentation."
        }
      )

    %{
      "id" => relay_id(:specification_correction, correction.id),
      "productId" => relay_id(:product, product.id),
      "status" => "PENDING",
      "valueText" => "Owner proposed value"
    }
  end

  defp owner_management_record(:price_watches, owner, prefix) do
    product = SpecsFixtures.product_fixture(%{name: "#{prefix} Watch Product"})

    {:ok, watch} =
      Alerts.create_watch(owner.id, %{
        product_id: product.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "75"
      })

    %{
      "id" => relay_id(:price_watch, watch.entropy_id),
      "enabled" => true,
      "productName" => product.name,
      "merchantName" => nil
    }
  end

  defp owner_management_record(:alert_events, owner, prefix) do
    product = SpecsFixtures.product_fixture(%{name: "#{prefix} Alert Product"})

    merchant =
      merchant_fixture(%{
        name: "#{prefix} Alert Merchant",
        domain: unique_domain("#{prefix}-alert-merchant")
      })

    merchant_product =
      merchant_product_fixture(%{merchant: merchant, product: product, currency: "USD"})

    {:ok, _watch} =
      Alerts.create_watch(owner.id, %{
        product_id: product.id,
        rule_type: :target_price,
        currency: "USD",
        target_amount: "50"
      })

    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    {:ok, price_point} =
      Pricing.add_price_point(%{
        merchant_product_id: merchant_product.id,
        observed_at: now,
        price: "40",
        shipping: "5",
        in_stock: true
      })

    {:ok, %{events_created: 1}} = Alerts.evaluate_price_point(price_point.id, now: now)
    event = owner.id |> Alerts.list_alert_events_query() |> Repo.one!()

    %{
      "id" => relay_id(:alert_event, event.entropy_id),
      "productName" => product.name,
      "merchantName" => merchant.name,
      "landedPrice" => "45",
      "readAt" => nil
    }
  end

  defp owner_management_record(:api_tokens, owner, prefix) do
    {:ok, %{api_token: token}} =
      Accounts.create_api_token(owner.id, %{label: "#{prefix} Owner Token"})

    %{
      "id" => relay_id(:api_token, token.entropy_id),
      "label" => token.label,
      "tokenPrefix" => token.token_prefix,
      "revokedAt" => nil
    }
  end

  defp owner_management_record(:saved_comparison_sets, owner, prefix) do
    product = SpecsFixtures.product_fixture(%{name: "#{prefix} Saved Product"})

    {:ok, saved_set} =
      Catalog.create_saved_comparison_set(owner.id, %{
        name: "#{prefix} Saved Set",
        product_ids: [product.id]
      })

    %{
      "id" => relay_id(:saved_comparison_set, saved_set.entropy_id),
      "name" => saved_set.name,
      "items" => [
        %{
          "position" => 1,
          "product" => %{
            "id" => relay_id(:product, product.id),
            "name" => product.name
          }
        }
      ]
    }
  end

  defp owner_management_record(:comparison_snapshots, owner, prefix) do
    first = SpecsFixtures.product_fixture(%{name: "#{prefix} Snapshot First"})
    second = SpecsFixtures.product_fixture(%{name: "#{prefix} Snapshot Second"})

    {:ok, snapshot} =
      ComparisonSnapshots.publish(owner.id, %{
        title: "#{prefix} Snapshot",
        product_ids: [first.id, second.id],
        recommendation_profile: :lowest_current_cost
      })

    %{
      "id" => relay_id(:comparison_snapshot, snapshot.entropy_id),
      "title" => snapshot.title,
      "sharePath" => "/compare/shared/#{snapshot.public_token}",
      "products" => [
        %{"id" => relay_id(:product, first.id), "name" => first.name},
        %{"id" => relay_id(:product, second.id), "name" => second.name}
      ]
    }
  end

  defp canonical_slug(value) do
    value
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9]+/u, "-")
    |> String.trim("-")
  end

  defp relevant_query?(query) when is_binary(query) do
    Enum.any?(@tracked_tables, &query_targets_table?(query, &1))
  end

  defp query_targets_table?(query, table) when is_binary(query) and is_atom(table) do
    String.contains?(query, ~s(FROM "#{table}"))
  end

  defp merchant_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    {:ok, merchant} =
      attrs
      |> Map.put_new(:name, "Merchant #{suffix}")
      |> Map.put_new(:domain, "merchant-#{suffix}.example.com")
      |> Pricing.upsert_merchant()

    merchant
  end

  defp merchant_product_fixture(attrs) do
    merchant = Map.get(attrs, :merchant) || merchant_fixture()
    product = Map.get(attrs, :product) || SpecsFixtures.product_fixture()
    suffix = System.unique_integer([:positive])

    params =
      attrs
      |> Map.drop([:merchant, :product])
      |> Map.put_new(:merchant_id, merchant.id)
      |> Map.put_new(:product_id, product.id)
      |> Map.put_new(:url, "https://merchant.example.com/products/#{suffix}")
      |> Map.put_new(:currency, "usd")
      |> Map.put_new(:external_sku, "sku-#{suffix}")
      |> Map.put_new(:is_active, true)

    {:ok, merchant_product} = Pricing.upsert_merchant_product(params)
    merchant_product
  end

  defp comparison_root_record(prefix, index) do
    {first, first_point} =
      comparison_root_product_with_price(prefix, index, "First", "100")

    {second, second_point} =
      comparison_root_product_with_price(prefix, index, "Second", "80")

    %{first: first, first_point: first_point, second: second, second_point: second_point}
  end

  defp comparison_root_product_with_price(prefix, index, position, price) do
    product =
      SpecsFixtures.product_fixture(%{
        slug: canonical_slug("#{prefix}-#{index}-#{position}"),
        name: "Comparison Root #{index} #{position}"
      })

    merchant =
      merchant_fixture(%{
        name: "Comparison Root #{index} #{position} Merchant",
        domain: canonical_slug("#{prefix}-#{index}-#{position}") <> ".example"
      })

    merchant_product = merchant_product_fixture(%{merchant: merchant, product: product})

    {:ok, point} =
      Pricing.add_price_point(%{
        merchant_product_id: merchant_product.id,
        observed_at: DateTime.utc_now() |> DateTime.truncate(:microsecond),
        price: Decimal.new(price),
        shipping: Decimal.new("0"),
        in_stock: true
      })

    {product, point}
  end

  defp unique_name(prefix), do: "#{prefix} #{System.unique_integer([:positive])}"
  defp unique_domain(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}.example.com"
end
