defmodule ProductCompare.Ingestion.CJFeedDiscoveryTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureLog
  import ExUnit.CaptureIO

  alias ProductCompare.Ingestion.CJFeedDiscovery
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source

  describe "run/1" do
    test "does not change the current Logger level while fetching feeds" do
      original_level = Logger.level()
      parent = self()

      fetcher = fn _cursor, _opts ->
        send(
          parent,
          {:logger_levels, Logger.level(), Logger.get_process_level(self())}
        )

        {:ok, [], nil}
      end

      try do
        Logger.put_process_level(self(), :debug)
        assert Logger.level() == original_level

        capture_log(fn ->
          assert {:ok, %{candidates_persisted: 0, failed: 0, feeds_fetched: 0, pages_fetched: 1}} =
                   CJFeedDiscovery.run(advertiser_country: "US", fetcher: fetcher, limit: 1)
        end)

        assert_receive {:logger_levels, ^original_level, :debug}
        assert Logger.level() == original_level
        assert Logger.get_process_level(self()) == :debug
      after
        Logger.delete_process_level(self())
      end
    end

    test "fetches CJ shopping product feeds and records run counts" do
      parent = self()

      fetcher = fn cursor, opts ->
        send(parent, {:fetch, cursor, opts})

        {:ok,
         [
           %{
             "adId" => "feed-1",
             "advertiserCountry" => " us ",
             "advertiserId" => "adv-1",
             "advertiserName" => "Merchant",
             "currency" => "USD",
             "feedName" => "US Shopping",
             "language" => " en ",
             "lastUpdated" => "2026-06-04T18:34:49Z",
             "productCount" => 10,
             "sourceFeedType" => "SHOPPING"
           }
         ], nil}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{candidates_persisted: 1, failed: 0, feeds_fetched: 1, pages_fetched: 1}} =
                   CJFeedDiscovery.run(
                     advertiser_country: "US",
                     fetcher: fetcher,
                     limit: 1,
                     pages: 1
                   )
        end)

      assert output == ""
      assert_receive {:fetch, nil, opts}
      assert opts[:advertiser_country] == "US"
      assert opts[:limit] == 1

      assert %Source{id: source_id, kind: "affiliate_feed", name: "CJ", domain: "cj.com"} =
               Repo.get_by(Source, name: "CJ", domain: "cj.com")

      assert %MerchantFeedCandidate{
               source_id: ^source_id,
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
               surface: "shoppingProductFeeds",
               status: :succeeded,
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

    test "returns the next cursor recorded on a successful discovery run" do
      fetcher = fn _cursor, _opts ->
        {:ok, [], 5}
      end

      assert {:ok,
              %{
                candidates_persisted: 0,
                failed: 0,
                feeds_fetched: 0,
                pages_fetched: 1,
                next_cursor: 5
              }} =
               CJFeedDiscovery.run(
                 advertiser_country: "US",
                 fetcher: fetcher,
                 limit: 1,
                 pages: 1
               )

      assert %ImportRun{status: :succeeded, cursor_start: 0, cursor_end: 5} =
               Repo.get_by!(ImportRun, surface: "shoppingProductFeeds")
    end

    test "records partial run counts when a later page fetch fails" do
      feed = %{
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

      fetcher = fn
        nil, _opts -> {:ok, [feed], 1}
        1, _opts -> {:error, :test_failure}
      end

      assert {:error, :test_failure} =
               CJFeedDiscovery.run(
                 advertiser_country: "US",
                 fetcher: fetcher,
                 limit: 1,
                 pages: 2
               )

      assert %Source{id: source_id} = Repo.get_by(Source, name: "CJ", domain: "cj.com")

      assert %MerchantFeedCandidate{} =
               Repo.get_by!(MerchantFeedCandidate,
                 source_id: source_id,
                 provider_feed_id: "feed-1"
               )

      assert %ImportRun{
               source_id: ^source_id,
               surface: "shoppingProductFeeds",
               status: :failed,
               cursor_start: 0,
               cursor_end: 1,
               page_size: 1,
               pages_requested: 2,
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 0,
               records_persisted: 1,
               records_failed: 0,
               error_summary: "fetch_failed"
             } = Repo.get_by!(ImportRun, source_id: source_id, surface: "shoppingProductFeeds")
    end

    test "does not persist raw provider payloads for fetch failures" do
      fetcher = fn _cursor, _opts ->
        {:error,
         {:provider_error,
          %{
            body: "raw-provider-payload",
            headers: [{"authorization", "Bearer provider-secret"}]
          }}}
      end

      assert {:error,
              {:provider_error,
               %{
                 body: "raw-provider-payload",
                 headers: [{"authorization", "Bearer provider-secret"}]
               }}} =
               CJFeedDiscovery.run(advertiser_country: "US", fetcher: fetcher, limit: 1)

      assert %ImportRun{status: :failed, error_summary: "fetch_failed"} =
               Repo.get_by!(ImportRun, surface: "shoppingProductFeeds")
    end

    test "marks the import run failed when the fetcher raises after run start" do
      fetcher = fn _cursor, _opts ->
        raise "raw-provider-payload"
      end

      assert {:error, :runner_exception} =
               CJFeedDiscovery.run(advertiser_country: "US", fetcher: fetcher, limit: 1)

      assert %ImportRun{
               status: :failed,
               error_summary: "fetch_failed",
               pages_fetched: 0,
               records_fetched: 0,
               records_persisted: 0,
               records_failed: 0
             } = Repo.get_by!(ImportRun, surface: "shoppingProductFeeds")
    end

    test "returns finalization failures from the fetch-error path" do
      fetcher = fn
        nil, _opts -> {:ok, [], "invalid-cursor"}
        "invalid-cursor", _opts -> {:error, :fetch_failed}
      end

      assert {:error, %Ecto.Changeset{} = changeset} =
               CJFeedDiscovery.run(
                 advertiser_country: "US",
                 fetcher: fetcher,
                 limit: 1,
                 pages: 2
               )

      assert {"is invalid", _meta} = changeset.errors[:cursor_end]
    end

    test "uses one page when the requested page count is invalid" do
      parent = self()

      fetcher = fn cursor, _opts ->
        send(parent, {:fetch, cursor})

        {:ok, [], 1}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{pages_fetched: 1}} =
                   CJFeedDiscovery.run(
                     advertiser_country: "US",
                     fetcher: fetcher,
                     limit: 1,
                     pages: 0
                   )
        end)

      assert output == ""
      assert_receive {:fetch, nil}
      refute_receive {:fetch, 1}

      assert %Source{id: source_id} = Repo.get_by(Source, name: "CJ", domain: "cj.com")

      assert %ImportRun{
               source_id: ^source_id,
               pages_requested: 1,
               pages_fetched: 1,
               cursor_end: 1
             } = Repo.get_by!(ImportRun, source_id: source_id, surface: "shoppingProductFeeds")
    end

    test "reuses an existing CJ source by unique key" do
      existing_source =
        %Source{}
        |> Source.changeset(%{kind: "affiliate_feed", name: "CJ"})
        |> Repo.insert!()

      fetcher = fn _cursor, _opts ->
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

      assert {:ok, %{candidates_persisted: 1, failed: 0, feeds_fetched: 1, pages_fetched: 1}} =
               CJFeedDiscovery.run(advertiser_country: "US", fetcher: fetcher, limit: 1)

      assert %{domain: "cj.com"} = Repo.get!(Source, existing_source.id)
      assert Repo.aggregate(Source, :count, :id) == 1

      assert %ImportRun{source_id: source_id, status: :succeeded} =
               Repo.get_by!(ImportRun, surface: "shoppingProductFeeds")

      assert source_id == existing_source.id
    end

    test "returns an error when fetched feeds fail candidate persistence" do
      fetcher = fn _cursor, _opts ->
        {:ok,
         [
           %{
             "advertiserCountry" => "US",
             "advertiserId" => "adv-1",
             "advertiserName" => "Merchant",
             "currency" => "USD",
             "feedName" => "Missing ID Feed",
             "language" => "EN",
             "lastUpdated" => "2026-06-04T18:34:49Z",
             "productCount" => 10,
             "sourceFeedType" => "SHOPPING"
           }
         ], nil}
      end

      output =
        capture_io(fn ->
          assert {:error,
                  {:row_failures,
                   %{
                     candidates_persisted: 0,
                     failed: 1,
                     feeds_fetched: 1,
                     pages_fetched: 1
                   }}} =
                   CJFeedDiscovery.run(advertiser_country: "US", fetcher: fetcher, limit: 1)
        end)

      assert output == ""

      assert %ImportRun{
               status: :failed,
               records_fetched: 1,
               records_normalized: 0,
               records_persisted: 0,
               records_failed: 1
             } = Repo.get_by!(ImportRun, surface: "shoppingProductFeeds")
    end
  end
end
