defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateFitGapsTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidateFitGaps
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareWeb.GraphQL.GlobalId

  setup do
    Repo.delete_all(MerchantFeedCandidate)
    :ok
  end

  describe "run/1" do
    test "reports only pending CJ candidates and summarizes fit gaps" do
      source = source_fixture()

      low_fit_candidate =
        candidate_fixture(source, %{
          advertiser_id: "adv-low-fit",
          advertiser_name: "Low Fit",
          provider_feed_id: "cj-feed-low",
          advertiser_country: "CA",
          currency: "CAD",
          language: "FR",
          product_count: 50,
          source_feed_type: nil
        })

      _launch_fit_candidate =
        candidate_fixture(source, %{
          advertiser_id: "adv-launch-fit",
          advertiser_name: "Launch Fit",
          provider_feed_id: "cj-feed-launch",
          advertiser_country: "US",
          currency: "USD",
          language: "EN",
          source_feed_type: "SHOPPING",
          product_count: 12_000
        })

      candidate_fixture(source, %{
        provider: "shopify",
        advertiser_id: "adv-noncj",
        advertiser_name: "Shopify Seller",
        provider_feed_id: "shopify-feed",
        advertiser_country: "US",
        currency: "USD",
        language: "EN",
        source_feed_type: "SHOPPING",
        product_count: 1_000
      })

      output = capture_io(fn -> CjCandidateFitGaps.run([]) end)

      {:ok, low_fit_candidate_id} =
        GlobalId.encode_required(:merchant_feed_candidate, low_fit_candidate.id)

      assert output =~
               "provider=cj status=pending candidate_count=2 country_not_us=1 currency_not_usd=1 language_not_en=1 missing_product_count=0 low_product_count=1 missing_source_feed_type=1"

      assert output =~ "candidate_id=#{low_fit_candidate_id}"
      assert output =~ "provider_feed_id=#{low_fit_candidate.provider_feed_id}"
      assert output =~ "advertiser_id=#{low_fit_candidate.advertiser_id}"
      assert output =~ "gap_count=5"

      assert output =~
               "gaps=country_not_us,currency_not_usd,language_not_en,low_product_count,missing_source_feed_type"

      assert output =~ "advertiser_name=\"Launch Fit\""
      assert output =~ "gap_count=0"
      assert output =~ "gaps="
      assert output =~ "review_status=pending"
      refute output =~ "provider_feed_id=shopify-feed"
    end

    test "reports launch-fit candidates with zero gaps" do
      source = source_fixture()

      launch_fit_candidate =
        candidate_fixture(source, %{
          advertiser_id: "adv-launch-fit",
          advertiser_name: "Launch Fit Merchant",
          provider_feed_id: "cj-feed-launch",
          product_count: 12_000,
          source_feed_type: "SHOPPING"
        })

      output = capture_io(fn -> CjCandidateFitGaps.run([]) end)

      {:ok, launch_fit_id} =
        GlobalId.encode_required(:merchant_feed_candidate, launch_fit_candidate.id)

      assert output =~
               "provider=cj status=pending candidate_count=1 country_not_us=0 currency_not_usd=0 language_not_en=0 missing_product_count=0 low_product_count=0 missing_source_feed_type=0"

      assert output =~ "candidate_id=#{launch_fit_id}"
      assert output =~ "provider_feed_id=#{launch_fit_candidate.provider_feed_id}"
      assert output =~ "gap_count=0"
      assert output =~ "gaps="
    end

    test "includes shortlisted candidates when status is all" do
      source = source_fixture()

      shortlisted_candidate =
        candidate_fixture(source, %{
          review_status: "shortlisted",
          advertiser_id: "adv-shortlisted",
          advertiser_name: "Shortlisted Candidate",
          provider_feed_id: "cj-feed-shortlisted",
          advertiser_country: "CA",
          currency: "USD",
          language: "EN",
          product_count: 500
        })

      _pending_candidate =
        candidate_fixture(source, %{
          review_status: "pending",
          advertiser_id: "adv-pending",
          advertiser_name: "Pending Candidate",
          provider_feed_id: "cj-feed-pending",
          advertiser_country: "US",
          currency: "USD",
          language: "EN",
          source_feed_type: "SHOPPING",
          product_count: 10_000
        })

      output = capture_io(fn -> CjCandidateFitGaps.run(["--status", "all"]) end)

      {:ok, shortlisted_candidate_id} =
        GlobalId.encode_required(:merchant_feed_candidate, shortlisted_candidate.id)

      assert output =~ "provider=cj status=all candidate_count=2"
      assert output =~ "candidate_id=#{shortlisted_candidate_id}"
      assert output =~ "advertiser_id=#{shortlisted_candidate.advertiser_id}"
      assert output =~ "gaps=country_not_us"
    end

    test "honors the limit flag" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_name: "Low Fit",
        provider_feed_id: "cj-feed-low",
        advertiser_country: "CA",
        currency: "CAD",
        language: "FR",
        product_count: 50,
        source_feed_type: nil
      })

      candidate_fixture(source, %{
        advertiser_name: "Launch Fit",
        provider_feed_id: "cj-feed-launch",
        advertiser_country: "US",
        currency: "USD",
        language: "EN",
        source_feed_type: "SHOPPING",
        product_count: 12_000
      })

      output = capture_io(fn -> CjCandidateFitGaps.run(["--limit", "1"]) end)

      assert output =~ "candidate_count=1"
      assert Regex.scan(~r/candidate_id=/, output) |> length() == 1
    end

    test "never prints secret or raw provider fields" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_name: "Secret Candidate",
        provider_feed_id: "cj-feed-safe",
        raw_metadata: %{
          "token_marker" => "credential-marker",
          "account_id_marker" => "acct-1234",
          "tracking_parameter_marker" => "tracking-parameter-marker",
          "provider_payload_marker" => "provider-payload-marker"
        },
        review_note: "do-not-print-marker",
        product_count: 12_000,
        source_feed_type: "SHOPPING"
      })

      output = capture_io(fn -> CjCandidateFitGaps.run([]) end)

      refute output =~ "credential-marker"
      refute output =~ "acct-1234"
      refute output =~ "tracking-parameter-marker"
      refute output =~ "provider-payload-marker"
      refute output =~ "do-not-print-marker"
    end

    test "rejects malformed CLI input" do
      assert_raise Mix.Error, "unsupported option: --bogus", fn ->
        capture_io(fn -> CjCandidateFitGaps.run(["--bogus"]) end)
      end

      assert_raise Mix.Error, "unexpected argument: extra", fn ->
        capture_io(fn -> CjCandidateFitGaps.run(["extra"]) end)
      end

      assert_raise Mix.Error, "invalid value for --limit: many", fn ->
        capture_io(fn -> CjCandidateFitGaps.run(["--limit", "many"]) end)
      end

      assert_raise Mix.Error, "invalid --limit: expected a positive integer", fn ->
        capture_io(fn -> CjCandidateFitGaps.run(["--limit", "0"]) end)
      end
    end
  end

  defp source_fixture(attrs \\ %{}) do
    suffix = "#{System.unique_integer([:positive])}-#{System.system_time(:nanosecond)}"

    %Source{}
    |> Source.changeset(
      Map.merge(
        %{
          kind: "affiliate_feed",
          name: "CJ #{suffix}",
          domain: "cj-#{suffix}.example"
        },
        attrs
      )
    )
    |> Repo.insert!()
  end

  defp candidate_fixture(source, attrs) do
    attrs =
      Map.merge(
        %{
          source_id: source.id,
          provider: "cj",
          provider_feed_id: "feed-1#{System.unique_integer([:positive])}",
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          product_count: 1,
          source_feed_type: "SHOPPING",
          provider_last_updated_at: DateTime.utc_now(),
          raw_metadata: %{},
          last_seen_at: DateTime.utc_now(),
          review_status: "pending"
        },
        attrs
      )

    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(attrs)
    |> Repo.insert!()
  end
end
