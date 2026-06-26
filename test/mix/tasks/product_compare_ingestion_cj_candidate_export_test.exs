defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateExportTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidateExport
  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  @csv_header "provider,provider_feed_id,advertiser_id,advertiser_name,advertiser_country,currency,language,feed_name,product_count,fit_score,fit_reasons,review_note,last_seen_at"

  describe "run/1" do
    test "defaults to exporting only shortlisted CJ candidates" do
      source = source_fixture()
      shortlisted = candidate_fixture(source, %{provider_feed_id: "feed-shortlisted"})
      pending = candidate_fixture(source, %{provider_feed_id: "feed-pending"})
      dismissed = candidate_fixture(source, %{provider_feed_id: "feed-dismissed"})

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(shortlisted.id, %{
                 review_status: "shortlisted",
                 review_note: "Application fit"
               })

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(dismissed.id, %{
                 review_status: "dismissed",
                 review_note: "Low catalog fit"
               })

      output = capture_io(fn -> CjCandidateExport.run([]) end)

      assert first_csv_line(output) == @csv_header
      assert output =~ "feed-shortlisted"
      assert output =~ "Application fit"
      refute output =~ pending.provider_feed_id
      refute output =~ dismissed.provider_feed_id
    end

    test "exports fit score columns and sorts shortlisted candidates by score by default" do
      source = source_fixture()

      high_fit =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_name: "Zeta Outfitters",
          currency: "USD",
          feed_name: "Primary Product Feed",
          language: "EN",
          product_count: 5000,
          provider_feed_id: "feed-high-fit",
          source_feed_type: "PRODUCT"
        })

      low_fit =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_name: "Alpha Imports",
          currency: "CAD",
          feed_name: "Regional Feed",
          language: "FR",
          product_count: 12,
          provider_feed_id: "feed-low-fit",
          raw_metadata: %{
            "secret_marker" => "do-not-print",
            "tracking" => "do-not-print"
          },
          source_feed_type: nil
        })

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(high_fit.id, %{
                 review_status: "shortlisted",
                 review_note: "Strong fit"
               })

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(low_fit.id, %{
                 review_status: "shortlisted",
                 review_note: "Weak fit"
               })

      output = capture_io(fn -> CjCandidateExport.run([]) end)
      lines = csv_lines(output)

      assert Enum.at(lines, 0) == @csv_header
      assert Enum.at(lines, 1) =~ "feed-high-fit"
      assert Enum.at(lines, 1) =~ ",85,1000+ products;US market;USD;English;feed type present,"
      assert Enum.at(lines, 2) =~ "feed-low-fit"
      assert Enum.at(lines, 2) =~ ",10,any products,"
      refute output =~ "secret_marker"
      refute output =~ "do-not-print"
    end

    test "--sort name preserves name feed and feed id ordering" do
      source = source_fixture()

      high_fit =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_name: "Zeta Outfitters",
          currency: "USD",
          feed_name: "Primary Product Feed",
          language: "EN",
          product_count: 5000,
          provider_feed_id: "feed-high-fit",
          source_feed_type: "PRODUCT"
        })

      low_fit =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_name: "Alpha Imports",
          currency: "CAD",
          feed_name: "Regional Feed",
          language: "FR",
          product_count: 12,
          provider_feed_id: "feed-low-fit",
          source_feed_type: nil
        })

      same_name_later_feed =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_name: "Alpha Imports",
          currency: "CAD",
          feed_name: "Z Regional Feed",
          language: "FR",
          product_count: 12,
          provider_feed_id: "feed-low-fit-z",
          source_feed_type: nil
        })

      for candidate <- [high_fit, low_fit, same_name_later_feed] do
        assert {:ok, _candidate} =
                 Ingestion.review_merchant_feed_candidate(candidate.id, %{
                   review_status: "shortlisted"
                 })
      end

      output = capture_io(fn -> CjCandidateExport.run(["--sort", "name"]) end)
      lines = csv_lines(output)

      assert Enum.at(lines, 1) =~ "feed-low-fit"
      assert Enum.at(lines, 2) =~ "feed-low-fit-z"
      assert Enum.at(lines, 3) =~ "feed-high-fit"
    end

    test "exports pending candidates when requested" do
      source = source_fixture()
      pending = candidate_fixture(source, %{provider_feed_id: "feed-pending"})
      shortlisted = candidate_fixture(source, %{provider_feed_id: "feed-shortlisted"})

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(shortlisted.id, %{
                 review_status: "shortlisted"
               })

      output = capture_io(fn -> CjCandidateExport.run(["--status", "pending"]) end)

      assert output =~ "feed-pending"
      refute output =~ shortlisted.provider_feed_id
      assert output =~ DateTime.to_iso8601(pending.last_seen_at)
    end

    test "exports dismissed candidates when requested" do
      source = source_fixture()
      dismissed = candidate_fixture(source, %{provider_feed_id: "feed-dismissed"})
      shortlisted = candidate_fixture(source, %{provider_feed_id: "feed-shortlisted"})

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(dismissed.id, %{
                 review_status: "dismissed",
                 review_note: "Already covered"
               })

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(shortlisted.id, %{
                 review_status: "shortlisted"
               })

      output = capture_io(fn -> CjCandidateExport.run(["--status", "dismissed"]) end)

      assert output =~ "feed-dismissed"
      assert output =~ "Already covered"
      refute output =~ shortlisted.provider_feed_id
    end

    test "escapes CSV values containing commas, quotes, carriage returns, or newlines" do
      source = source_fixture()

      candidate =
        candidate_fixture(source, %{
          advertiser_name: "Trail, \"Peak\" Co",
          feed_name: "Main\r\nShopping Feed",
          provider_feed_id: "feed-escaped"
        })

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(candidate.id, %{
                 review_status: "shortlisted",
                 review_note: "Apply, then \"verify\"\nASAP"
               })

      output = capture_io(fn -> CjCandidateExport.run([]) end)

      assert output =~ ~s("Trail, ""Peak"" Co")
      assert output =~ "\"Main\r\nShopping Feed\""
      assert output =~ "\"Apply, then \"\"verify\"\"\nASAP\""
    end

    test "does not export raw metadata keys or values" do
      source = source_fixture()
      candidate = candidate_fixture(source)

      assert {:ok, _candidate} =
               Ingestion.review_merchant_feed_candidate(candidate.id, %{
                 review_status: "shortlisted",
                 review_note: "Safe note"
               })

      output = capture_io(fn -> CjCandidateExport.run([]) end)

      refute output =~ "raw_metadata"
      refute output =~ "secret_marker"
      refute output =~ "do-not-print"
    end

    test "rejects invalid review statuses" do
      assert_raise Mix.Error, "invalid review status: approved", fn ->
        capture_io(fn -> CjCandidateExport.run(["--status", "approved"]) end)
      end
    end

    test "rejects invalid sort values" do
      assert_raise Mix.Error, "invalid sort: newest", fn ->
        capture_io(fn -> CjCandidateExport.run(["--sort", "newest"]) end)
      end
    end
  end

  defp candidate_fixture(source, attrs \\ %{}) do
    attrs =
      Map.merge(
        %{
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          last_seen_at: ~U[2026-06-04 20:00:00Z],
          product_count: 10,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: ~U[2026-06-04 18:34:49Z],
          raw_metadata: %{"secret_marker" => "do-not-print"},
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    assert {:ok, candidate} = Ingestion.upsert_merchant_feed_candidate(source, attrs)

    candidate
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = System.unique_integer([:positive])

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp csv_lines(output) do
    output
    |> String.trim_trailing("\n")
    |> String.split("\n")
  end

  defp first_csv_line(output) do
    output
    |> csv_lines()
    |> List.first()
  end
end
