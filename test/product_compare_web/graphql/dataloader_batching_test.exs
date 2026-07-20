defmodule ProductCompareWeb.GraphQL.DataloaderBatchingTest do
  use ProductCompareWeb.ConnCase, async: false

  import ProductCompare.DatabaseTestHelpers, only: [capture_select_queries: 1]

  alias ProductCompare.Fixtures.SpecsFixtures
  alias ProductCompare.Pricing

  @tracked_tables ~w(products brands merchant_products merchants price_points)a

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
      assert length(initial_edges) == 3
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

  defp summary_for(edges, merchant_name) do
    edges
    |> Enum.find(fn edge -> edge["node"]["name"] == merchant_name end)
    |> get_in(["node", "detailSummary"])
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
