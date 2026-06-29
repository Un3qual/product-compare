defmodule Mix.Tasks.ProductCompare.Ingestion.CjCandidateStalenessTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjCandidateStaleness
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Ingestion.MerchantFeedCandidate
  alias ProductCompareSchemas.Specs.Source
  alias ProductCompareWeb.GraphQL.GlobalId

  describe "run/1" do
    test "prints stale candidates for the default filters" do
      source = source_fixture()

      stale_pending_candidate =
        candidate_fixture(source, %{
          advertiser_id: "adv-stale-pending",
          advertiser_name: "Peak Trail",
          provider_feed_id: "cj-feed-stale-pending",
          review_status: "pending",
          last_seen_at: days_ago(20),
          product_count: 12_000
        })

      candidate_fixture(source, %{
        advertiser_id: "adv-fresh-pending",
        advertiser_name: "Fresh Trail",
        provider_feed_id: "cj-feed-fresh-pending",
        review_status: "pending",
        last_seen_at: hours_ago(3)
      })

      candidate_fixture(source, %{
        provider: "shopify",
        advertiser_id: "adv-noncj",
        advertiser_name: "Shopify Seller",
        provider_feed_id: "non-cj-feed",
        review_status: "pending",
        last_seen_at: days_ago(40)
      })

      candidate_fixture(source, %{
        advertiser_id: "adv-stale-shortlisted",
        advertiser_name: "Shelve Trail",
        provider_feed_id: "cj-feed-stale-shortlisted",
        review_status: "shortlisted",
        last_seen_at: days_ago(21)
      })

      output = capture_io(fn -> CjCandidateStaleness.run([]) end)

      assert output =~ "provider=cj max_age_hours=168 stale_count=2 status=all"

      {:ok, candidate_id} =
        GlobalId.encode_required(:merchant_feed_candidate, stale_pending_candidate.id)

      assert output =~ "candidate_id=#{candidate_id}"
      assert output =~ "provider_feed_id=#{stale_pending_candidate.provider_feed_id}"
      assert output =~ "advertiser_id=#{stale_pending_candidate.advertiser_id}"
      assert output =~ ~s(advertiser_name="Peak Trail")
      assert output =~ "review_status=pending"
      assert output =~ "age_hours=480"
      refute output =~ "adv-fresh-pending"
      assert output =~ "adv-stale-shortlisted"
      refute output =~ "adv-noncj"
    end

    test "filters by status" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-pending-1",
        advertiser_name: "Alpha Trail",
        provider_feed_id: "cj-feed-pending",
        review_status: "pending",
        last_seen_at: days_ago(20)
      })

      candidate_fixture(source, %{
        advertiser_id: "adv-shortlisted-1",
        advertiser_name: "Shortlisted Trail",
        provider_feed_id: "cj-feed-shortlisted",
        review_status: "shortlisted",
        last_seen_at: days_ago(20)
      })

      output = capture_io(fn -> CjCandidateStaleness.run(["--status", "pending"]) end)

      assert output =~ "provider=cj max_age_hours=168 stale_count=1 status=pending"
      assert output =~ "advertiser_id=adv-pending-1"
      refute output =~ "adv-shortlisted-1"
    end

    test "supports max age hours with limit" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-pending-old",
        provider_feed_id: "cj-feed-pending-old",
        review_status: "pending",
        last_seen_at: days_ago(40)
      })

      candidate_fixture(source, %{
        advertiser_id: "adv-shortlisted-old",
        provider_feed_id: "cj-feed-shortlisted-old",
        review_status: "shortlisted",
        last_seen_at: days_ago(30)
      })

      candidate_fixture(source, %{
        advertiser_id: "adv-dismissed-old",
        provider_feed_id: "cj-feed-dismissed-old",
        review_status: "dismissed",
        last_seen_at: days_ago(20)
      })

      output = capture_io(fn -> CjCandidateStaleness.run(["--status", "all", "--limit", "1"]) end)

      assert output =~ "provider=cj max_age_hours=168 stale_count=1 status=all"
      assert Regex.scan(~r/candidate_id=/, output) |> length() == 1
      refute output =~ "adv-shortlisted-old"
      refute output =~ "adv-dismissed-old"

      output =
        capture_io(fn -> CjCandidateStaleness.run(["--max-age-hours", "24", "--limit", "1"]) end)

      assert output =~ "provider=cj max_age_hours=24 stale_count=1 status=all"
      assert output =~ "age_hours="
      assert Regex.scan(~r/candidate_id=/, output) |> length() == 1
    end

    test "raises when stale candidates are present and require_fresh is requested" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-stale",
        provider_feed_id: "cj-feed-stale",
        review_status: "pending",
        last_seen_at: days_ago(30)
      })

      assert_raise Mix.Error, "stale CJ feed candidates found", fn ->
        capture_io(fn -> CjCandidateStaleness.run(["--status", "pending", "--require-fresh"]) end)
      end
    end

    test "prints zero stale count when no rows are stale" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-fresh",
        provider_feed_id: "cj-feed-fresh",
        review_status: "pending",
        last_seen_at: days_ago(1)
      })

      output = capture_io(fn -> CjCandidateStaleness.run([]) end)

      assert output =~ "provider=cj max_age_hours=168 stale_count=0 status=all"
      assert output =~ ~r/\n$/
      refute output =~ "candidate_id="
    end

    test "never prints secrets or raw provider payload fields" do
      source = source_fixture()

      candidate_fixture(source, %{
        advertiser_id: "adv-stale-secret",
        provider_feed_id: "cj-feed-stale-secret",
        review_status: "pending",
        last_seen_at: days_ago(30),
        raw_metadata: %{
          "token_marker" => "credential-marker",
          "account_id_marker" => "acct-1234",
          "tracking_parameter_marker" => "tracking-parameter-marker",
          "provider_payload_marker" => "provider-payload-marker"
        },
        review_note: "do-not-print-marker"
      })

      output = capture_io(fn -> CjCandidateStaleness.run([]) end)

      refute output =~ "credential-marker"
      refute output =~ "acct-1234"
      refute output =~ "tracking-parameter-marker"
      refute output =~ "provider-payload-marker"
      refute output =~ "do-not-print-marker"
    end

    test "rejects unsupported status values" do
      assert_raise Mix.Error, "invalid review status: archived", fn ->
        capture_io(fn -> CjCandidateStaleness.run(["--status", "archived"]) end)
      end
    end

    test "rejects malformed CLI input" do
      assert_raise Mix.Error, "unsupported option: --bogus", fn ->
        capture_io(fn -> CjCandidateStaleness.run(["--bogus"]) end)
      end

      assert_raise Mix.Error, "unexpected argument: extra", fn ->
        capture_io(fn -> CjCandidateStaleness.run(["extra"]) end)
      end

      assert_raise Mix.Error, "invalid value for --limit: many", fn ->
        capture_io(fn -> CjCandidateStaleness.run(["--limit", "many"]) end)
      end

      assert_raise Mix.Error, "invalid --limit: expected a positive integer", fn ->
        capture_io(fn -> CjCandidateStaleness.run(["--limit", "0"]) end)
      end

      assert_raise Mix.Error, "invalid --max-age-hours: expected a positive integer", fn ->
        capture_io(fn -> CjCandidateStaleness.run(["--max-age-hours", "0"]) end)
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
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: hours_ago(22),
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

  defp days_ago(days) do
    DateTime.utc_now()
    |> DateTime.add(-days * 24 * 60 * 60, :second)
    |> DateTime.truncate(:second)
  end

  defp hours_ago(hours) do
    DateTime.utc_now()
    |> DateTime.add(-hours * 60 * 60, :second)
    |> DateTime.truncate(:second)
  end
end
