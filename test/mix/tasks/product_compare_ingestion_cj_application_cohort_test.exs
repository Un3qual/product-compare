defmodule Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohortTest do
  use ProductCompare.DataCase, async: false

  import ExUnit.CaptureIO

  alias Mix.Tasks.ProductCompare.Ingestion.CjApplicationCohort
  alias ProductCompare.Ingestion
  alias ProductCompare.Repo
  alias ProductCompareSchemas.Specs.Source

  describe "run/1" do
    setup do
      source = source_fixture()

      shortlisted_us =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-us",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          product_count: 12_000,
          provider_feed_id: "feed-shortlisted-us",
          review_note: "manual-review-note-body",
          review_status: "shortlisted",
          reviewed_at: ~U[2026-06-26 12:00:00Z]
        })

      shortlisted_ca =
        candidate_fixture(source, %{
          advertiser_country: "CA",
          advertiser_id: "adv-ca",
          advertiser_name: "North Merchant",
          currency: "CAD",
          feed_name: "CA Shopping",
          language: "EN",
          product_count: 8_000,
          provider_feed_id: "feed-shortlisted-ca",
          review_status: "shortlisted",
          reviewed_at: ~U[2026-06-26 12:30:00Z]
        })

      pending =
        candidate_fixture(source, %{
          advertiser_country: "US",
          advertiser_id: "adv-pending",
          advertiser_name: "Pending Merchant",
          currency: "USD",
          feed_name: "Pending Shopping",
          language: "EN",
          product_count: 20_000,
          provider_feed_id: "feed-pending",
          review_status: "pending"
        })

      %{
        pending: pending,
        shortlisted_ca: shortlisted_ca,
        shortlisted_us: shortlisted_us
      }
    end

    test "defaults to shortlisted CJ application cohort candidates", %{
      pending: pending,
      shortlisted_ca: shortlisted_ca,
      shortlisted_us: shortlisted_us
    } do
      output = capture_io(fn -> CjApplicationCohort.run([]) end)

      assert output =~ "provider=cj cohort_status=shortlisted count=2"
      assert output =~ "advertiser_id=#{shortlisted_us.advertiser_id}"
      assert output =~ ~s(advertiser_name="Trail Merchant")
      assert output =~ "advertiser_id=#{shortlisted_ca.advertiser_id}"
      assert output =~ ~s(advertiser_name="North Merchant")
      refute output =~ pending.advertiser_id
      refute output =~ "Pending Merchant"
    end

    test "includes pending candidates when requested", %{
      pending: pending,
      shortlisted_us: shortlisted_us
    } do
      output = capture_io(fn -> CjApplicationCohort.run(["--status", "pending"]) end)

      assert output =~ "provider=cj cohort_status=pending count=1"
      assert output =~ "advertiser_id=#{pending.advertiser_id}"
      assert output =~ ~s(advertiser_name="Pending Merchant")
      refute output =~ shortlisted_us.advertiser_id
    end

    test "filters launch-fit candidates by market and minimum product count", %{
      pending: pending,
      shortlisted_ca: shortlisted_ca,
      shortlisted_us: shortlisted_us
    } do
      output =
        capture_io(fn ->
          CjApplicationCohort.run([
            "--country",
            "US",
            "--currency",
            "USD",
            "--language",
            "EN",
            "--min-product-count",
            "10000"
          ])
        end)

      assert output =~ "provider=cj cohort_status=shortlisted count=1"
      assert output =~ "advertiser_id=#{shortlisted_us.advertiser_id}"
      assert output =~ "country=US"
      assert output =~ "currency=USD"
      assert output =~ "language=EN"
      assert output =~ "product_count=12000"
      refute output =~ shortlisted_ca.advertiser_id
      refute output =~ pending.advertiser_id
    end

    test "limits printed candidate rows" do
      output = capture_io(fn -> CjApplicationCohort.run(["--limit", "1"]) end)

      assert output =~ "provider=cj cohort_status=shortlisted count=1"
      assert Regex.scan(~r/candidate_id=/, output) |> length() == 1
    end

    test "raises when candidates are required and filters remove every row" do
      assert_raise Mix.Error, "no CJ application cohort candidates found", fn ->
        capture_io(fn ->
          CjApplicationCohort.run(["--country", "ZZ", "--require-candidates"])
        end)
      end
    end

    test "rejects unsupported review statuses" do
      assert_raise Mix.Error, "invalid review status: approved", fn ->
        capture_io(fn ->
          CjApplicationCohort.run(["--status", "approved"])
        end)
      end
    end

    test "prints note presence without notes or raw provider details" do
      output = capture_io(fn -> CjApplicationCohort.run([]) end)

      assert output =~ "review_note_present=true"
      refute output =~ "manual-review-note-body"
      refute output =~ "raw_metadata"
      refute output =~ "raw-metadata-marker"
      refute output =~ "credential-token-marker"
      refute output =~ "account-id-marker"
      refute output =~ "provider-payload-marker"
      refute output =~ "tracking-parameter-marker"
    end
  end

  defp candidate_fixture(source, attrs) do
    attrs =
      Map.merge(
        %{
          advertiser_country: "US",
          advertiser_id: "adv-1",
          advertiser_name: "Trail Merchant",
          currency: "USD",
          feed_name: "US Shopping",
          language: "EN",
          last_seen_at: ~U[2026-06-26 12:00:00Z],
          product_count: 1,
          provider: "cj",
          provider_feed_id: "feed-1",
          provider_last_updated_at: ~U[2026-06-26 11:00:00Z],
          raw_metadata: %{
            "account_id_marker" => "account-id-marker",
            "provider_payload_marker" => "provider-payload-marker",
            "raw_metadata_marker" => "raw-metadata-marker",
            "tracking_parameter_marker" => "tracking-parameter-marker",
            "token_marker" => "credential-token-marker"
          },
          review_status: "pending",
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
end
