defmodule ProductCompare.Ingestion.Sources.CJ.ClientTest do
  use ExUnit.Case, async: false

  alias ProductCompare.Ingestion.Sources.CJ.Client

  @env_keys ~w(CJ_API_TOKEN CJ_ACCOUNT_ID CJ_PROPERTY_ID)

  setup do
    original_env =
      Map.new(@env_keys, fn key ->
        {key, System.get_env(key)}
      end)

    on_exit(fn ->
      Enum.each(original_env, fn
        {key, nil} -> System.delete_env(key)
        {key, value} -> System.put_env(key, value)
      end)
    end)

    Enum.each(@env_keys, &System.delete_env/1)

    :ok
  end

  describe "fetch_batch/2" do
    test "posts a shoppingProducts query with runtime credentials and requested filters" do
      System.put_env("CJ_API_TOKEN", "test-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      parent = self()

      transport = fn request ->
        send(parent, {:request, request})

        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "data" => %{
                 "shoppingProducts" => %{
                   "count" => 1,
                   "limit" => 1,
                   "totalCount" => 2,
                   "resultList" => [
                     %{
                       "adId" => "CJ-1",
                       "advertiserId" => "A-1",
                       "title" => "Trail shoe",
                       "link" => "https://merchant.example/p/trail-shoe",
                       "price" => %{"amount" => "129.99", "currency" => "USD"},
                       "lastUpdated" => "2026-06-04T18:34:49Z"
                     }
                   ]
                 }
               }
             })
         }}
      end

      assert {:ok, [%{"adId" => "CJ-1"}], 1} =
               Client.fetch_batch(nil,
                 currency: "USD",
                 keywords: ["shoe"],
                 limit: 1,
                 serviceable_areas: "US",
                 transport: transport
               )

      assert_receive {:request,
                      %{
                        body: body,
                        headers: headers,
                        method: :post,
                        url: "https://ads.api.cj.com/query"
                      }}

      assert {"Authorization", "Bearer test-token"} in headers
      assert {"Content-Type", "application/json"} in headers

      assert %{
               "query" => query,
               "variables" => %{
                 "companyId" => "1234567",
                 "currency" => "USD",
                 "keywords" => ["shoe"],
                 "limit" => 1,
                 "offset" => 0,
                 "serviceableAreas" => ["US"]
               }
             } = Jason.decode!(body)

      assert query =~ "shoppingProducts"
      assert query =~ "partnerStatus: JOINED"
      assert query =~ "$serviceableAreas: [String!]"
    end

    test "scopes shoppingProducts to discovered feeds and advertisers" do
      System.put_env("CJ_API_TOKEN", "test-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      parent = self()

      transport = fn request ->
        send(parent, {:request, request})

        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "data" => %{
                 "shoppingProducts" => %{
                   "count" => 0,
                   "limit" => 25,
                   "totalCount" => 0,
                   "resultList" => []
                 }
               }
             })
         }}
      end

      assert {:ok, [], nil} =
               Client.fetch_batch(nil,
                 ad_ids: ["feed-1"],
                 partner_ids: ["adv-1"],
                 keywords: nil,
                 limit: 25,
                 transport: transport
               )

      assert_receive {:request, %{body: body}}

      assert %{
               "query" => query,
               "variables" => %{
                 "companyId" => "1234567",
                 "keywords" => nil,
                 "limit" => 25,
                 "offset" => 0,
                 "adIds" => ["feed-1"],
                 "partnerIds" => ["adv-1"]
               }
             } = Jason.decode!(body)

      assert query =~ "$adIds: [ID!]"
      assert query =~ "adIds: $adIds"
      assert query =~ "$partnerIds: [ID!]"
      assert query =~ "partnerIds: $partnerIds"
      refute query =~ "advertiserIds"
    end

    test "returns a missing env error before calling the transport" do
      transport = fn _request -> flunk("transport should not be called without credentials") end

      assert {:error, {:missing_env, "CJ_API_TOKEN"}} =
               Client.fetch_batch(nil, transport: transport)
    end

    test "maps GraphQL errors without returning records" do
      System.put_env("CJ_API_TOKEN", "test-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      transport = fn _request ->
        {:ok,
         %{
           status: 200,
           body: Jason.encode!(%{"errors" => [%{"message" => "forbidden"}]})
         }}
      end

      assert {:error, {:graphql_errors, [%{"message" => "forbidden"}]}} =
               Client.fetch_batch(nil, transport: transport)
    end

    test "uses the response limit when the API caps the requested page size" do
      System.put_env("CJ_API_TOKEN", "test-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      records =
        Enum.map(1..10, fn index ->
          %{"adId" => "CJ-#{index}", "title" => "Product #{index}"}
        end)

      transport = fn _request ->
        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "data" => %{
                 "shoppingProducts" => %{
                   "count" => 10,
                   "limit" => 10,
                   "totalCount" => 50,
                   "resultList" => records
                 }
               }
             })
         }}
      end

      assert {:ok, ^records, 10} =
               Client.fetch_batch(nil,
                 limit: 25,
                 transport: transport
               )
    end
  end

  describe "fetch_feeds/2" do
    test "posts a shoppingProductFeeds query with runtime credentials and requested filters" do
      System.put_env("CJ_API_TOKEN", "test-token")
      System.put_env("CJ_ACCOUNT_ID", "1234567")

      parent = self()

      transport = fn request ->
        send(parent, {:request, request})

        {:ok,
         %{
           status: 200,
           body:
             Jason.encode!(%{
               "data" => %{
                 "shoppingProductFeeds" => %{
                   "count" => 1,
                   "limit" => 1,
                   "totalCount" => 2,
                   "resultList" => [
                     %{
                       "adId" => "feed-1",
                       "advertiserCountry" => "US",
                       "advertiserId" => "adv-1",
                       "advertiserName" => "Merchant",
                       "currency" => "USD",
                       "feedName" => "US Shopping",
                       "language" => "EN",
                       "lastUpdated" => "2026-06-04T18:34:49Z",
                       "productCount" => 10,
                       "sourceFeedType" => "SHOPPING"
                     }
                   ]
                 }
               }
             })
         }}
      end

      assert {:ok, [%{"feedName" => "US Shopping"}], 1} =
               Client.fetch_feeds(nil,
                 advertiser_country: "US",
                 limit: 1,
                 transport: transport
               )

      assert_receive {:request,
                      %{
                        body: body,
                        headers: headers,
                        method: :post,
                        url: "https://ads.api.cj.com/query"
                      }}

      assert {"Authorization", "Bearer test-token"} in headers
      assert {"Content-Type", "application/json"} in headers

      assert %{
               "query" => query,
               "variables" => %{
                 "advertiserCountry" => "US",
                 "companyId" => "1234567",
                 "limit" => 1,
                 "offset" => 0
               }
             } = Jason.decode!(body)

      assert query =~ "shoppingProductFeeds"
      assert query =~ "$advertiserCountry: String"
    end
  end
end
