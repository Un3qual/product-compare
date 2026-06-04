defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.ImportRun
  alias ProductCompareSchemas.Ingestion.MerchantSourceIdentity
  alias ProductCompareSchemas.Pricing.MerchantProduct
  alias ProductCompareSchemas.Pricing.PricePoint
  alias ProductCompareSchemas.Specs.ExternalProduct
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareSchemas.Specs.SourceArtifact

  describe "run_import/1" do
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
      assert_receive {:logger_level, :warning}
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
end
