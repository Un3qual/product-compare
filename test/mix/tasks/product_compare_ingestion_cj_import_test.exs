defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  setup do
    original_api_token = System.get_env("CJ_API_TOKEN")
    original_account_id = System.get_env("CJ_ACCOUNT_ID")

    on_exit(fn ->
      restore_env("CJ_API_TOKEN", original_api_token)
      restore_env("CJ_ACCOUNT_ID", original_account_id)
    end)

    System.delete_env("CJ_API_TOKEN")
    System.delete_env("CJ_ACCOUNT_ID")

    :ok
  end

  describe "run_import/1" do
    test "reports missing credentials without fetching or persisting rows" do
      System.put_env("CJ_API_TOKEN", " ")
      System.put_env("CJ_ACCOUNT_ID", "\t")

      flunking_fetcher = fn _cursor, _opts ->
        flunk("credential preflight must not call the product fetcher")
      end

      assert {:ok,
              %{
                provider: "cj",
                surface: "shoppingProducts",
                ready: false,
                missing_required: ["CJ_API_TOKEN", "CJ_ACCOUNT_ID"]
              }} =
               CjImport.run_import(
                 check_credentials: true,
                 api_token: "",
                 company_id: " ",
                 fetcher: flunking_fetcher
               )

      assert Repo.aggregate(ImportRun, :count, :id) == 0
      assert Repo.aggregate(SourceArtifact, :count, :id) == 0
      assert Repo.aggregate(ExternalProduct, :count, :id) == 0
      assert Repo.aggregate(MerchantProduct, :count, :id) == 0
      assert Repo.aggregate(PricePoint, :count, :id) == 0
    end

    test "reports ready when credentials are injected without printing secret values" do
      flunking_fetcher = fn _cursor, _opts ->
        flunk("credential preflight must not call the product fetcher")
      end

      output =
        capture_io(fn ->
          assert {:ok,
                  %{
                    provider: "cj",
                    surface: "shoppingProducts",
                    ready: true,
                    missing_required: []
                  }} =
                   CjImport.run_import(
                     check_credentials: true,
                     api_token: "secret-token",
                     company_id: "1234567",
                     fetcher: flunking_fetcher
                   )
        end)

      refute output =~ "secret-token"
      refute output =~ "1234567"
    end

    test "fetches, normalizes, and persists one redacted CJ product record" do
      original_level = Logger.level()
      Logger.configure(level: :debug)

      on_exit(fn ->
        Logger.configure(level: original_level)
      end)

      parent = self()

      fetcher = fn cursor, opts ->
        send(parent, {:fetch, cursor, opts})
        send(parent, {:logger_level, Logger.level()})
        {:ok, product_validation_fixture(), nil}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{failed: 0, fetched: 1, normalized: 1, persisted: 1}} =
                   CjImport.run_import(fetcher: fetcher, keywords: ["shoe"], limit: 1)
        end)

      assert_receive {:fetch, nil, opts}
      assert_receive {:logger_level, :debug}
      assert opts[:keywords] == ["shoe"]
      assert opts[:limit] == 1
      assert Logger.level() == :debug

      assert output =~ "fetched=1 normalized=1 persisted=1 failed=0"

      assert %Source{id: source_id, kind: "affiliate_feed", name: "CJ", domain: "cj.com"} =
               Repo.get_by(Source, name: "CJ", domain: "cj.com")

      assert %ImportRun{
               source_id: ^source_id,
               provider: "cj",
               surface: "shoppingProducts",
               status: "succeeded",
               query: %{"currency" => "USD", "keywords" => ["shoe"], "serviceableAreas" => ["US"]},
               cursor_start: 0,
               cursor_end: nil,
               page_size: 1,
               pages_requested: 1,
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 1,
               records_persisted: 1,
               records_failed: 0
             } = Repo.get_by!(ImportRun, source_id: source_id, surface: "shoppingProducts")

      assert Repo.aggregate(SourceArtifact, :count, :id) == 1
      assert Repo.aggregate(ExternalProduct, :count, :id) == 1
      assert Repo.aggregate(MerchantSourceIdentity, :count, :id) == 1
      assert Repo.aggregate(MerchantProduct, :count, :id) == 1
      assert Repo.aggregate(PricePoint, :count, :id) == 1

      assert Repo.get_by!(SourceArtifact, source_id: source_id).raw_json ==
               hd(product_validation_fixture())
    end

    test "fetches bounded pages and records aggregate run counts" do
      parent = self()

      fetcher = fn
        nil, opts ->
          send(parent, {:fetch, nil, opts})
          {:ok, product_validation_fixture(), 1}

        1, opts ->
          send(parent, {:fetch, 1, opts})
          {:ok, second_product_validation_fixture(), nil}
      end

      output =
        capture_io(fn ->
          assert {:ok,
                  %{
                    failed: 0,
                    fetched: 2,
                    normalized: 2,
                    pages_fetched: 2,
                    persisted: 2
                  }} =
                   CjImport.run_import(fetcher: fetcher, keywords: ["shoe"], limit: 1, pages: 2)
        end)

      assert_receive {:fetch, nil, page_1_opts}
      assert_receive {:fetch, 1, page_2_opts}

      assert page_1_opts[:keywords] == ["shoe"]
      assert page_1_opts[:limit] == 1
      assert page_2_opts[:keywords] == ["shoe"]
      assert page_2_opts[:limit] == 1

      assert output =~ "fetched=2 normalized=2 persisted=2 failed=0 pages_fetched=2"

      assert %Source{id: source_id, kind: "affiliate_feed", name: "CJ", domain: "cj.com"} =
               Repo.get_by(Source, name: "CJ", domain: "cj.com")

      assert %ImportRun{
               source_id: ^source_id,
               provider: "cj",
               surface: "shoppingProducts",
               status: "succeeded",
               cursor_start: 0,
               cursor_end: nil,
               page_size: 1,
               pages_requested: 2,
               pages_fetched: 2,
               records_fetched: 2,
               records_normalized: 2,
               records_persisted: 2,
               records_failed: 0
             } = Repo.get_by!(ImportRun, source_id: source_id, surface: "shoppingProducts")

      assert Repo.aggregate(SourceArtifact, :count, :id) == 2
      assert Repo.aggregate(ExternalProduct, :count, :id) == 2
      assert Repo.aggregate(MerchantProduct, :count, :id) == 2
      assert Repo.aggregate(PricePoint, :count, :id) == 2
    end

    test "imports products for explicit discovered feed candidates by CJ feed and partner ids" do
      source = source_fixture()

      candidate =
        insert_candidate!(source, %{
          advertiser_id: "adv-kotobukiya",
          advertiser_name: "Kotobukiya",
          currency: "USD",
          feed_name: "Kotobukiya US Product Feed",
          provider_feed_id: "feed-kotobukiya"
        })

      parent = self()

      fetcher = fn cursor, opts ->
        send(parent, {:fetch, cursor, opts})
        {:ok, product_validation_fixture(), nil}
      end

      output =
        capture_io(fn ->
          assert {:ok,
                  %{
                    candidates_imported: 1,
                    candidates_matched: 1,
                    failed: 0,
                    fetched: 1,
                    normalized: 1,
                    persisted: 1
                  }} =
                   CjImport.run_import(
                     fetcher: fetcher,
                     limit: 1,
                     pages: 1,
                     provider_feed_ids: [candidate.provider_feed_id]
                   )
        end)

      assert_receive {:fetch, nil, opts}
      assert opts[:ad_ids] == ["feed-kotobukiya"]
      assert opts[:partner_ids] == ["adv-kotobukiya"]
      assert opts[:currency] == "USD"
      assert opts[:keywords] == nil
      assert opts[:limit] == 1

      assert output =~ "candidate_count=1"
      assert output =~ "imported_candidates=1"
      assert output =~ "persisted=1"

      assert %ImportRun{
               query: %{
                 "adIds" => ["feed-kotobukiya"],
                 "feedName" => "Kotobukiya US Product Feed",
                 "merchantFeedCandidateId" => candidate_id,
                 "partnerIds" => ["adv-kotobukiya"],
                 "providerFeedId" => "feed-kotobukiya"
               },
               records_persisted: 1,
               status: "succeeded"
             } = Repo.get_by!(ImportRun, source_id: source.id, surface: "shoppingProducts")

      assert candidate_id == candidate.id

      refute Map.has_key?(
               Repo.get_by!(ImportRun, source_id: source.id, surface: "shoppingProducts").query,
               "advertiserIds"
             )

      assert Repo.aggregate(MerchantProduct, :count, :id) == 1
      assert Repo.aggregate(PricePoint, :count, :id) == 1
    end

    test "imports only shortlisted candidates when importing from reviewed candidates" do
      source = source_fixture()

      shortlisted =
        insert_candidate!(source, %{
          advertiser_id: "adv-shortlisted",
          provider_feed_id: "feed-shortlisted",
          review_status: "shortlisted"
        })

      pending =
        insert_candidate!(source, %{
          advertiser_id: "adv-pending",
          provider_feed_id: "feed-pending",
          review_status: "pending"
        })

      parent = self()

      fetcher = fn cursor, opts ->
        send(parent, {:fetch, cursor, opts})
        {:ok, product_validation_fixture(), nil}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{candidates_imported: 1, candidates_matched: 1, persisted: 1}} =
                   CjImport.run_import(
                     fetcher: fetcher,
                     from_candidates: true,
                     limit: 1,
                     pages: 1,
                     review_status: "shortlisted"
                   )
        end)

      assert_receive {:fetch, nil, opts}
      assert opts[:ad_ids] == ["feed-shortlisted"]
      assert opts[:partner_ids] == ["adv-shortlisted"]
      refute_received {:fetch, _, _}

      assert output =~ "candidate_count=1"
      assert output =~ "imported_candidates=1"

      assert %ImportRun{query: %{"providerFeedId" => "feed-shortlisted"}} =
               Repo.get_by!(ImportRun, source_id: source.id, surface: "shoppingProducts")

      imported_feed_ids = imported_feed_ids(source)

      assert imported_feed_ids == [shortlisted.provider_feed_id]
      refute pending.provider_feed_id in imported_feed_ids

      assert shortlisted.provider_feed_id == "feed-shortlisted"
    end

    test "imports a discovered feed candidate by feed id without an advertiser id" do
      source = source_fixture()

      candidate =
        insert_candidate!(source, %{
          advertiser_id: nil,
          provider_feed_id: "feed-without-advertiser",
          review_status: "shortlisted"
        })

      parent = self()

      fetcher = fn cursor, opts ->
        send(parent, {:fetch, cursor, opts})
        {:ok, product_validation_fixture(), nil}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{candidates_imported: 1, candidates_matched: 1, persisted: 1}} =
                   CjImport.run_import(
                     fetcher: fetcher,
                     limit: 1,
                     pages: 1,
                     provider_feed_ids: [candidate.provider_feed_id]
                   )
        end)

      assert_receive {:fetch, nil, opts}
      assert opts[:ad_ids] == ["feed-without-advertiser"]
      assert opts[:partner_ids] == nil

      assert output =~ "candidate_count=1"
      assert output =~ "imported_candidates=1"

      assert %ImportRun{
               query: %{
                 "adIds" => ["feed-without-advertiser"],
                 "providerFeedId" => "feed-without-advertiser"
               },
               records_persisted: 1,
               status: "succeeded"
             } = Repo.get_by!(ImportRun, source_id: source.id, surface: "shoppingProducts")
    end

    test "imports every explicitly requested feed candidate without applying the default candidate cap" do
      source = source_fixture()

      requested_feed_ids =
        Enum.map(1..51, fn index ->
          feed_id = "feed-explicit-#{index}"

          insert_candidate!(source, %{
            advertiser_id: "adv-explicit-#{index}",
            advertiser_name: "Explicit Merchant #{index}",
            feed_name: "Explicit Feed #{index}",
            provider_feed_id: feed_id,
            review_status: "pending"
          })

          feed_id
        end)

      parent = self()

      fetcher = fn _cursor, opts ->
        send(parent, {:fetch, Keyword.fetch!(opts, :provider_feed_id), opts})
        {:ok, [], nil}
      end

      capture_io(fn ->
        assert {:ok, %{candidates_imported: 51, candidates_matched: 51}} =
                 CjImport.run_import(
                   fetcher: fetcher,
                   limit: 1,
                   pages: 1,
                   provider_feed_ids: requested_feed_ids
                 )
      end)

      fetched_feed_ids =
        Enum.map(requested_feed_ids, fn _feed_id ->
          assert_receive {:fetch, provider_feed_id, opts}
          assert opts[:ad_ids] == [provider_feed_id]
          provider_feed_id
        end)

      assert MapSet.new(fetched_feed_ids) == MapSet.new(requested_feed_ids)
      refute_received {:fetch, _, _}
      assert Repo.aggregate(ImportRun, :count, :id) == 51
    end

    test "candidate import summary includes persisted page counts when a later page fetch fails" do
      source = source_fixture()

      candidate =
        insert_candidate!(source, %{
          advertiser_id: "adv-partial",
          provider_feed_id: "feed-partial",
          review_status: "shortlisted"
        })

      fetcher = fn
        nil, _opts -> {:ok, product_validation_fixture(), 1}
        1, _opts -> {:error, :provider_timeout}
      end

      output =
        capture_io(fn ->
          assert {:error,
                  {:candidate_import_failures,
                   %{
                     candidate_failures: 1,
                     candidates_imported: 0,
                     candidates_matched: 1,
                     failed: 0,
                     fetched: 1,
                     normalized: 1,
                     pages_fetched: 1,
                     persisted: 1
                   }}} =
                   CjImport.run_import(
                     fetcher: fetcher,
                     limit: 1,
                     pages: 2,
                     provider_feed_ids: [candidate.provider_feed_id]
                   )
        end)

      assert output =~ "candidate_failures=1"
      assert output =~ "fetched=1 normalized=1 persisted=1 failed=0 pages_fetched=1"

      assert %ImportRun{
               status: "failed",
               error_summary: "fetch_failed",
               pages_fetched: 1,
               records_fetched: 1,
               records_normalized: 1,
               records_persisted: 1,
               records_failed: 0
             } = Repo.get_by!(ImportRun, source_id: source.id, surface: "shoppingProducts")
    end

    test "can suppress report output for background callers" do
      fetcher = fn _cursor, _opts ->
        {:ok, product_validation_fixture(), nil}
      end

      output =
        capture_io(fn ->
          assert {:ok, %{failed: 0, fetched: 1, normalized: 1, persisted: 1}} =
                   CjImport.run_import(
                     fetcher: fetcher,
                     keywords: ["shoe"],
                     limit: 1,
                     print_report: false
                   )
        end)

      assert output == ""
    end

    test "reuses an existing CJ source by unique key" do
      existing_source =
        %Source{}
        |> Source.changeset(%{kind: "affiliate_feed", name: "CJ"})
        |> Repo.insert!()

      fetcher = fn _cursor, _opts ->
        {:ok, product_validation_fixture(), nil}
      end

      capture_io(fn ->
        assert {:ok, %{failed: 0, fetched: 1, normalized: 1, persisted: 1}} =
                 CjImport.run_import(fetcher: fetcher, keywords: ["shoe"], limit: 1)
      end)

      assert %{domain: "cj.com"} = Repo.get!(Source, existing_source.id)
      assert Repo.aggregate(Source, :count, :id) == 1

      assert %ImportRun{source_id: source_id, status: "succeeded"} =
               Repo.get_by!(ImportRun, surface: "shoppingProducts")

      assert source_id == existing_source.id
    end

    test "returns an error when fetched rows fail normalization" do
      fetcher = fn _cursor, _opts ->
        {:ok,
         [
           %{
             "adId" => "CJ-BAD-PRICE",
             "advertiserId" => "924501",
             "advertiserName" => "Trail Shop",
             "buyUrl" => "https://trail.example/products/bad-price",
             "currency" => "USD",
             "lastUpdated" => "2026-05-23T15:00:00Z",
             "name" => "Bad Price",
             "price" => "free"
           }
         ], nil}
      end

      output =
        capture_io(fn ->
          assert {:error,
                  {:row_failures,
                   %{failed: 1, fetched: 1, normalized: 0, pages_fetched: 1, persisted: 0}}} =
                   CjImport.run_import(fetcher: fetcher, keywords: ["shoe"], limit: 1)
        end)

      assert output =~ "fetched=1 normalized=0 persisted=0 failed=1 pages_fetched=1"

      assert %ImportRun{
               status: "failed",
               records_fetched: 1,
               records_normalized: 0,
               records_persisted: 0,
               records_failed: 1
             } = Repo.get_by!(ImportRun, surface: "shoppingProducts")
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
               CjImport.run_import(
                 fetcher: fetcher,
                 keywords: ["shoe"],
                 limit: 1,
                 print_report: false
               )

      assert %ImportRun{status: "failed", error_summary: "fetch_failed"} =
               Repo.get_by!(ImportRun, surface: "shoppingProducts")
    end

    test "marks the import run failed when the page fetch raises after the run starts" do
      fetcher = fn _cursor, _opts ->
        raise "provider secret should not be persisted"
      end

      assert {:error, :runner_exception} =
               CjImport.run_import(
                 fetcher: fetcher,
                 keywords: ["shoe"],
                 limit: 1,
                 print_report: false
               )

      assert %ImportRun{
               status: "failed",
               error_summary: "fetch_failed",
               pages_fetched: 0,
               records_fetched: 0,
               records_normalized: 0,
               records_persisted: 0,
               records_failed: 0
             } = Repo.get_by!(ImportRun, surface: "shoppingProducts")
    end
  end

  describe "run/1 credential preflight" do
    test "prints the product import credential surface" do
      output = capture_io(fn -> assert :ok = CjImport.run(["--check-credentials"]) end)

      assert output =~ "provider=cj"
      assert output =~ "surface=shoppingProducts"
      assert output =~ "ready=false"
      assert output =~ "missing_required=CJ_API_TOKEN,CJ_ACCOUNT_ID"
    end

    test "raises with only missing env var names when readiness is required" do
      assert_raise Mix.Error,
                   "missing CJ credentials: CJ_API_TOKEN,CJ_ACCOUNT_ID",
                   fn ->
                     capture_io(fn ->
                       CjImport.run(["--check-credentials", "--require-ready"])
                     end)
                   end
    end
  end

  defp product_validation_fixture do
    "test/support/fixtures/cj/product_validation_sample.redacted.json"
    |> File.read!()
    |> Jason.decode!()
    |> Map.fetch!("products")
  end

  defp second_product_validation_fixture do
    product_validation_fixture()
    |> hd()
    |> Map.merge(%{
      "adId" => "REDACTED-CJ-AD-2",
      "gtin" => "00000000000001",
      "link" => "https://merchant.example/products/redacted-shopping-product-2",
      "price" => %{"amount" => "89.99", "currency" => "USD"},
      "title" => "Second Redacted Shopping Product"
    })
    |> List.wrap()
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{kind: "affiliate_feed", name: "CJ #{suffix}", domain: "cj-#{suffix}.example"},
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp insert_candidate!(source, attrs) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          last_seen_at: DateTime.utc_now(),
          product_count: 10,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: DateTime.utc_now(),
          raw_metadata: %{},
          review_status: "pending",
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(attrs)
    |> Repo.insert!()
  end

  defp imported_feed_ids(source) do
    ImportRun
    |> where([run], run.source_id == ^source.id)
    |> where([run], run.surface == "shoppingProducts")
    |> select([run], run.query)
    |> Repo.all()
    |> Enum.map(&Map.get(&1, "providerFeedId"))
  end

  defp restore_env(name, nil), do: System.delete_env(name)
  defp restore_env(name, value), do: System.put_env(name, value)
end
