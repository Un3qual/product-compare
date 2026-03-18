defmodule ProductCompareWeb.GraphQL.DataloaderBatchingTest do
  use ProductCompareWeb.ConnCase, async: false

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
              "productId" => relay_id("Product", first_product.id),
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

      assert first_product_id == relay_id("Product", first_product.id)
      assert second_product_id == relay_id("Product", second_product.id)
      assert first_brand_id == relay_id("Brand", first_product.brand_id)
      assert second_brand_id == relay_id("Brand", second_product.brand_id)
      assert length(edges) == 4

      Enum.each(merchant_products, fn {merchant_product, merchant, latest_price} ->
        assert Enum.any?(edges, fn edge ->
                 edge["node"] == %{
                   "id" => relay_id("MerchantProduct", merchant_product.id),
                   "merchant" => %{
                     "id" => relay_id("Merchant", merchant.id),
                     "name" => merchant.name
                   },
                   "product" => %{
                     "id" => relay_id("Product", first_product.id),
                     "slug" => first_product.slug
                   },
                   "latestPrice" => %{
                     "id" => relay_id("PricePoint", latest_price.id),
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

  defp count_queries_by_table(queries) do
    Enum.into(@tracked_tables, %{}, fn table ->
      {table, Enum.count(queries, &query_targets_table?(&1, table))}
    end)
  end

  defp relevant_query?(query) when is_binary(query) do
    Enum.any?(@tracked_tables, &query_targets_table?(query, &1))
  end

  defp query_targets_table?(query, table) when is_binary(query) and is_atom(table) do
    String.contains?(query, ~s(FROM "#{table}"))
  end

  defp select_query?(query) when is_binary(query) do
    query
    |> String.trim_leading()
    |> String.upcase()
    |> String.starts_with?("SELECT")
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
    merchant = Map.get(attrs, :merchant, merchant_fixture())
    product = Map.get(attrs, :product, SpecsFixtures.product_fixture())
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

  defp relay_id(type, local_id), do: Base.encode64("#{type}:#{local_id}")

  defp unique_name(prefix), do: "#{prefix} #{System.unique_integer([:positive])}"
  defp unique_domain(prefix), do: "#{prefix}-#{System.unique_integer([:positive])}.example.com"
end
