defmodule ProductCompareWeb.GraphQL.DataloaderBatchingTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.{Catalog, Discussions, Pricing, Specs}
  alias ProductCompare.Fixtures.{AccountsFixtures, SpecsFixtures}

  @tracked_tables ~w(products brands merchant_products merchants price_points)a
  @product_evidence_tables ~w(product_media product_attribute_current product_reviews merchant_products price_points)a
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
               products: 3,
               brands: 1,
               merchant_products: 1,
               merchants: 1,
               price_points: 1
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

  defp merchant_summary_query_budget(queries) do
    %{
      merchant_products: Enum.count(queries, &query_targets_table?(&1, :merchant_products)),
      price_points: Enum.count(queries, &query_targets_table?(&1, :price_points))
    }
  end

  defp product_evidence_query_budget(queries) do
    Enum.into(@product_evidence_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
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

  defp unique_name(prefix), do: "#{prefix} #{System.unique_integer([:positive])}"
  defp unique_domain(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}.example.com"
end
