defmodule Mix.Tasks.ProductCompare.Ingestion.CjImportTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjImport
  alias ProductCompare.Repo
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

      assert Repo.aggregate(SourceArtifact, :count, :id) == 1
      assert Repo.aggregate(ExternalProduct, :count, :id) == 1
      assert Repo.aggregate(MerchantSourceIdentity, :count, :id) == 1
      assert Repo.aggregate(MerchantProduct, :count, :id) == 1
      assert Repo.aggregate(PricePoint, :count, :id) == 1

      assert Repo.get_by!(SourceArtifact, source_id: source_id).raw_json ==
               hd(product_validation_fixture())
    end
  end

  defp product_validation_fixture do
    "test/support/fixtures/cj/product_validation_sample.redacted.json"
    |> File.read!()
    |> Jason.decode!()
    |> Map.fetch!("products")
  end
end
