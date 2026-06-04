defmodule Mix.Tasks.ProductCompare.Ingestion.CjFeedsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjFeeds
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  describe "run_discovery/1" do
    test "fetches CJ shopping product feeds and records run counts" do
      parent = self()

      fetcher = fn cursor, opts ->
        send(parent, {:fetch, cursor, opts})

        {:ok,
         [
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
         ], nil}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{candidates_persisted: 1, failed: 0, feeds_fetched: 1, pages_fetched: 1}} =
                   CjFeeds.run_discovery(
                     advertiser_country: "US",
                     fetcher: fetcher,
                     limit: 1,
                     pages: 1
                   )
        end)

      assert_receive {:fetch, nil, opts}
      assert opts[:advertiser_country] == "US"
      assert opts[:limit] == 1

      assert output =~ "feeds_fetched=1 candidates_persisted=1 pages_fetched=1 failed=0"

      assert %Source{id: source_id, kind: "affiliate_feed", name: "CJ", domain: "cj.com"} =
               Repo.get_by(Source, name: "CJ", domain: "cj.com")

      assert %MerchantFeedCandidate{
               source_id: ^source_id,
               provider: "cj",
               provider_feed_id: "feed-1",
               advertiser_id: "adv-1",
               advertiser_name: "Merchant",
               advertiser_country: "US",
               currency: "USD",
               feed_name: "US Shopping",
               language: "EN",
               product_count: 10,
               source_feed_type: "SHOPPING"
             } =
               Repo.get_by!(MerchantFeedCandidate,
                 source_id: source_id,
                 provider_feed_id: "feed-1"
               )

      assert %ImportRun{
               source_id: ^source_id,
               provider: "cj",
               surface: "shoppingProductFeeds",
               status: "succeeded",
               query: %{"advertiserCountry" => "US"},
               cursor_start: 0,
               cursor_end: nil,
               page_size: 1,
               pages_requested: 1,
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 0,
               records_persisted: 1,
               records_failed: 0
             } = Repo.get_by!(ImportRun, source_id: source_id, surface: "shoppingProductFeeds")
    end
  end
end
