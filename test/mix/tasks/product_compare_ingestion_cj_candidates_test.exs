defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidatesTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidates
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareWeb.GraphQL.GlobalId

  describe "run/1" do
    test "prints stale CJ candidates without raw provider fields" do
      source = source_fixture()

      stale =
        candidate_fixture(source, %{
          advertiser_id: "adv-stale",
          advertiser_name: "Peak Trail",
          provider_feed_id: "cj-feed-stale",
          review_status: "pending",
          last_seen_at: days_ago(20),
          raw_metadata: %{"token" => "do-not-print"},
          review_note: "also-do-not-print"
        })

      candidate_fixture(source, %{
        advertiser_id: "adv-fresh",
        provider_feed_id: "cj-feed-fresh",
        last_seen_at: hours_ago(2)
      })

      candidate_fixture(source, %{
        provider: "shopify",
        advertiser_id: "adv-noncj",
        provider_feed_id: "non-cj-feed",
        last_seen_at: days_ago(40)
      })

      output = capture_io(fn -> CjCandidates.run(["--report", "stale"]) end)

      {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, stale.id)

      assert output =~ "provider=cj report=stale max_age_hours=168 stale_count=1 status=all"
      assert output =~ "candidate_id=#{candidate_id}"
      assert output =~ "provider_feed_id=cj-feed-stale"
      assert output =~ ~s(advertiser_name="Peak Trail")
      refute output =~ "adv-fresh"
      refute output =~ "adv-noncj"
      refute output =~ "do-not-print"
      refute output =~ "also-do-not-print"
    end

    test "reports fit gaps for pending candidates" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_country: "CA",
        advertiser_id: "adv-gap",
        currency: "CAD",
        language: "FR",
        product_count: 25,
        provider_feed_id: "feed-gap",
        source_feed_type: nil
      })

      output = capture_io(fn -> CjCandidates.run(["--report", "fit-gaps"]) end)

      assert output =~ "provider=cj report=fit-gaps status=pending candidate_count=1"
      assert output =~ "country_not_us=1"
      assert output =~ "currency_not_usd=1"
      assert output =~ "language_not_en=1"
      assert output =~ "low_product_count=1"
      assert output =~ "missing_source_feed_type=1"

      assert output =~
               "gaps=country_not_us,currency_not_usd,language_not_en,low_product_count,missing_source_feed_type"
    end

    test "prints application cohort in markdown format" do
      source = source_fixture()

      shortlisted =
        candidate_fixture(source, %{
          advertiser_id: "adv-shortlisted",
          advertiser_name: "Table | Merchant",
          provider_feed_id: "feed-shortlisted",
          feed_name: "Outdoor | Feed",
          product_count: 5_000,
          review_status: "shortlisted",
          review_note: "ready"
        })

      candidate_fixture(source, %{
        advertiser_id: "adv-pending",
        provider_feed_id: "feed-pending",
        review_status: "pending"
      })

      output =
        capture_io(fn ->
          CjCandidates.run([
            "--report",
            "application-cohort",
            "--format",
            "markdown",
            "--min-product-count",
            "1000"
          ])
        end)

      {:ok, candidate_id} = GlobalId.encode_required(:merchant_feed_candidate, shortlisted.id)

      assert output =~ "# CJ Application Cohort"
      assert output =~ "count=1"
      assert output =~ candidate_id
      assert output =~ "Table \\| Merchant"
      assert output =~ "Outdoor \\| Feed"
      assert output =~ "present"
      refute output =~ "adv-pending"
    end

    test "rejects removed CSV export report" do
      assert_raise Mix.Error, "CJ candidate CSV export is not supported", fn ->
        capture_io(fn -> CjCandidates.run(["--report", "export"]) end)
      end
    end
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

  defp candidate_fixture(source, attrs) do
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
          product_count: 1_500,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: hours_ago(22),
          raw_metadata: %{},
          last_seen_at: DateTime.utc_now(),
          review_status: "pending",
          source_feed_type: "SHOPPING"
        },
        attrs
      )

    %MerchantFeedCandidate{}
    |> MerchantFeedCandidate.changeset(attrs)
    |> Repo.insert!()
  end

  defp days_ago(days) do
    DateTime.utc_now()
    |> DateTime.add(-days, :day)
    |> DateTime.truncate(:microsecond)
  end

  defp hours_ago(hours) do
    DateTime.utc_now()
    |> DateTime.add(-hours, :hour)
    |> DateTime.truncate(:microsecond)
  end
end
